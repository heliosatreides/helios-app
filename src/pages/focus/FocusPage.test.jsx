import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../dashboard/FocusTab', () => ({
  FocusTab: () => <div data-testid="focus-tab">FocusTab Content</div>,
}));

import { FocusPage } from './FocusPage';

describe('FocusPage', () => {
  it('renders page header', () => {
    render(<FocusPage />);
    expect(screen.getByText('Focus')).toBeInTheDocument();
    expect(screen.getByText('Focus').tagName).toBe('H1');
  });

  it('renders FocusTab content', () => {
    render(<FocusPage />);
    expect(screen.getByTestId('focus-tab')).toBeInTheDocument();
  });
});
