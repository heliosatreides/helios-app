import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from './LandingPage';

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  it('renders without crashing', () => {
    renderLanding();
  });

  it('shows the hero headline', () => {
    renderLanding();
    expect(screen.getByText(/Your life, organized/i)).toBeInTheDocument();
    expect(screen.getByText(/No cloud required/i)).toBeInTheDocument();
  });

  it('CTA "Get Started" links to /login', () => {
    renderLanding();
    const getStarted = screen.getByRole('link', { name: /Get Started/i });
    expect(getStarted).toHaveAttribute('href', '/login');
  });

  it('CTA "Open Helios" links to /login', () => {
    renderLanding();
    const openHelios = screen.getByRole('link', { name: /Open Helios/i });
    expect(openHelios).toHaveAttribute('href', '/login');
  });

  it('Sign In nav link points to /login', () => {
    renderLanding();
    const signIn = screen.getByRole('link', { name: /Sign In/i });
    expect(signIn).toHaveAttribute('href', '/login');
  });

  it('shows privacy callout', () => {
    renderLanding();
    expect(screen.getByText(/100% local. Zero servers. Zero tracking./i)).toBeInTheDocument();
  });

  it('shows all four feature cards', () => {
    renderLanding();
    expect(screen.getByText('Trip Planning')).toBeInTheDocument();
    expect(screen.getByText('Personal Finance')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
    expect(screen.getByText('Sports Hub')).toBeInTheDocument();
  });

  it('shows privacy deep-dive section', () => {
    renderLanding();
    expect(screen.getByText(/Stored in your browser/i)).toBeInTheDocument();
    expect(screen.getByText(/Encrypted at rest/i)).toBeInTheDocument();
    expect(screen.getByText(/No accounts, no tracking/i)).toBeInTheDocument();
  });

  it('shows AI section headline', () => {
    renderLanding();
    expect(screen.getByText(/AI that works for you/i)).toBeInTheDocument();
  });
});
