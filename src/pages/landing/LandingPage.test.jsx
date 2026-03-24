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
    expect(screen.getByText(/Your entire life/i)).toBeInTheDocument();
    expect(screen.getByText(/one private dashboard/i)).toBeInTheDocument();
  });

  it('CTA "Get Started" links to /login', () => {
    renderLanding();
    const getStarted = screen.getAllByRole('link', { name: /Get Started/i });
    expect(getStarted[0]).toHaveAttribute('href', '/login');
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
    expect(screen.getByText(/100% local/i)).toBeInTheDocument();
  });

  it('shows feature cards for default category', () => {
    renderLanding();
    expect(screen.getByText('Trip Planning')).toBeInTheDocument();
    expect(screen.getByText('Personal Finance')).toBeInTheDocument();
    expect(screen.getByText('Investments')).toBeInTheDocument();
    expect(screen.getByText('Sports Hub')).toBeInTheDocument();
  });

  it('shows privacy section', () => {
    renderLanding();
    expect(screen.getByText(/Browser-native storage/i)).toBeInTheDocument();
    expect(screen.getByText(/Encrypted secrets/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero data collection/i)).toBeInTheDocument();
  });

  it('shows AI section headline', () => {
    renderLanding();
    expect(screen.getByText(/AI that respects your data/i)).toBeInTheDocument();
  });
});
