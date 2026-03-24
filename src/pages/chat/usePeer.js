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

        const peerConfig = {
          config: { iceServers },
          debug: 0, // 0=none, 1=errors, 2=warnings, 3=all
        };

        function setupConn(conn) {
          connRef.current = conn;
          addDebug(`DataConnection to ${conn.peer}`);

          conn.on('open', () => {
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
            addDebug('Connection closed');
            hasGuestRef.current = false;
            connRef.current = null;
            setPeerCount(0);
            setReconnecting(true);
            setStatus('waiting');
          });

          conn.on('error', (err) => {
            addDebug(`Connection error: ${err.type || err.message}`);
          });
        }

        if (isGuest) {
          // Guest: create anonymous peer, then connect to host with persistent retry
          addDebug('Creating guest peer...');
          const peer = new Peer(peerConfig);
          peerRef.current = peer;

          function attemptConnect() {
            if (cancelled || !peerRef.current) return;
            addDebug(`Connecting to host: ${PEER_PREFIX}${actualRoomId}`);
            const conn = peer.connect(PEER_PREFIX + actualRoomId, { reliable: true });
            setupConn(conn);
            setStatus('waiting');
          }

          peer.on('open', (id) => {
            addDebug(`Guest peer open: ${id}`);
            if (cancelled) return;
            attemptConnect();
          });

          peer.on('error', (err) => {
            addDebug(`Peer error: ${err.type} — ${err.message}`);
            if (err.type === 'peer-unavailable') {
              // Host not online yet — keep retrying every 3s
              addDebug('Host not available, retrying in 3s...');
              clearTimeout(retryTimerRef.current);
              retryTimerRef.current = setTimeout(attemptConnect, 3000);
            } else if (!cancelled) {
              setStatus('error');
            }
          });

          peer.on('disconnected', () => {
            addDebug('Peer disconnected from signaling server');
            if (!cancelled && peerRef.current) peerRef.current.reconnect();
          });

        } else {
          // Host: create peer with known ID (retry with suffix if ID is taken)
          function createHostPeer(suffix = '') {
            const hostPeerId = PEER_PREFIX + actualRoomId + suffix;
            addDebug(`Creating host peer: ${hostPeerId}`);
            const peer = new Peer(hostPeerId, peerConfig);
            peerRef.current = peer;

            peer.on('open', (id) => {
              addDebug(`Host peer open: ${id}`);
              if (cancelled) return;
              // Strip prefix so callers see just the room code
              setEffectiveRoomId(actualRoomId + suffix);
              setStatus('waiting');
            });

            peer.on('connection', (conn) => {
              addDebug(`Incoming connection from ${conn.peer}`);
              if (hasGuestRef.current) {
                addDebug('Already have a guest, rejecting');
                conn.close();
                return;
              }
              setupConn(conn);
            });

            peer.on('error', (err) => {
              addDebug(`Peer error: ${err.type} — ${err.message}`);
              if (err.type === 'unavailable-id') {
                // ID collision (e.g. stale registration) — retry with random suffix
                addDebug('Peer ID taken, retrying with suffix...');
                peer.destroy();
                if (!cancelled) {
                  const newSuffix = suffix + '-' + Math.random().toString(36).slice(2, 5);
                  createHostPeer(newSuffix);
                }
              }
            });

            peer.on('disconnected', () => {
              addDebug('Peer disconnected from signaling server');
              if (!cancelled && peerRef.current) peerRef.current.reconnect();
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
      if (connRef.current) { connRef.current.close(); connRef.current = null; }
      if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
    };
  }, [actualRoomId, isGuest]);

  return { peerId: effectiveRoomId ?? actualRoomId, messages, sendMessage, status, reconnecting, peerCount, leave, debugLog };
}
