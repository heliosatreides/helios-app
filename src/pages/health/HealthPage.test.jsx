import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../dashboard/HealthTab', () => ({
  HealthTab: () => <div data-testid="health-tab">HealthTab Content</div>,
}));

import { HealthPage } from './HealthPage';

describe('HealthPage', () => {
  it('renders page header', () => {
    render(<HealthPage />);
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Health').tagName).toBe('H1');
  });

  it('renders HealthTab content', () => {
    render(<HealthPage />);
    expect(screen.getByTestId('health-tab')).toBeInTheDocument();
  });
});
