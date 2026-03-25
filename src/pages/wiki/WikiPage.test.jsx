import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WikiPage } from './WikiPage';

// Mock useIDB
const mockSetPages = vi.fn((updater) => {
  if (typeof updater === 'function') {
    const result = updater(mockPages);
    mockPages = result;
  } else {
    mockPages = updater;
  }
});

let mockPages = [];

vi.mock('../../hooks/useIDB', () => ({
  useIDB: (key, def) => {
    if (key === 'wiki-pages') return [mockPages, mockSetPages];
    return [def, vi.fn()];
  },
}));

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: vi.fn().mockResolvedValue('AI summary'),
    loading: false,
    error: null,
  }),
}));

function renderWiki() {
  return render(
    <MemoryRouter>
      <WikiPage />
    </MemoryRouter>
  );
}

describe('WikiPage', () => {
  beforeEach(() => {
    mockPages = [];
    mockSetPages.mockClear();
    delete window.wikiNavigate;
  });

  it('renders empty state when no pages exist', () => {
    renderWiki();
    expect(screen.getByText('Your wiki is empty')).toBeInTheDocument();
  });

  it('does NOT set window.wikiNavigate', () => {
    mockPages = [
      { id: '1', title: 'Test Page', content: 'Hello [[Other Page]]', category: 'General', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: '2', title: 'Other Page', content: 'World', category: 'General', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ];
    renderWiki();
    expect(window.wikiNavigate).toBeUndefined();
  });

  it('creates a new page', () => {
    renderWiki();
    fireEvent.click(screen.getByText('+ New Page'));
    const titleInput = screen.getByPlaceholderText('Page title');
    fireEvent.change(titleInput, { target: { value: 'My Page' } });
    const textarea = screen.getByPlaceholderText(/Write your page content/);
    fireEvent.change(textarea, { target: { value: 'Some content' } });
    fireEvent.click(screen.getByText('Create'));
    expect(mockSetPages).toHaveBeenCalled();
  });

  it('opens a page in read view', () => {
    mockPages = [
      { id: '1', title: 'Test Page', content: 'Hello world', category: 'General', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ];
    renderWiki();
    fireEvent.click(screen.getByText('Test Page'));
    // Should now show the read view with page title as heading
    expect(screen.getByRole('heading', { name: 'Test Page' })).toBeInTheDocument();
  });

  it('navigates wiki links via data-wiki-id click delegation (not window global)', () => {
    mockPages = [
      { id: '1', title: 'Page A', content: 'Link to [[Page B]]', category: 'General', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: '2', title: 'Page B', content: 'Hello from B', category: 'General', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ];
    renderWiki();
    // Click on Page A to enter read view
    fireEvent.click(screen.getByText('Page A'));
    expect(screen.getByRole('heading', { name: 'Page A' })).toBeInTheDocument();

    // Find the wiki link button inside the content
    const wikiContent = screen.getByTestId('wiki-content');
    const linkButton = wikiContent.querySelector('[data-wiki-id="2"]');
    expect(linkButton).toBeTruthy();

    // Click the wiki link
    fireEvent.click(linkButton);

    // Should navigate to Page B
    expect(screen.getByRole('heading', { name: 'Page B' })).toBeInTheDocument();
  });

  it('uses design tokens instead of amber/purple colors', () => {
    renderWiki();
    // The New Page button should use foreground tokens, not amber
    const newPageBtn = screen.getByText('+ New Page');
    expect(newPageBtn.className).toContain('bg-foreground');
    expect(newPageBtn.className).toContain('text-background');
    expect(newPageBtn.className).not.toContain('amber');
  });

  it('deletes a page from read view', () => {
    mockPages = [
      { id: '1', title: 'Delete Me', content: 'Bye', category: 'General', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ];
    renderWiki();
    fireEvent.click(screen.getByText('Delete Me'));
    fireEvent.click(screen.getByText('Delete'));
    expect(mockSetPages).toHaveBeenCalled();
  });
});
