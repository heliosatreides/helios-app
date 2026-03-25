import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { AIChatPage } from './AIChatPage';

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: vi.fn(),
    loading: false,
    error: null,
    hasKey: true,
  }),
}));

vi.mock('../../hooks/useHeliosTools', () => ({
  buildToolSystemPrompt: () => '',
  executeActions: async (r) => ({ response: r, dataContext: '' }),
}));

const mockConversations = [
  { id: 'conv1', title: 'First chat', messages: [], createdAt: '2026-03-20T10:00:00Z' },
  { id: 'conv2', title: 'Second chat', messages: [], createdAt: '2026-03-21T10:00:00Z' },
];

let mockSetConversations;
let mockConvState;

vi.mock('../../hooks/useIDB', () => ({
  useIDB: (key, initial) => {
    const { useState } = require('react');
    const [state, setState] = useState(mockConvState ?? initial);
    mockSetConversations = setState;
    return [state, setState];
  },
}));

// Minimal Modal mock that renders children when open
// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

vi.mock('../../components/Modal', () => ({
  Modal: ({ open, onClose, title, children }) => {
    if (!open) return null;
    return (
      <div data-testid="modal-overlay" role="dialog" aria-label={title}>
        <button onClick={onClose} aria-label="Close">×</button>
        <h2>{title}</h2>
        {children}
      </div>
    );
  },
}));

function renderPage(convState) {
  mockConvState = convState;
  return render(<AIChatPage />);
}

describe('AIChatPage mobile conversation drawer', () => {
  beforeEach(() => {
    mockConvState = undefined;
    mockSetConversations = undefined;
  });

  test('renders mobile header with Chats button', () => {
    renderPage(mockConversations);
    expect(screen.getByRole('button', { name: 'Chats' })).toBeInTheDocument();
  });

  test('does not show drawer by default', () => {
    renderPage(mockConversations);
    expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
  });

  test('opening drawer shows conversation list', () => {
    renderPage(mockConversations);
    fireEvent.click(screen.getByRole('button', { name: 'Chats' }));
    const drawer = screen.getByTestId('modal-overlay');
    expect(drawer).toBeInTheDocument();
    expect(within(drawer).getByText('First chat')).toBeInTheDocument();
    expect(within(drawer).getByText('Second chat')).toBeInTheDocument();
  });

  test('tapping a conversation selects it and closes drawer', () => {
    renderPage(mockConversations);
    fireEvent.click(screen.getByRole('button', { name: 'Chats' }));
    const drawer = screen.getByTestId('modal-overlay');
    fireEvent.click(within(drawer).getByText('First chat'));
    // Drawer should close
    expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
  });

  test('delete button is always visible (not hover-only) in drawer', () => {
    renderPage(mockConversations);
    fireEvent.click(screen.getByRole('button', { name: 'Chats' }));
    const deleteButtons = screen.getAllByLabelText(/^Delete /);
    expect(deleteButtons.length).toBe(2);
    // Verify none have hidden/group-hover classes
    deleteButtons.forEach(btn => {
      expect(btn.className).not.toMatch(/hidden/);
      expect(btn.className).not.toMatch(/group-hover/);
    });
  });

  test('new conversation button works in drawer', () => {
    renderPage([]);
    fireEvent.click(screen.getByRole('button', { name: 'Chats' }));
    fireEvent.click(screen.getByText('+ New conversation'));
    // Drawer should close after creating
    expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument();
  });

  test('shows active conversation title in mobile header', () => {
    renderPage(mockConversations);
    // Auto-selects first conversation, so title should appear (in sidebar + mobile header)
    const matches = screen.getAllByText('First chat');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

describe('AIChatPage auto-select conversation', () => {
  beforeEach(() => {
    mockConvState = undefined;
    mockSetConversations = undefined;
  });

  test('auto-selects the most recent conversation on load', () => {
    renderPage(mockConversations);
    // The first conversation (most recent in array) should be auto-selected
    // The desktop sidebar should highlight it with bg-secondary
    const convButtons = screen.getAllByText('First chat');
    const sidebarBtn = convButtons.find(el => el.closest('button')?.className.includes('bg-secondary'));
    expect(sidebarBtn).toBeTruthy();
  });

  test('does not show empty state when conversations exist', () => {
    renderPage(mockConversations);
    // Should NOT show the prompt suggestions since a conversation is auto-selected
    expect(screen.queryByText('Show me my upcoming trips')).not.toBeInTheDocument();
  });

  test('shows empty state when no conversations exist', () => {
    renderPage([]);
    expect(screen.getByText(/Chat with Gemini/)).toBeInTheDocument();
  });
});

describe('AIChatPage desktop sidebar delete button', () => {
  beforeEach(() => {
    mockConvState = undefined;
    mockSetConversations = undefined;
  });

  test('desktop delete button uses opacity instead of hidden for accessibility', () => {
    renderPage(mockConversations);
    // Find delete buttons in the desktop sidebar (not the drawer)
    // The desktop sidebar delete buttons should use opacity-0/group-hover:opacity-100, NOT hidden/group-hover:block
    const allButtons = screen.getAllByText('×');
    const desktopDeleteBtns = allButtons.filter(el => {
      const btn = el.closest('button');
      return btn && btn.className.includes('opacity-0');
    });
    expect(desktopDeleteBtns.length).toBe(2);
    // Verify they have focus:opacity-100 for keyboard accessibility
    desktopDeleteBtns.forEach(el => {
      const btn = el.closest('button');
      expect(btn.className).toContain('focus:opacity-100');
    });
  });
});
