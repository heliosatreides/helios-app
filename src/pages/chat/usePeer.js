import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

// Generate a random room code
export function generateRoomId() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => chars[b % chars.length])
    .join('');
}

// Prefix room IDs so PeerJS IDs don't collide with other apps
const PEER_PREFIX = 'helios-chat-';

// Timing constants — tuned for sub-3s connection on happy path
const SIGNAL_OPEN_TIMEOUT_MS = 4000;    // If signaling 'open' doesn't fire, destroy + retry
const ICE_TIMEOUT_MS = 6000;            // If DataConnection 'open' doesn't fire, retry ICE
const PEER_UNAVAILABLE_RETRY_MS = 2000; // Guest retry when host not yet registered
const CONN_FAILURE_RETRY_MS = 1500;     // Retry after connection close/failure
const SIGNALING_HEALTH_MS = 5000;       // Poll signaling health + send keepalive every 5s

// Fetch TURN + STUN servers from our Vercel proxy
async function getIceServers() {
  try {
    const res = await fetch('/api/turn');
    if (res.ok) {
      const data = await res.json();
      if (data.iceServers?.length) return data.iceServers;
    }
  } catch { /* fallback */ }
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ];
}

export function usePeer({ isGuest = false, roomId = null } = {}) {
  const [peerId] = useState(() => isGuest ? null : roomId || generateRoomId());
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('initializing');
  const [reconnecting, setReconnecting] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [effectiveRoomId, setEffectiveRoomId] = useState(null);

  const peerRef = useRef(null);
  const connRef = useRef(null);
  const hasGuestRef = useRef(false);
  const retryTimerRef = useRef(null);
  const masterRetryRef = useRef(null);
  const openTimeoutRef = useRef(null);
  const signalingTimeoutRef = useRef(null);
  const signalingHealthRef = useRef(null);

  const actualRoomId = isGuest ? roomId : (peerId ?? roomId);

  const [debugLog, setDebugLog] = useState([]);
  const addDebug = useCallback((msg) => {
    console.log('[P2P]', msg);
    setDebugLog(prev => [...prev.slice(-30), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  const sendMessage = useCallback((text) => {
    if (!connRef.current?.open || !text.trim()) return;
    const msg = { text: text.trim(), timestamp: Date.now() };
    connRef.current.send(msg);
    setMessages(prev => [...prev, { text: text.trim(), from: 'you', timestamp: msg.timestamp }]);
  }, []);

  const leave = useCallback(() => {
    if (connRef.current) { connRef.current.close(); connRef.current = null; }
    if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
  }, []);

  useEffect(() => {
    if (!actualRoomId) { setStatus('error'); return; }

    let cancelled = false;

    // Defer for StrictMode
    const tid = setTimeout(() => { if (!cancelled) setup(); }, 0);

    async function setup() {
      try {
        addDebug('Fetching ICE servers...');
        const iceServers = await getIceServers();
        addDebug(`ICE: ${iceServers.length} servers`);
        if (cancelled) return;

        // Force relay-only when TURN credentials are present — more reliable through NAT
        const hasTurn = iceServers.some(s => {
          const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
          return urls.some(u => u.startsWith('turn:') || u.startsWith('turns:'));
        });
        addDebug(`TURN available: ${hasTurn}`);

        const peerConfig = {
          config: {
            iceServers,
            // Pre-gather ICE candidates while signaling handshake is in-flight —
            // shaves ~100-300ms off the first connection attempt.
            iceCandidatePoolSize: 1,
            ...(hasTurn ? { iceTransportPolicy: 'relay' } : {}),
          },
          debug: 1,
        };

        // startSignalingHealth starts a periodic health-check for the signaling WebSocket.
        // PeerJS's signaling server (0.peerjs.com) drops idle WebSocket connections after ~30s.
        // Two defenses:
        //   1. Send a HEARTBEAT message every SIGNALING_HEALTH_MS to keep the WS alive.
        //   2. Poll peer.disconnected and call peer.reconnect() if the socket dropped anyway.
        // When the host reconnects it re-registers the same peer ID so guests can still find it.
        function startSignalingHealth(peer) {
          clearInterval(signalingHealthRef.current);
          signalingHealthRef.current = setInterval(() => {
            if (cancelled || peerRef.current !== peer) {
              clearInterval(signalingHealthRef.current);
              return;
            }
            if (peer.destroyed) {
              clearInterval(signalingHealthRef.current);
              return;
            }
            if (peer.disconnected) {
              addDebug('Signaling health: disconnected — reconnecting...');
              peer.reconnect();
            } else {
              addDebug(`Signaling health: ok (open=${peer.open})`);
              // Send HEARTBEAT to prevent the signaling WS from timing out at ~30s idle.
              // peer.socket is PeerJS's Socket wrapper; send() queues if not yet open.
              try { peer.socket.send({ type: 'HEARTBEAT' }); } catch { /* non-fatal */ }
            }
          }, SIGNALING_HEALTH_MS);
        }

        // setupConn wires up events for a DataConnection.
        // onConnectionClosed is called after the 'close' event fires (used by guest to auto-retry),
        // but ONLY when this connection is still the active one — not when it was already superseded
        // by a retry. Without this guard, explicitly closing a stale conn in attemptConnect would
        // fire the old callback and schedule a second concurrent retry, cascading indefinitely.
        function setupConn(conn, onConnectionClosed) {
          // Cancel any pending ICE timeout from a prior attempt
          clearTimeout(openTimeoutRef.current);

          // Close stale connection if we're replacing it (its close handler will see
          // connRef.current !== conn and skip the retry callback — see close handler below)
          if (connRef.current && connRef.current !== conn) {
            connRef.current.close();
          }
          connRef.current = conn;
          addDebug(`DataConnection to ${conn.peer}`);

          // Log underlying RTCPeerConnection ICE transitions — the most useful signal
          // for diagnosing why 'open' doesn't fire. Also force-close on 'failed' because
          // PeerJS doesn't always emit a DataConnection 'close' event on ICE failure.
          const pc = conn.peerConnection;
          if (pc) {
            pc.addEventListener('icegatheringstatechange', () => {
              addDebug(`ICE gathering: ${pc.iceGatheringState}`);
            });
            pc.addEventListener('iceconnectionstatechange', () => {
              addDebug(`ICE state: ${pc.iceConnectionState}`);
              if (pc.iceConnectionState === 'failed') {
                addDebug('ICE failed — closing to trigger retry');
                conn.close();
              }
            });
            pc.addEventListener('connectionstatechange', () => {
              addDebug(`PC state: ${pc.connectionState}`);
            });
            // Log initial states so we can see the baseline in debug output
            addDebug(`ICE state (initial): ${pc.iceConnectionState}`);
          } else {
            addDebug('RTCPeerConnection not yet available on conn');
          }

          // ICE timeout: if 'open' hasn't fired in ICE_TIMEOUT_MS the negotiation stalled.
          // We null out connRef BEFORE calling close() so the close handler sees it's already
          // superseded and won't double-fire onConnectionClosed.  We then trigger the retry
          // directly here instead of relying on the 'close' event — PeerJS does not reliably
          // emit 'close' for connections that never completed the SDP exchange.
          openTimeoutRef.current = setTimeout(() => {
            if (connRef.current === conn && !conn.open) {
              addDebug('ICE negotiation timed out — closing to trigger retry');
              connRef.current = null;
              conn.close();
              hasGuestRef.current = false;
              setPeerCount(0);
              setReconnecting(true);
              setStatus('waiting');
              if (!cancelled) onConnectionClosed?.();
            }
          }, ICE_TIMEOUT_MS);

          conn.on('open', () => {
            clearTimeout(openTimeoutRef.current);
            if (cancelled) return;
            addDebug('Connection OPEN — ready to chat');
            hasGuestRef.current = true;
            setReconnecting(false);
            setStatus('connected');
            setPeerCount(1);
          });

          conn.on('data', (data) => {
            setMessages(prev => [...prev, {
              text: data.text,
              from: 'them',
              timestamp: data.timestamp ?? Date.now(),
            }]);
          });

          conn.on('close', () => {
            clearTimeout(openTimeoutRef.current);
            if (connRef.current === conn) {
              // This was the active connection — clean up and notify caller so it can retry.
              addDebug('Connection closed');
              hasGuestRef.current = false;
              connRef.current = null;
              setPeerCount(0);
              setReconnecting(true);
              setStatus('waiting');
              onConnectionClosed?.();
            } else {
              // Connection was already superseded (e.g. closed intentionally during a retry).
              // Do NOT call onConnectionClosed — that would schedule a duplicate retry and
              // cascade into an ever-growing flood of concurrent connection attempts.
              addDebug('Stale connection closed (already superseded — ignoring)');
            }
          });

          conn.on('error', (err) => {
            addDebug(`Connection error: ${err.type || err.message}`);
          });
        }

        if (isGuest) {
          // Guest: create anonymous peer, then connect to host with persistent retry.
          // attemptConnect is defined first so createGuestPeer can close over it.
          function attemptConnect() {
            const currentPeer = peerRef.current;
            if (cancelled || !currentPeer || currentPeer.destroyed) return;
            // Cancel any retry that was already scheduled — we're starting a fresh attempt now.
            clearTimeout(retryTimerRef.current);
            addDebug(`Connecting to host: ${PEER_PREFIX}${actualRoomId}`);

            // Close any stale connection before starting a fresh ICE exchange.
            // Setting connRef.current = null BEFORE calling close() ensures the close handler
            // sees connRef.current !== conn and skips the retry callback (no cascade).
            if (connRef.current) {
              const stale = connRef.current;
              connRef.current = null;
              stale.close();
            }
            clearTimeout(openTimeoutRef.current);

            // serialization:'json' skips PeerJS's binary encoding overhead for faster
            // DataChannel open — we send plain objects so JSON is a natural fit.
            const conn = currentPeer.connect(PEER_PREFIX + actualRoomId, { reliable: true, serialization: 'json' });
            setupConn(conn, () => {
              // Auto-retry when connection closes (ICE timeout, remote close, etc.)
              if (!cancelled) {
                addDebug(`Connection lost, retrying in ${CONN_FAILURE_RETRY_MS}ms...`);
                clearTimeout(retryTimerRef.current);
                clearTimeout(masterRetryRef.current);
                retryTimerRef.current = setTimeout(attemptConnect, CONN_FAILURE_RETRY_MS);
              }
            });
            setStatus('waiting');

            // Master retry watchdog: if we haven't opened ICE_TIMEOUT_MS + 2s after starting,
            // force a fresh attempt.  This is a safety net for cases where the ICE timeout
            // triggers conn.close() but the 'close' event silently drops (seen with 0.peerjs.com
            // signaling relay dropping offer/answer packets during SDP exchange).
            clearTimeout(masterRetryRef.current);
            masterRetryRef.current = setTimeout(() => {
              if (!cancelled && !connRef.current?.open) {
                addDebug('Master retry watchdog: still not connected — forcing new attempt');
                attemptConnect();
              }
            }, ICE_TIMEOUT_MS + 2000);
          }

          function createGuestPeer() {
            if (cancelled) return;
            addDebug('Creating guest peer...');
            const peer = new Peer(peerConfig);
            peerRef.current = peer;

            // Signaling open timeout: if the server doesn't acknowledge us in time,
            // destroy and recreate — handles slow or transiently unreachable signaling.
            clearTimeout(signalingTimeoutRef.current);
            signalingTimeoutRef.current = setTimeout(() => {
              if (cancelled || peer !== peerRef.current || peer.open) return;
              addDebug('Signaling open timed out — recreating peer...');
              peerRef.current = null;
              peer.destroy();
              setTimeout(() => { if (!cancelled) createGuestPeer(); }, 300);
            }, SIGNAL_OPEN_TIMEOUT_MS);

            peer.on('open', (id) => {
              clearTimeout(signalingTimeoutRef.current);
              addDebug(`Guest peer open: ${id}`);
              if (cancelled) return;
              startSignalingHealth(peer);
              attemptConnect();
            });

            peer.on('error', (err) => {
              addDebug(`Peer error: ${err.type} — ${err.message}`);
              if (err.type === 'peer-unavailable') {
                // Host not online yet — keep retrying
                addDebug(`Host not available, retrying in ${PEER_UNAVAILABLE_RETRY_MS}ms...`);
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = setTimeout(attemptConnect, PEER_UNAVAILABLE_RETRY_MS);
              } else if (err.type === 'network' || err.type === 'server-error') {
                // Signaling server trouble — recreate the peer entirely
                addDebug('Signaling server error — recreating peer in 1s...');
                clearTimeout(signalingTimeoutRef.current);
                clearInterval(signalingHealthRef.current);
                if (peerRef.current === peer) {
                  peerRef.current = null;
                  peer.destroy();
                  setTimeout(() => { if (!cancelled) createGuestPeer(); }, 1000);
                }
              } else if (!cancelled) {
                setStatus('error');
              }
            });

            peer.on('disconnected', () => {
              addDebug('Peer disconnected from signaling server');
              if (!cancelled && peerRef.current === peer) peerRef.current.reconnect();
            });
          }

          createGuestPeer();

        } else {
          // Host: create peer with known ID (retry with suffix if ID is taken)
          function createHostPeer(suffix = '') {
            const hostPeerId = PEER_PREFIX + actualRoomId + suffix;
            addDebug(`Creating host peer: ${hostPeerId}`);
            const peer = new Peer(hostPeerId, peerConfig);
            peerRef.current = peer;

            // Signaling open timeout: recreate if registration stalls
            clearTimeout(signalingTimeoutRef.current);
            signalingTimeoutRef.current = setTimeout(() => {
              if (cancelled || peer !== peerRef.current || peer.open) return;
              addDebug('Host signaling timed out — recreating peer...');
              peerRef.current = null;
              peer.destroy();
              setTimeout(() => { if (!cancelled) createHostPeer(suffix); }, 300);
            }, SIGNAL_OPEN_TIMEOUT_MS);

            peer.on('open', (id) => {
              clearTimeout(signalingTimeoutRef.current);
              addDebug(`Host peer open: ${id}`);
              if (cancelled) return;
              // Strip prefix so callers see just the room code
              setEffectiveRoomId(actualRoomId + suffix);
              setStatus('waiting');
              // Keep the signaling WebSocket alive so guests can reach us indefinitely
              startSignalingHealth(peer);
            });

            peer.on('connection', (conn) => {
              addDebug(`Incoming connection from ${conn.peer}`);
              if (hasGuestRef.current) {
                addDebug('Already have a guest, rejecting');
                conn.close();
                return;
              }
              // Pass no onConnectionClosed callback — host just waits for guest to retry
              setupConn(conn);
            });

            peer.on('error', (err) => {
              addDebug(`Peer error: ${err.type} — ${err.message}`);
              if (err.type === 'unavailable-id') {
                // ID collision (e.g. stale registration) — retry with random suffix
                clearTimeout(signalingTimeoutRef.current);
                clearInterval(signalingHealthRef.current);
                addDebug('Peer ID taken, retrying with suffix...');
                peer.destroy();
                if (!cancelled) {
                  const newSuffix = suffix + '-' + Math.random().toString(36).slice(2, 5);
                  createHostPeer(newSuffix);
                }
              } else if (err.type === 'network' || err.type === 'server-error') {
                addDebug('Host signaling server error — retrying in 1s...');
                clearTimeout(signalingTimeoutRef.current);
                clearInterval(signalingHealthRef.current);
                if (peerRef.current === peer) {
                  peerRef.current = null;
                  peer.destroy();
                  setTimeout(() => { if (!cancelled) createHostPeer(suffix); }, 1000);
                }
              }
            });

            peer.on('disconnected', () => {
              addDebug('Peer disconnected from signaling server');
              // reconnect() re-registers the same peer ID so guests can reach us again
              if (!cancelled && peerRef.current === peer) peerRef.current.reconnect();
            });
          }

          createHostPeer();
        }

      } catch (err) {
        if (!cancelled) {
          addDebug(`Setup error: ${err.message}`);
          console.error('Chat setup error:', err);
          setStatus('error');
        }
      }
    }

    return () => {
      cancelled = true;
      clearTimeout(tid);
      clearTimeout(retryTimerRef.current);
      clearTimeout(masterRetryRef.current);
      clearTimeout(openTimeoutRef.current);
      clearTimeout(signalingTimeoutRef.current);
      clearInterval(signalingHealthRef.current);
      if (connRef.current) { connRef.current.close(); connRef.current = null; }
      if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
    };
  }, [actualRoomId, isGuest]);

  return { peerId: effectiveRoomId ?? actualRoomId, messages, sendMessage, status, reconnecting, peerCount, leave, debugLog };
}
