import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChatPage } from './ChatPage';
import { generateRoomId } from './usePeer';

// Mock PeerJS
const mockPeer = {
  on: vi.fn(),
  connect: vi.fn(() => ({ on: vi.fn(), send: vi.fn(), open: true, close: vi.fn() })),
  destroy: vi.fn(),
  reconnect: vi.fn(),
};
vi.mock('peerjs', () => ({
  default: vi.fn(() => mockPeer),
}));

function renderChat(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/chat${search}`]}>
      <ChatPage />
    </MemoryRouter>
  );
}

describe('generateRoomId', () => {
  it('generates an 8-character room id', () => {
    const id = generateRoomId();
    expect(id).toHaveLength(8);
    expect(id).toMatch(/^[a-z2-9]+$/);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateRoomId()));
    expect(ids.size).toBe(10);
  });
});

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPeer.on.mockImplementation(() => mockPeer);
  });

  it('renders without crashing', () => {
    const { container } = renderChat();
    expect(container.firstChild).toBeTruthy();
  });

  it('shows lobby screen with create/join options when no room param', () => {
    renderChat();
    expect(screen.getByText(/P2P Ephemeral Chat/i)).toBeInTheDocument();
    expect(screen.getByText(/Create New Room/i)).toBeInTheDocument();
    expect(screen.getByText(/Join Room/i)).toBeInTheDocument();
  });

  it('shows connecting state for guest with room param', async () => {
    renderChat('?room=testroom123');
    await vi.waitFor(() => {
      expect(
        screen.queryByText(/connecting/i) ||
        screen.queryByText(/waiting/i) ||
        screen.queryByText(/setting up/i)
      ).toBeTruthy();
    });
  });
});
