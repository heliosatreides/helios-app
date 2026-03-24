import { useState, useEffect, useRef, useCallback } from 'react';

// Generate a random room code
export function generateRoomId() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => chars[b % chars.length])
    .join('');
}

// Generate a 4-digit PIN (in memory only, never persisted)
export function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

const RELAY_URLS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.place',
  'wss://purplerelay.com',
  'wss://nostr.data.haus',
];

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
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
  ];
}

export function usePeer({ isGuest = false, roomId = null } = {}) {
  const [peerId] = useState(() => isGuest ? null : roomId || generateRoomId());
  const [pin] = useState(() => isGuest ? null : generatePin());

  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('initializing');
  // pinStatus: 'idle' (host) | 'pending' (guest waiting to enter) | 'submitting' | 'verified' | 'rejected'
  const [pinStatus, setPinStatus] = useState(isGuest ? 'pending' : 'idle');
  const [reconnecting, setReconnecting] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [relayStatus, setRelayStatus] = useState([]);

  const roomRef = useRef(null);
  const sendRef = useRef(null);
  const sendPinVerifyRef = useRef(null);
  const sendPinResultRef = useRef(null);
  const hasGuestRef = useRef(false);
  const intervalRef = useRef(null);
  const pinRef = useRef(pin);
  // Store last attempted PIN so we can resend after reconnect
  const lastPinAttemptRef = useRef(null);

  const actualRoomId = isGuest ? roomId : peerId;

  const sendMessage = useCallback((text) => {
    if (!sendRef.current || !text.trim()) return;
    const msg = { text: text.trim(), timestamp: Date.now() };
    sendRef.current(msg);
    setMessages(prev => [...prev, { text: text.trim(), from: 'you', timestamp: msg.timestamp }]);
  }, []);

  // Guest calls this to submit a PIN attempt
  const submitPin = useCallback((attempt) => {
    if (!sendPinVerifyRef.current) return;
    lastPinAttemptRef.current = attempt;
    setPinStatus('submitting');
    sendPinVerifyRef.current({ pin: attempt });
  }, []);

  // Explicit leave
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
        const iceServers = await getIceServers();
        if (cancelled) return;

        const { joinRoom, getRelaySockets } = await import('trystero/nostr');
        if (cancelled) return;

        const room = joinRoom({
          appId: 'helios-p2p-chat-v1',
          rtcConfig: { iceServers },
          relayRedundancy: 5,
          relayUrls: RELAY_URLS,
        }, actualRoomId);

        roomRef.current = room;

        const [sendMsg, onMsg] = room.makeAction('msg');
        sendRef.current = sendMsg;

        const [sendPinVerify, onPinVerify] = room.makeAction('pin-verify');
        const [sendPinResult, onPinResult] = room.makeAction('pin-result');
        sendPinVerifyRef.current = sendPinVerify;
        sendPinResultRef.current = sendPinResult;

        onMsg((data) => {
          setMessages(prev => [...prev, {
            text: data.text,
            from: 'them',
            timestamp: data.timestamp ?? Date.now(),
          }]);
        });

        // Host: verify incoming PIN attempts
        if (!isGuest) {
          onPinVerify((data) => {
            const correct = data.pin === pinRef.current;
            sendPinResultRef.current({ ok: correct });
          });
        }

        // Guest: receive PIN result
        if (isGuest) {
          onPinResult((data) => {
            if (data.ok) {
              setPinStatus('verified');
              setStatus('connected');
            } else {
              setPinStatus('rejected');
            }
          });
        }

        room.onPeerJoin(() => {
          if (!isGuest && hasGuestRef.current) return;
          hasGuestRef.current = true;
          setReconnecting(false);
          setPeerCount(c => c + 1);

          if (!isGuest) {
            setStatus('connected');
          } else {
            // Guest rejoined — if already verified, go straight to connected
            // If not, go back to pending so they can re-enter PIN
            setPinStatus(prev => {
              if (prev === 'verified') {
                setStatus('connected');
                return 'verified';
              }
              // Resend last attempt automatically if we have one
              if (lastPinAttemptRef.current && sendPinVerifyRef.current) {
                sendPinVerifyRef.current({ pin: lastPinAttemptRef.current });
                return 'submitting';
              }
              return 'pending';
            });
          }
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

  return {
    peerId: actualRoomId,
    pin,
    messages,
    sendMessage,
    submitPin,
    pinStatus,
    status,
    reconnecting,
    peerCount,
    relayStatus,
    leave,
  };
}
