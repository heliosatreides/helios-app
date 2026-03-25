import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../dashboard/GoalsTab', () => ({
  GoalsTab: () => <div data-testid="goals-tab">GoalsTab Content</div>,
}));

import { GoalsPage } from './GoalsPage';

describe('GoalsPage', () => {
  it('renders page header', () => {
    render(<GoalsPage />);
    expect(screen.getByText('Goals & OKRs')).toBeInTheDocument();
    expect(screen.getByText('Goals & OKRs').tagName).toBe('H1');
  });

  it('renders GoalsTab content', () => {
    render(<GoalsPage />);
    expect(screen.getByTestId('goals-tab')).toBeInTheDocument();
  });
});
