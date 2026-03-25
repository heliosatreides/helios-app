/**
 * Tests for KnowledgeTab components:
 * - ReadingList: add item, filter by status, mark done
 * - TIL: add entry, filter by tag
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// We need mutable state for useIDB mock
let mockReadingList = [];
let mockTILLog = [];

vi.mock('../../hooks/useIDB', () => ({
  useIDB: vi.fn((key, defaultVal) => {
    const { useState, useEffect } = require('react');
    if (key === 'reading-list') {
      const [state, setState] = useState(mockReadingList);
      return [state, setState];
    }
    if (key === 'til-log') {
      const [state, setState] = useState(mockTILLog);
      return [state, setState];
    }
    return useState(defaultVal);
  }),
  _resetDBPromise: vi.fn(),
}));

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({ generate: vi.fn(), loading: false, hasKey: false }),
}));

import { ReadingList, TILLog, KnowledgeTab } from './KnowledgeTab';

describe('ReadingList', () => {
  beforeEach(() => {
    mockReadingList = [];
    mockTILLog = [];
    vi.clearAllMocks();
  });

  it('renders with empty state', () => {
    render(<ReadingList />);
    expect(screen.getByText(/no items/i)).toBeTruthy();
  });

  it('shows add form on button click', () => {
    render(<ReadingList />);
    fireEvent.click(screen.getByText('+ Add Item'));
    expect(screen.getByPlaceholderText(/title/i)).toBeTruthy();
  });

  it('adds an item via form', async () => {
    render(<ReadingList />);
    fireEvent.click(screen.getByText('+ Add Item'));

    fireEvent.change(screen.getByPlaceholderText(/title \*/i), {
      target: { value: 'Test Book' },
    });
    fireEvent.change(screen.getByPlaceholderText(/author/i), {
      target: { value: 'Jane Doe' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));

    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeTruthy();
    });
  });

  it('filters by status tab', async () => {
    render(<ReadingList />);
    // Add an item first
    fireEvent.click(screen.getByText('+ Add Item'));
    fireEvent.change(screen.getByPlaceholderText(/title \*/i), { target: { value: 'Reading Book' } });

    // Change status to Reading
    const statusSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(statusSelect, { target: { value: 'Reading' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));

    await waitFor(() => expect(screen.getByText('Reading Book')).toBeTruthy());

    // Filter to "Reading"
    fireEvent.click(screen.getByTestId('reading-filter-reading'));
    expect(screen.getByText('Reading Book')).toBeTruthy();

    // Filter to "Done" - item shouldn't appear
    fireEvent.click(screen.getByTestId('reading-filter-done'));
    expect(screen.queryByText('Reading Book')).toBeNull();
  });

  it('marks an item as done', async () => {
    render(<ReadingList />);
    fireEvent.click(screen.getByText('+ Add Item'));
    fireEvent.change(screen.getByPlaceholderText(/title \*/i), { target: { value: 'To Mark Done' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));

    await waitFor(() => expect(screen.getByText('To Mark Done')).toBeTruthy());

    // Get the item id from testid and click done
    const items = screen.getAllByTestId(/^reading-item-/);
    expect(items.length).toBeGreaterThan(0);
    const id = items[0].dataset.testid.replace('reading-item-', '');
    fireEvent.click(screen.getByTestId(`reading-done-${id}`));

    await waitFor(() => {
      // After marking done, item should be line-through
      expect(screen.getByText('To Mark Done').className).toContain('line-through');
    });
  });

  it('deletes an item', async () => {
    render(<ReadingList />);
    fireEvent.click(screen.getByText('+ Add Item'));
    fireEvent.change(screen.getByPlaceholderText(/title \*/i), { target: { value: 'To Delete' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));

    await waitFor(() => expect(screen.getByText('To Delete')).toBeTruthy());

    const items = screen.getAllByTestId(/^reading-item-/);
    const id = items[0].dataset.testid.replace('reading-item-', '');
    fireEvent.click(screen.getByTestId(`reading-delete-${id}`));

    // Confirm the deletion dialog
    await waitFor(() => expect(screen.getByTestId('confirm-delete')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirm-delete'));

    await waitFor(() => {
      expect(screen.queryByText('To Delete')).toBeNull();
    });
  });

  it('shows filter tabs', () => {
    render(<ReadingList />);
    expect(screen.getByTestId('reading-filter-all')).toBeTruthy();
    expect(screen.getByTestId('reading-filter-want-to-read')).toBeTruthy();
    expect(screen.getByTestId('reading-filter-reading')).toBeTruthy();
    expect(screen.getByTestId('reading-filter-done')).toBeTruthy();
  });
});

describe('TILLog', () => {
  beforeEach(() => {
    mockReadingList = [];
    mockTILLog = [];
    vi.clearAllMocks();
  });

  it('renders with empty state', () => {
    render(<TILLog />);
    expect(screen.getByText(/no til entries/i)).toBeTruthy();
  });

  it('shows add form on button click', () => {
    render(<TILLog />);
    fireEvent.click(screen.getByText('+ Add TIL'));
    expect(screen.getByPlaceholderText(/what did you learn/i)).toBeTruthy();
  });

  it('adds an entry', async () => {
    render(<TILLog />);
    fireEvent.click(screen.getByText('+ Add TIL'));

    fireEvent.change(screen.getByPlaceholderText(/what did you learn/i), {
      target: { value: 'React hooks are great' },
    });
    fireEvent.change(screen.getByPlaceholderText(/brief note/i), {
      target: { value: 'UseEffect runs after render' },
    });
    fireEvent.change(screen.getByPlaceholderText(/tags/i), {
      target: { value: 'react, hooks' },
    });

    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));

    await waitFor(() => {
      expect(screen.getByText('React hooks are great')).toBeTruthy();
    });
  });

  it('filters by tag', async () => {
    render(<TILLog />);
    // Add two entries with different tags
    fireEvent.click(screen.getByText('+ Add TIL'));
    fireEvent.change(screen.getByPlaceholderText(/what did you learn/i), { target: { value: 'Entry A' } });
    fireEvent.change(screen.getByPlaceholderText(/tags/i), { target: { value: 'alpha' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));

    await waitFor(() => expect(screen.getByText('Entry A')).toBeTruthy());

    fireEvent.click(screen.getByText('+ Add TIL'));
    fireEvent.change(screen.getByPlaceholderText(/what did you learn/i), { target: { value: 'Entry B' } });
    fireEvent.change(screen.getByPlaceholderText(/tags/i), { target: { value: 'beta' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));

    await waitFor(() => expect(screen.getByText('Entry B')).toBeTruthy());

    // Filter to alpha tag
    fireEvent.click(screen.getByTestId('til-tag-alpha'));
    expect(screen.getByText('Entry A')).toBeTruthy();
    expect(screen.queryByText('Entry B')).toBeNull();
  });

  it('deletes an entry', async () => {
    render(<TILLog />);
    fireEvent.click(screen.getByText('+ Add TIL'));
    fireEvent.change(screen.getByPlaceholderText(/what did you learn/i), { target: { value: 'Delete me' } });
    fireEvent.click(screen.getByRole('button', { name: /^Add$/ }));

    await waitFor(() => expect(screen.getByText('Delete me')).toBeTruthy());

    const entries = screen.getAllByTestId(/^til-entry-/);
    const id = entries[0].dataset.testid.replace('til-entry-', '');
    fireEvent.click(within(entries[0]).getByRole('button'));

    // Confirm the deletion dialog
    await waitFor(() => expect(screen.getByTestId('confirm-delete')).toBeTruthy());
    fireEvent.click(screen.getByTestId('confirm-delete'));

    await waitFor(() => {
      expect(screen.queryByText('Delete me')).toBeNull();
    });
  });
});

// Import within for DOM queries
import { within } from '@testing-library/react';
