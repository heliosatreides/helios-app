import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'peerjs';

export function usePeer({ isGuest = false, roomId = null } = {}) {
  const [peerId, setPeerId] = useState(null);
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('initializing');

  const peerRef = useRef(null);
  const connectionRef = useRef(null);
  const hasConnectionRef = useRef(false); // track before 'open' fires

  const setupConn = useCallback((conn) => {
    connectionRef.current = conn;
    setConnection(conn);

    conn.on('open', () => {
      setStatus('connected');
    });

    conn.on('data', (data) => {
      try {
        const msg = typeof data === 'string' ? JSON.parse(data) : data;
        setMessages((prev) => [...prev, { text: msg.text, from: 'them', timestamp: msg.timestamp ?? Date.now() }]);
      } catch {
        setMessages((prev) => [...prev, { text: String(data), from: 'them', timestamp: Date.now() }]);
      }
    });

    conn.on('close', () => {
      hasConnectionRef.current = false;
      setStatus('disconnected');
      setConnection(null);
      connectionRef.current = null;
    });

    conn.on('error', () => {
      hasConnectionRef.current = false;
      setStatus('error');
    });
  }, []);

  const sendMessage = useCallback((text) => {
    if (!connectionRef.current || !text.trim()) return;
    const msg = { text: text.trim(), timestamp: Date.now() };
    connectionRef.current.send(JSON.stringify(msg));
    setMessages((prev) => [...prev, { text: text.trim(), from: 'you', timestamp: msg.timestamp }]);
  }, []);

  useEffect(() => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);

      if (isGuest && roomId) {
        // Guest: connect to host
        const conn = peer.connect(roomId);
        hasConnectionRef.current = true;
        setupConn(conn);
      } else {
        // Host: wait for incoming connection
        setStatus('waiting');
      }
    });

    // Host: handle incoming connections
    if (!isGuest) {
      peer.on('connection', (conn) => {
        if (hasConnectionRef.current) {
          // Already connected — reject second attempt
          conn.close();
          return;
        }
        hasConnectionRef.current = true;
        setupConn(conn);
      });
    }

    peer.on('error', () => {
      setStatus('error');
    });

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [isGuest, roomId, setupConn]);

  return { peerId, connection, messages, sendMessage, status };
}
