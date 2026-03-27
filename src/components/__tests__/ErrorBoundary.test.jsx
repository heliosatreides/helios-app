import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

function ThrowingChild() {
  throw new Error('Test explosion');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows generic error UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
  });

  it('shows page-specific error message when pageName is provided', () => {
    render(
      <ErrorBoundary pageName="Finance">
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Finance failed to load')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred in Finance/)).toBeInTheDocument();
  });

  it('has Retry, Reload, and Dashboard buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('error-retry-btn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    const link = screen.getByText('Dashboard');
    expect(link.closest('a')).toHaveAttribute('href', '/dashboard');
  });

  it('retries rendering children when Retry is clicked', () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error('Boom');
      return <p>Recovered</p>;
    }

    render(
      <ErrorBoundary pageName="Planner">
        <MaybeThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Planner failed to load')).toBeInTheDocument();

    // Fix the component before retry
    shouldThrow = false;
    fireEvent.click(screen.getByTestId('error-retry-btn'));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
    expect(screen.queryByText('Planner failed to load')).not.toBeInTheDocument();
  });

  it('shows error message in dev mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Test explosion')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('uses different page names for different boundaries', () => {
    const { unmount } = render(
      <ErrorBoundary pageName="Trips">
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Trips failed to load')).toBeInTheDocument();
    unmount();

    render(
      <ErrorBoundary pageName="Health">
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Health failed to load')).toBeInTheDocument();
  });
});
