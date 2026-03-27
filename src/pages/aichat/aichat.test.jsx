import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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

function renderPage(convState, props = {}) {
  mockConvState = convState;
  return render(<MemoryRouter><AIChatPage {...props} /></MemoryRouter>);
}

describe('AIChatPage mobile conversation drawer', () => {
  beforeEach(() => {
    mockConvState = undefined;
    mockSetConversations = undefined;
  });

  test('renders mobile header with Chat history button', () => {
    renderPage(mockConversations);
    expect(screen.getByRole('button', { name: 'Chat history' })).toBeInTheDocument();
  });

  test('drawer is off-screen by default', () => {
    renderPage(mockConversations);
    const drawer = screen.getByTestId('conversation-drawer');
    expect(drawer.className).toContain('-translate-x-full');
  });

  test('opening drawer shows conversation list', () => {
    renderPage(mockConversations);
    fireEvent.click(screen.getByRole('button', { name: 'Chat history' }));
    const drawer = screen.getByTestId('conversation-drawer');
    expect(drawer.className).toContain('translate-x-0');
    expect(within(drawer).getByText('First chat')).toBeInTheDocument();
    expect(within(drawer).getByText('Second chat')).toBeInTheDocument();
  });

  test('tapping a conversation selects it and closes drawer', () => {
    renderPage(mockConversations);
    fireEvent.click(screen.getByRole('button', { name: 'Chat history' }));
    const drawer = screen.getByTestId('conversation-drawer');
    fireEvent.click(within(drawer).getByText('First chat'));
    // Drawer should slide back off-screen
    expect(drawer.className).toContain('-translate-x-full');
  });

  test('delete button is always visible (not hover-only) in drawer', () => {
    renderPage(mockConversations);
    fireEvent.click(screen.getByRole('button', { name: 'Chat history' }));
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
    fireEvent.click(screen.getByRole('button', { name: 'Chat history' }));
    fireEvent.click(screen.getByText('+ New conversation'));
    // Drawer should slide back off-screen after creating
    const drawer = screen.getByTestId('conversation-drawer');
    expect(drawer.className).toContain('-translate-x-full');
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

describe('AIChatPage suggested action chips', () => {
  beforeEach(() => {
    mockConvState = undefined;
    mockSetConversations = undefined;
  });

  test('renders suggested action chips in empty state', () => {
    renderPage([]);
    const actions = screen.getByTestId('suggested-actions');
    expect(actions).toBeInTheDocument();
    expect(screen.getByText('Add a task')).toBeInTheDocument();
    expect(screen.getByText('Log an expense')).toBeInTheDocument();
    expect(screen.getByText('Set a goal')).toBeInTheDocument();
    expect(screen.getByText('Track subscription')).toBeInTheDocument();
    expect(screen.getByText('Plan a trip')).toBeInTheDocument();
    expect(screen.getByText('Show my tasks')).toBeInTheDocument();
    expect(screen.getByText('Spending summary')).toBeInTheDocument();
    expect(screen.getByText('Add a contact')).toBeInTheDocument();
  });

  test('clicking a suggested action populates input', () => {
    renderPage([]);
    fireEvent.click(screen.getByText('Add a task'));
    const textarea = screen.getByPlaceholderText('Message Gemini...');
    expect(textarea.value).toBe('Add a task: buy groceries by Friday');
  });

  test('suggested action chips have 44px min-height for mobile', () => {
    renderPage([]);
    const chip = screen.getByText('Add a task');
    expect(chip.style.minHeight).toBe('44px');
  });

  test('shows suggested actions when active conversation has no messages', () => {
    renderPage(mockConversations);
    expect(screen.queryByTestId('suggested-actions')).toBeInTheDocument();
  });
});

describe('AIChatPage action confirmation messages', () => {
  test('ActionConfirmation renders with action role styling', () => {
    const convWithAction = [{
      id: 'conv-action',
      title: 'Test',
      messages: [
        { role: 'user', content: 'Add a task', timestamp: Date.now() },
        { role: 'action', content: 'Created item in tasks', timestamp: Date.now() },
        { role: 'assistant', content: 'Done!', timestamp: Date.now() },
      ],
      createdAt: '2026-03-25T10:00:00Z',
    }];
    renderPage(convWithAction);
    const confirmation = screen.getByTestId('action-confirmation');
    expect(confirmation).toBeInTheDocument();
    expect(confirmation.textContent).toBe('Created item in tasks');
  });
});

// Note: The no-key state (Link to Settings) is tested via source inspection.
// The import of Link from react-router-dom (replacing <a href>) prevents hard
// reloads in PWA shell mode (UX Critical #1).

describe('AIChatPage mobile header integration', () => {
  beforeEach(() => {
    mockConvState = undefined;
    mockSetConversations = undefined;
  });

  test('renders hamburger menu when onOpenSidebar is provided', () => {
    const onOpenSidebar = vi.fn();
    renderPage(mockConversations, { onOpenSidebar });
    const menuBtn = screen.getByLabelText('Open menu');
    expect(menuBtn).toBeInTheDocument();
    fireEvent.click(menuBtn);
    expect(onOpenSidebar).toHaveBeenCalledTimes(1);
  });

  test('renders search button when onOpenSearch is provided', () => {
    const onOpenSearch = vi.fn();
    renderPage(mockConversations, { onOpenSearch });
    const searchBtn = screen.getByLabelText('Search');
    expect(searchBtn).toBeInTheDocument();
    fireEvent.click(searchBtn);
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });

  test('does not render hamburger or search when props are not provided', () => {
    renderPage(mockConversations);
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Search')).not.toBeInTheDocument();
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
