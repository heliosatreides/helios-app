import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChatPage } from './ChatPage';
import { generateRoomId, generatePin } from './usePeer';

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
  getRelaySockets: vi.fn(() => ({})),
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

describe('generatePin', () => {
  it('generates a 4-digit string', () => {
    const pin = generatePin();
    expect(pin).toHaveLength(4);
    expect(pin).toMatch(/^\d{4}$/);
  });

  it('generates values between 1000-9999', () => {
    for (let i = 0; i < 20; i++) {
      const n = parseInt(generatePin(), 10);
      expect(n).toBeGreaterThanOrEqual(1000);
      expect(n).toBeLessThanOrEqual(9999);
    }
  });
});

describe('ChatPage', () => {
  beforeEach(() => {
    mockLeave.mockClear();
    mockOnPeerJoin.mockClear();
    mockOnPeerLeave.mockClear();
    mockMakeAction.mockReturnValue([vi.fn(), vi.fn()]);
  });

  it('renders without crashing', () => {
    const { container } = renderChat();
    expect(container.firstChild).toBeTruthy();
  });

  it('shows initializing/waiting state for host', async () => {
    renderChat();
    await vi.waitFor(() => {
      expect(
        screen.queryByText(/setting up/i) ||
        screen.queryByText(/waiting for someone/i) ||
        screen.queryByText(/waiting/i)
      ).toBeTruthy();
    });
  });

  it('shows joining/waiting state for guest', async () => {
    renderChat('?room=testroom123');
    await vi.waitFor(() => {
      expect(
        screen.queryByText(/connecting/i) ||
        screen.queryByText(/waiting/i) ||
        screen.queryByText(/enter/i)
      ).toBeTruthy();
    });
  });
});
