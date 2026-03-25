import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../dashboard/NetworkingTab', () => ({
  NetworkingTab: () => <div data-testid="networking-tab">NetworkingTab Content</div>,
}));

import { NetworkingPage } from './NetworkingPage';

describe('NetworkingPage', () => {
  it('renders page header', () => {
    render(<NetworkingPage />);
    expect(screen.getByText('Networking')).toBeInTheDocument();
    expect(screen.getByText('Networking').tagName).toBe('H1');
  });

  it('renders NetworkingTab content', () => {
    render(<NetworkingPage />);
    expect(screen.getByTestId('networking-tab')).toBeInTheDocument();
  });
});
