import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../dashboard/NetworkingTab', () => ({
  NetworkingTab: () => <div data-testid="networking-tab">NetworkingTab Content</div>,
}));

import { NetworkingPage } from './NetworkingPage';

describe('NetworkingPage', () => {
  it('renders NetworkingTab (header is owned by NetworkingTab)', () => {
    render(<NetworkingPage />);
    expect(screen.getByTestId('networking-tab')).toBeInTheDocument();
  });

  it('renders NetworkingTab content', () => {
    render(<NetworkingPage />);
    expect(screen.getByTestId('networking-tab')).toBeInTheDocument();
  });
});
