import { useState, useEffect, useRef, useCallback } from 'react';

// Generate a random room code
export function generateRoomId() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => chars[b % chars.length])
    .join('');
}

const RELAY_URLS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.place',
  'wss://purplerelay.com',
  'wss://nostr.data.haus',
];

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

  useEffect(() => {
    if (!actualRoomId) { setStatus('error'); return; }

    let cancelled = false;

    async function setup() {
      try {
        const turnConfig = await getTurnConfig();
        if (cancelled) return;

        const { joinRoom, getRelaySockets } = await import('trystero/nostr');
        if (cancelled) return;

        const roomConfig = {
          appId: 'helios-p2p-chat-v1',
          relayRedundancy: 5,
          relayUrls: RELAY_URLS,
        };
        if (turnConfig) roomConfig.turnConfig = turnConfig;

        const room = joinRoom(roomConfig, actualRoomId);

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

        room.onPeerJoin(() => {
          if (!isGuest && hasGuestRef.current) return;
          hasGuestRef.current = true;
          setReconnecting(false);
          setStatus('connected');
          setPeerCount(c => c + 1);
        });

        room.onPeerLeave(() => {
          hasGuestRef.current = false;
          setPeerCount(c => Math.max(0, c - 1));
          setReconnecting(true);
          setStatus('waiting');
        });

        const updateRelays = () => {
          try {
            const sockets = getRelaySockets();
            setRelayStatus(RELAY_URLS.map(url => ({
              url,
              connected: sockets[url]?.readyState === 1,
              state: sockets[url]?.readyState ?? -1,
            })));
          } catch { /* ignore */ }
        };
        updateRelays();
        intervalRef.current = setInterval(updateRelays, 2000);

        setStatus('waiting');

      } catch (err) {
        if (!cancelled) {
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

  return { peerId: actualRoomId, messages, sendMessage, status, reconnecting, peerCount, relayStatus, leave };
}
