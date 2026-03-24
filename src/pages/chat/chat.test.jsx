import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ---- PeerJS mock ----
const mockPeerInstance = {
  id: null,
  _openHandlers: [],
  _connectionHandlers: [],
  _errorHandlers: [],
  on: vi.fn(function (event, handler) {
    if (event === 'open') this._openHandlers.push(handler);
    if (event === 'connection') this._connectionHandlers.push(handler);
    if (event === 'error') this._errorHandlers.push(handler);
    return this;
  }),
  destroy: vi.fn(),
  connect: vi.fn(),
  _triggerOpen: function (id) {
    this.id = id;
    this._openHandlers.forEach((h) => h(id));
  },
  _triggerConnection: function (conn) {
    this._connectionHandlers.forEach((h) => h(conn));
  },
  _triggerError: function (err) {
    this._errorHandlers.forEach((h) => h(err));
  },
};

const createMockConn = () => {
  const conn = {
    _openHandlers: [],
    _dataHandlers: [],
    _closeHandlers: [],
    _errorHandlers: [],
    on: vi.fn(function (event, handler) {
      if (event === 'open') this._openHandlers.push(handler);
      if (event === 'data') this._dataHandlers.push(handler);
      if (event === 'close') this._closeHandlers.push(handler);
      if (event === 'error') this._errorHandlers.push(handler);
      return this;
    }),
    send: vi.fn(),
    close: vi.fn(),
    _triggerOpen: function () { this._openHandlers.forEach((h) => h()); },
    _triggerData: function (d) { this._dataHandlers.forEach((h) => h(d)); },
    _triggerClose: function () { this._closeHandlers.forEach((h) => h()); },
  };
  return conn;
};

let MockPeerConstructor;

beforeEach(() => {
  // Reset mock state
  Object.assign(mockPeerInstance, {
    id: null,
    _openHandlers: [],
    _connectionHandlers: [],
    _errorHandlers: [],
  });
  mockPeerInstance.on.mockClear();
  mockPeerInstance.destroy.mockClear();
  mockPeerInstance.connect.mockClear();

  MockPeerConstructor = vi.fn(() => mockPeerInstance);
});

vi.mock('peerjs', () => ({
  default: new Proxy(function () {}, {
    construct(_target, args) {
      return MockPeerConstructor(...args);
    },
    apply(_target, _this, args) {
      return MockPeerConstructor(...args);
    },
  }),
}));

// ---- imports after mock ----
import { ChatPage } from './ChatPage';
import { usePeer } from './usePeer';
import { ChatMessage } from './ChatMessage';

// Helper to render ChatPage in a memory router
function renderChat(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/chat${search}`]}>
      <ChatPage />
    </MemoryRouter>
  );
}

// ---- Tests ----

describe('ChatMessage component', () => {
  it('renders "You" message on the right with amber styling', () => {
    const msg = { text: 'Hello world', from: 'you', timestamp: Date.now() };
    render(<ChatMessage message={msg} />);
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders "Them" message on the left', () => {
    const msg = { text: 'Hey there', from: 'them', timestamp: Date.now() };
    render(<ChatMessage message={msg} />);
    expect(screen.getByText('Them')).toBeInTheDocument();
    expect(screen.getByText('Hey there')).toBeInTheDocument();
  });
});

describe('ChatPage — host flow', () => {
  it('shows initializing state before peer opens', () => {
    renderChat();
    expect(screen.getByText(/setting up secure connection/i)).toBeInTheDocument();
  });

  it('host: generates a peer ID on mount and shows waiting state with share link', async () => {
    renderChat();

    await act(async () => {
      mockPeerInstance._triggerOpen('test-peer-id-123');
    });

    expect(screen.getByText(/waiting for someone to join/i)).toBeInTheDocument();
    expect(screen.getByText(/test-peer-id-123/)).toBeInTheDocument();
  });

  it('host: shows chat UI when a guest connects', async () => {
    renderChat();

    await act(async () => {
      mockPeerInstance._triggerOpen('host-id');
    });

    const mockConn = createMockConn();
    await act(async () => {
      mockPeerInstance._triggerConnection(mockConn);
    });

    await act(async () => {
      mockConn._triggerOpen();
    });

    // Chat UI should now be visible (connected state)
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('host: rejects second connection when already connected', async () => {
    renderChat();

    await act(async () => {
      mockPeerInstance._triggerOpen('host-id');
    });

    const conn1 = createMockConn();
    await act(async () => {
      mockPeerInstance._triggerConnection(conn1);
    });
    await act(async () => {
      conn1._triggerOpen();
    });

    // Second connection attempt
    const conn2 = createMockConn();
    await act(async () => {
      mockPeerInstance._triggerConnection(conn2);
    });

    // Second connection should be closed immediately
    expect(conn2.close).toHaveBeenCalled();
  });
});

describe('ChatPage — guest flow', () => {
  it('guest: connects using room ID from URL param', async () => {
    const mockConn = createMockConn();
    mockPeerInstance.connect.mockReturnValue(mockConn);

    renderChat('?room=host-peer-id');

    await act(async () => {
      mockPeerInstance._triggerOpen('guest-peer-id');
    });

    expect(mockPeerInstance.connect).toHaveBeenCalledWith('host-peer-id');
  });

  it('guest: shows chat UI after connection opens', async () => {
    const mockConn = createMockConn();
    mockPeerInstance.connect.mockReturnValue(mockConn);

    renderChat('?room=host-peer-id');

    await act(async () => {
      mockPeerInstance._triggerOpen('guest-peer-id');
    });

    await act(async () => {
      mockConn._triggerOpen();
    });

    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  it('guest: shows error state when host rejects or room is unavailable', async () => {
    renderChat('?room=unavailable-room');

    await act(async () => {
      // Error before peer opens (peer-unavailable)
      mockPeerInstance._triggerError({ type: 'peer-unavailable' });
    });

    await waitFor(() => {
      expect(screen.queryByText(/room is full or host has left/i)).toBeInTheDocument();
    });
  });
});

describe('Chat messaging', () => {
  async function setupConnectedChat(search = '') {
    const isGuest = Boolean(search);
    let mockConn;

    if (isGuest) {
      mockConn = createMockConn();
      mockPeerInstance.connect.mockReturnValue(mockConn);
    }

    renderChat(search);

    await act(async () => {
      mockPeerInstance._triggerOpen(isGuest ? 'guest-id' : 'host-id');
    });

    if (!isGuest) {
      mockConn = createMockConn();
      await act(async () => {
        mockPeerInstance._triggerConnection(mockConn);
      });
    }

    await act(async () => {
      mockConn._triggerOpen();
    });

    return mockConn;
  }

  it('message sent by user appears in message list', async () => {
    await setupConnectedChat();

    const input = screen.getByPlaceholderText(/type a message/i);
    const sendBtn = screen.getByRole('button', { name: /send/i });

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello from host!' } });
      fireEvent.click(sendBtn);
    });

    expect(screen.getByText('Hello from host!')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('received message from peer appears in message list', async () => {
    const mockConn = await setupConnectedChat();

    await act(async () => {
      mockConn._triggerData(JSON.stringify({ text: 'Hi from guest!', timestamp: Date.now() }));
    });

    expect(screen.getByText('Hi from guest!')).toBeInTheDocument();
    expect(screen.getByText('Them')).toBeInTheDocument();
  });

  it('connection closed shows disconnect overlay', async () => {
    const mockConn = await setupConnectedChat();

    await act(async () => {
      mockConn._triggerClose();
    });

    expect(screen.getByText(/chat ended/i)).toBeInTheDocument();
    expect(screen.getByText(/the other party has disconnected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start new chat/i })).toBeInTheDocument();
  });
});

describe('usePeer hook cleanup', () => {
  it('destroys peer on unmount', async () => {
    const { unmount } = renderChat();

    await act(async () => {
      mockPeerInstance._triggerOpen('peer-id');
    });

    unmount();

    expect(mockPeerInstance.destroy).toHaveBeenCalled();
  });
});
