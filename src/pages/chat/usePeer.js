import { useState, useEffect, useRef, useCallback } from 'react';

// Generate a random room code
export function generateRoomId() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => chars[b % chars.length])
    .join('');
}

export function usePeer({ isGuest = false, roomId = null } = {}) {
  const [peerId] = useState(() => isGuest ? null : roomId || generateRoomId());
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('initializing');
  const [peerCount, setPeerCount] = useState(0);
  const [relayStatus, setRelayStatus] = useState([]); // [{ url, connected }]

  const roomRef = useRef(null);
  const sendRef = useRef(null);
  const hasGuestRef = useRef(false);

  const actualRoomId = isGuest ? roomId : peerId;

  const sendMessage = useCallback((text) => {
    if (!sendRef.current || !text.trim()) return;
    const msg = { text: text.trim(), timestamp: Date.now() };
    sendRef.current(msg);
    setMessages(prev => [...prev, { text: text.trim(), from: 'you', timestamp: msg.timestamp }]);
  }, []);

  useEffect(() => {
    if (!actualRoomId) {
      setStatus('error');
      return;
    }

    let cancelled = false;

    async function setup() {
      try {
        // Dynamic import so it doesn't break SSR/tests
        const { joinRoom, getRelaySockets } = await import('trystero/nostr');

        if (cancelled) return;

        const appId = 'helios-p2p-chat-v1';

        // Pin to a small set of fast, well-known Nostr relays
        // instead of Trystero's random 75+ relay list
        const relayRedundancy = 5; // connect to ALL relays so host+guest always share at least one

        // Trystero uses `turnConfig` array specifically for TURN servers
        // TURN is essential for cross-device connections behind strict NAT/carrier networks
        const turnConfig = [
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
          },
          {
            urls: 'turn:relay1.expressturn.com:3478',
            username: 'efIGKFN0G6FR9K7OFO',
            credential: 'GBEjqnBbbcUEd4Zl',
          },
        ];

        const rtcConfig = {}; // extra peer connection options (not ICE)

        const room = joinRoom({
          appId,
          rtcConfig,
          turnConfig,
          relayRedundancy,
          relayUrls: [
            'wss://relay.damus.io',
            'wss://nos.lol',
            'wss://relay.nostr.place',
            'wss://purplerelay.com',
            'wss://nostr.data.haus',
          ],
        }, actualRoomId);
        roomRef.current = room;

        // Set up send/receive for messages
        const [sendMsg, onMsg] = room.makeAction('msg');
        sendRef.current = sendMsg;

        onMsg((data) => {
          setMessages(prev => [...prev, {
            text: data.text,
            from: 'them',
            timestamp: data.timestamp ?? Date.now()
          }]);
        });

        // Track peer presence
        room.onPeerJoin((peerId) => {
          if (isGuest) {
            // Guest joined — we're connected to host
            setStatus('connected');
          } else {
            // Host — guest joined
            if (hasGuestRef.current) {
              // Second guest — kick them out by... we can't kick in Trystero
              // But we can ignore their messages and show warning
            } else {
              hasGuestRef.current = true;
              setStatus('connected');
            }
          }
          setPeerCount(c => c + 1);
        });

        // Poll relay connection status every 2 seconds
        const relayUrls = [
          'wss://relay.damus.io',
          'wss://nos.lol',
          'wss://relay.nostr.place',
          'wss://purplerelay.com',
          'wss://nostr.data.haus',
        ];

        const updateRelayStatus = () => {
          try {
            const sockets = getRelaySockets();
            const statuses = relayUrls.map(url => ({
              url,
              // WebSocket readyState: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED
              connected: sockets[url]?.readyState === 1,
              state: sockets[url]?.readyState ?? -1,
            }));
            setRelayStatus(statuses);
          } catch {
            // getRelaySockets may not be available in all contexts
          }
        };

        updateRelayStatus();
        // Store interval ref for cleanup
        const relayPollInterval = setInterval(updateRelayStatus, 2000);
        roomRef._relayPollInterval = relayPollInterval;

        room.onPeerLeave(() => {
          hasGuestRef.current = false;
          setPeerCount(c => Math.max(0, c - 1));
          setStatus('disconnected');
        });

        // For guest: set a timeout — if no peer joins in 15s, room may not exist
        if (isGuest) {
          setTimeout(() => {
            if (!cancelled && status !== 'connected') {
              // Still waiting — but Trystero doesn't have a "room not found" concept
              // so we stay waiting (host may just be slow to load)
            }
          }, 15000);
        }

        // Mark as waiting (host) or connecting (guest)
        setStatus(isGuest ? 'waiting' : 'waiting');

      } catch (err) {
        if (!cancelled) {
          console.error('Trystero setup error:', err);
          setStatus('error');
        }
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (roomRef._relayPollInterval) clearInterval(roomRef._relayPollInterval);
      if (roomRef.current) {
        roomRef.current.leave();
        roomRef.current = null;
      }
    };
  }, [actualRoomId, isGuest]);

  return { peerId: actualRoomId, messages, sendMessage, status, peerCount, relayStatus };
}
