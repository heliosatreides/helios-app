import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from './BottomNav';

const mockOnOpenSidebar = vi.fn();

function renderWithRouter(initialPath = '/dashboard') {
  mockOnOpenSidebar.mockClear();
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav onOpenSidebar={mockOnOpenSidebar} />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renders all four navigation items plus More button', () => {
    renderWithRouter();
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Planner')).toBeInTheDocument();
    expect(screen.getByLabelText('Finance')).toBeInTheDocument();
    expect(screen.getByLabelText('AI Chat')).toBeInTheDocument();
    expect(screen.getByLabelText('More')).toBeInTheDocument();
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
    const moreBtn = screen.getByLabelText('More');
    expect(moreBtn.className).toContain('min-h-[44px]');
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

  it('More button calls onOpenSidebar when clicked', () => {
    renderWithRouter();
    fireEvent.click(screen.getByLabelText('More'));
    expect(mockOnOpenSidebar).toHaveBeenCalledTimes(1);
  });

  it('More button is highlighted when on a non-main route', () => {
    renderWithRouter('/goals');
    const moreBtn = screen.getByLabelText('More');
    expect(moreBtn.className).toContain('text-foreground');
  });

  it('More button is muted when on a main route', () => {
    renderWithRouter('/dashboard');
    const moreBtn = screen.getByLabelText('More');
    expect(moreBtn.className).toContain('text-muted-foreground');
  });

  it('shows active indicator bar on active nav item', () => {
    renderWithRouter('/dashboard');
    const homeLink = screen.getByLabelText('Home');
    const indicator = homeLink.querySelector('.bg-foreground');
    expect(indicator).toBeInTheDocument();
    expect(indicator.className).toContain('h-0.5');
  });

  it('does not show active indicator on inactive nav items', () => {
    renderWithRouter('/dashboard');
    const plannerLink = screen.getByLabelText('Planner');
    const indicator = plannerLink.querySelector('.bg-foreground');
    expect(indicator).toBeNull();
  });

  it('More button has data-testid', () => {
    renderWithRouter();
    expect(screen.getByTestId('bottom-nav-more')).toBeInTheDocument();
  });
});
