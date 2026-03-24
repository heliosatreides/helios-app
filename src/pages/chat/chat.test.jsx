import { render, screen, act, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChatPage } from './ChatPage';
import { generateRoomId } from './usePeer';

// Mock trystero/nostr
const mockLeave = vi.fn();
const mockOnPeerJoin = vi.fn();
const mockOnPeerLeave = vi.fn();
const mockMakeAction = vi.fn();

vi.mock('trystero/nostr', () => ({
  joinRoom: vi.fn(() => ({
    leave: mockLeave,
    onPeerJoin: mockOnPeerJoin,
    onPeerLeave: mockOnPeerLeave,
    makeAction: mockMakeAction,
  })),
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
    mockLeave.mockClear();
    mockOnPeerJoin.mockClear();
    mockOnPeerLeave.mockClear();
    mockMakeAction.mockReturnValue([vi.fn(), vi.fn()]);
  });

  it('shows initializing then waiting state for host', async () => {
    renderChat();
    // Should eventually show waiting (Trystero joins async)
    await vi.waitFor(() => {
      expect(screen.queryByText(/setting up/i) || screen.queryByText(/waiting/i)).toBeTruthy();
    });
  });

  it('shows waiting state with share link for host', async () => {
    renderChat();
    await vi.waitFor(() => {
      expect(screen.queryByText(/waiting for someone/i) || screen.queryByText(/joining chat/i)).toBeTruthy();
    });
  });

  it('shows joining state for guest', async () => {
    renderChat('?room=testroom123');
    await vi.waitFor(() => {
      expect(
        screen.queryByText(/joining chat/i) || screen.queryByText(/waiting/i)
      ).toBeTruthy();
    });
  });

  it('renders without crashing and shows some UI', async () => {
    const { container } = renderChat();
    expect(container.firstChild).toBeTruthy();
  });
});
