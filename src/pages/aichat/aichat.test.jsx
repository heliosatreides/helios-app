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
    // Default shows AI Chat in the mobile header span
    const headerSpans = screen.getAllByText('AI Chat');
    expect(headerSpans.length).toBeGreaterThanOrEqual(1);
  });
});
