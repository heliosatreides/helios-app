import { useState, useEffect, useRef, useCallback } from 'react';

// Generate a random room code
export function generateRoomId() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => chars[b % chars.length])
    .join('');
}

// Don't override relayUrls — let trystero pick deterministically from its
// full pool based on appId (deriveFromAppId=true), so host and guest always
// land on the same relays regardless of when they join.
// relayRedundancy=10 gives wider overlap margin.
const RELAY_REDUNDANCY = 10;

// Returns { turnConfig, rtcConfig } for joinRoom
// turnConfig = TURN-only servers (trystero merges with its defaults)
// rtcConfig = full override if needed
async function getTurnConfig() {
  try {
    const res = await fetch('/api/turn');
    if (res.ok) {
      const data = await res.json();
      if (data.iceServers?.length) {
        // Split STUN vs TURN — trystero's turnConfig is for TURN/credential servers
        const turnServers = data.iceServers.filter(s =>
          [].concat(s.urls).some(u => u.startsWith('turn:') || u.startsWith('turns:'))
        );
        return turnServers.length ? turnServers : null;
      }
    }
  } catch { /* fallback */ }
  return null;
}

export function usePeer({ isGuest = false, roomId = null } = {}) {
  const [peerId] = useState(() => isGuest ? null : roomId || generateRoomId());
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('initializing');
  const [reconnecting, setReconnecting] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [relayStatus, setRelayStatus] = useState([]);

  const roomRef = useRef(null);
  const sendRef = useRef(null);
  const hasGuestRef = useRef(false);
  const intervalRef = useRef(null);

  const actualRoomId = isGuest ? roomId : peerId;

  const sendMessage = useCallback((text) => {
    if (!sendRef.current || !text.trim()) return;
    const msg = { text: text.trim(), timestamp: Date.now() };
    sendRef.current(msg);
    setMessages(prev => [...prev, { text: text.trim(), from: 'you', timestamp: msg.timestamp }]);
  }, []);

  const leave = useCallback(() => {
    clearInterval(intervalRef.current);
    if (roomRef.current) {
      roomRef.current.leave();
      roomRef.current = null;
    }
  }, []);

  const [debugLog, setDebugLog] = useState([]);
  const addDebug = useCallback((msg) => {
    console.log('[P2P]', msg);
    setDebugLog(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`]);
  }, []);

  useEffect(() => {
    if (!actualRoomId) { setStatus('error'); return; }

    let cancelled = false;

    async function setup() {
      try {
        addDebug('Fetching TURN config...');
        const turnConfig = await getTurnConfig();
        addDebug(`TURN: ${turnConfig ? turnConfig.length + ' servers' : 'none (STUN only)'}`);
        if (cancelled) return;

        addDebug('Loading trystero/nostr...');
        const { joinRoom, getRelaySockets } = await import('trystero/nostr');
        addDebug('Trystero loaded');
        if (cancelled) return;

        const roomConfig = {
          appId: 'helios-p2p-chat-v1',
          relayRedundancy: RELAY_REDUNDANCY,
        };
        if (turnConfig) roomConfig.turnConfig = turnConfig;

        addDebug(`Joining room "${actualRoomId}" with redundancy=${RELAY_REDUNDANCY}...`);
        const room = joinRoom(roomConfig, actualRoomId);
        addDebug('Room joined (waiting for relays)');

        roomRef.current = room;

        const [sendMsg, onMsg] = room.makeAction('msg');
        sendRef.current = sendMsg;

        onMsg((data) => {
          setMessages(prev => [...prev, {
            text: data.text,
            from: 'them',
            timestamp: data.timestamp ?? Date.now(),
          }]);
        });

        room.onPeerJoin((peerId) => {
          addDebug(`onPeerJoin: ${peerId}`);
          if (!isGuest && hasGuestRef.current) return;
          hasGuestRef.current = true;
          setReconnecting(false);
          setStatus('connected');
          setPeerCount(c => c + 1);
        });

        room.onPeerLeave((peerId) => {
          addDebug(`onPeerLeave: ${peerId}`);
          hasGuestRef.current = false;
          setPeerCount(c => Math.max(0, c - 1));
          setReconnecting(true);
          setStatus('waiting');
        });

        // Track relay count for UI indicator
        const updateRelays = () => {
          try {
            const sockets = getRelaySockets();
            const entries = Object.entries(sockets);
            const connected = entries.filter(([, s]) => s?.readyState === 1).length;
            const total = entries.length;
            setRelayStatus([{ connected, total }]);
            // Log relay changes
            if (total > 0) {
              addDebug(`Relays: ${connected}/${total} connected`);
            }
          } catch (e) { addDebug(`Relay check error: ${e.message}`); }
        };
        // Delay first check to let relays connect
        setTimeout(updateRelays, 2000);
        intervalRef.current = setInterval(updateRelays, 3000);

        setStatus('waiting');

      } catch (err) {
        if (!cancelled) {
          addDebug(`Setup error: ${err.message}`);
          console.error('Chat setup error:', err);
          setStatus('error');
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      if (roomRef.current) { roomRef.current.leave(); roomRef.current = null; }
    };
  }, [actualRoomId, isGuest]);

  return { peerId: actualRoomId, messages, sendMessage, status, reconnecting, peerCount, relayStatus, leave, debugLog };
}
