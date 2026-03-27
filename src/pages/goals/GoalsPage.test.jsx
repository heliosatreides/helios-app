import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../dashboard/GoalsTab', () => ({
  GoalsTab: () => <div data-testid="goals-tab">GoalsTab Content</div>,
}));

import { GoalsPage } from './GoalsPage';

describe('GoalsPage', () => {
  it('renders GoalsTab (header is owned by GoalsTab)', () => {
    render(<GoalsPage />);
    expect(screen.getByTestId('goals-tab')).toBeInTheDocument();
  });

  it('renders GoalsTab content', () => {
    render(<GoalsPage />);
    expect(screen.getByTestId('goals-tab')).toBeInTheDocument();
  });
});
