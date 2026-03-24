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

// Fetch short-lived Cloudflare TURN credentials (free, no account needed)
async function getIceServers() {
  const base = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ];

  try {
    const res = await fetch('https://rtc.live.cloudflare.com/v1/turn/keys/free/credentials/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: 86400 }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.iceServers?.length) {
        return [...base, ...data.iceServers];
      }
    }
  } catch { /* fallback to STUN only */ }

  // Fallback TURN if Cloudflare fails
  return [
    ...base,
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ];
}

export function usePeer({ isGuest = false, roomId = null } = {}) {
  const [peerId] = useState(() => isGuest ? null : roomId || generateRoomId());
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('initializing');
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

  useEffect(() => {
    if (!actualRoomId) { setStatus('error'); return; }

    let cancelled = false;

    async function setup() {
      try {
        // Fetch TURN credentials before joining
        const iceServers = await getIceServers();
        if (cancelled) return;

        const { joinRoom, getRelaySockets } = await import('trystero/nostr');
        if (cancelled) return;

        const room = joinRoom({
          appId: 'helios-p2p-chat-v1',
          // Pass ICE servers as rtcConfig so WebRTC uses our TURN servers
          rtcConfig: { iceServers },
          relayRedundancy: 5,
          relayUrls: RELAY_URLS,
        }, actualRoomId);

        roomRef.current = room;

        const [sendMsg, onMsg] = room.makeAction('msg');
        sendRef.current = sendMsg;

        onMsg((data) => {
          setMessages(prev => [...prev, {
            text: data.text,
            from: 'them',
            timestamp: data.timestamp ?? Date.now()
          }]);
        });

        room.onPeerJoin(() => {
          if (!isGuest && hasGuestRef.current) return; // ignore 2nd guest
          hasGuestRef.current = true;
          setStatus('connected');
          setPeerCount(c => c + 1);
        });

        room.onPeerLeave(() => {
          hasGuestRef.current = false;
          setPeerCount(c => Math.max(0, c - 1));
          setStatus('disconnected');
        });

        // Poll relay status
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

  return { peerId: actualRoomId, messages, sendMessage, status, peerCount, relayStatus };
}
