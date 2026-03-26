import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';

function renderWithRouter(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renders all four navigation items', () => {
    renderWithRouter();
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Planner')).toBeInTheDocument();
    expect(screen.getByLabelText('Finance')).toBeInTheDocument();
    expect(screen.getByLabelText('AI Chat')).toBeInTheDocument();
  });

  it('renders with data-testid', () => {
    renderWithRouter();
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });

  it('highlights the active route (Dashboard)', () => {
    renderWithRouter('/dashboard');
    const homeLink = screen.getByLabelText('Home');
    expect(homeLink.className).toContain('text-foreground');
  });

  it('highlights the active route (Planner)', () => {
    renderWithRouter('/planner');
    const plannerLink = screen.getByLabelText('Planner');
    expect(plannerLink.className).toContain('text-foreground');
  });

  it('highlights the active route (Finance)', () => {
    renderWithRouter('/finance');
    const financeLink = screen.getByLabelText('Finance');
    expect(financeLink.className).toContain('text-foreground');
  });

  it('highlights the active route (AI Chat)', () => {
    renderWithRouter('/ai');
    const aiLink = screen.getByLabelText('AI Chat');
    expect(aiLink.className).toContain('text-foreground');
  });

  it('links to correct routes', () => {
    renderWithRouter();
    expect(screen.getByLabelText('Home').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByLabelText('Planner').closest('a')).toHaveAttribute('href', '/planner');
    expect(screen.getByLabelText('Finance').closest('a')).toHaveAttribute('href', '/finance');
    expect(screen.getByLabelText('AI Chat').closest('a')).toHaveAttribute('href', '/ai');
  });

  it('has minimum 44px touch targets', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.className).toContain('min-h-[44px]');
    });
  });

  it('has md:hidden class for desktop hiding', () => {
    renderWithRouter();
    const nav = screen.getByTestId('bottom-nav');
    expect(nav.className).toContain('md:hidden');
  });

  it('inactive items have muted styling', () => {
    renderWithRouter('/dashboard');
    const plannerLink = screen.getByLabelText('Planner');
    expect(plannerLink.className).toContain('text-muted-foreground');
  });
});
