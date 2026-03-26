import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UtilitiesPage } from './UtilitiesPage';

// Mock all child pages to keep tests fast and isolated
vi.mock('../calculator/CalculatorPage', () => ({
  CalculatorPage: ({ embedded }) => <div data-testid="calculator-page" data-embedded={embedded}>Calculator</div>,
}));
vi.mock('../converter/ConverterPage', () => ({
  ConverterPage: ({ embedded }) => <div data-testid="converter-page" data-embedded={embedded}>Converter</div>,
}));
vi.mock('../worldclock/WorldClockPage', () => ({
  WorldClockPage: ({ embedded }) => <div data-testid="worldclock-page" data-embedded={embedded}>WorldClock</div>,
}));
vi.mock('../regex/RegexPage', () => ({
  RegexPage: ({ embedded }) => <div data-testid="regex-page" data-embedded={embedded}>Regex</div>,
}));
vi.mock('../password/PasswordGenerator', () => ({
  PasswordGenerator: () => <div data-testid="password-page">Passwords</div>,
}));

function renderWithRouter(initialEntry = '/utilities') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <UtilitiesPage />
    </MemoryRouter>
  );
}

describe('UtilitiesPage', () => {
  it('renders page header', () => {
    renderWithRouter();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('Calculator, converter, world clock, and more')).toBeInTheDocument();
  });

  it('renders all tab buttons', () => {
    renderWithRouter();
    const buttons = screen.getAllByRole('button');
    const tabLabels = buttons.map((b) => b.textContent);
    expect(tabLabels).toContain('Calculator');
    expect(tabLabels).toContain('Converter');
    expect(tabLabels).toContain('World Clock');
    expect(tabLabels).toContain('Regex');
    expect(tabLabels).toContain('Passwords');
  });

  it('defaults to Calculator tab', () => {
    renderWithRouter();
    expect(screen.getByTestId('calculator-page')).toBeInTheDocument();
    expect(screen.queryByTestId('converter-page')).not.toBeInTheDocument();
  });

  it('switches to Converter tab on click', () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Converter'));
    expect(screen.getByTestId('converter-page')).toBeInTheDocument();
    expect(screen.queryByTestId('calculator-page')).not.toBeInTheDocument();
  });

  it('switches to World Clock tab on click', () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('World Clock'));
    expect(screen.getByTestId('worldclock-page')).toBeInTheDocument();
  });

  it('switches to Regex tab on click', () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Regex'));
    expect(screen.getByTestId('regex-page')).toBeInTheDocument();
  });

  it('switches to Passwords tab on click', () => {
    renderWithRouter();
    fireEvent.click(screen.getByText('Passwords'));
    expect(screen.getByTestId('password-page')).toBeInTheDocument();
  });

  it('reads tab from URL query param', () => {
    renderWithRouter('/utilities?tab=regex');
    expect(screen.getByTestId('regex-page')).toBeInTheDocument();
    expect(screen.queryByTestId('calculator-page')).not.toBeInTheDocument();
  });

  it('defaults to calculator for invalid tab param', () => {
    renderWithRouter('/utilities?tab=invalid');
    expect(screen.getByTestId('calculator-page')).toBeInTheDocument();
  });

  it('passes embedded=true to child pages', () => {
    renderWithRouter();
    expect(screen.getByTestId('calculator-page')).toHaveAttribute('data-embedded', 'true');
  });

  it('passes embedded=true to converter when active', () => {
    renderWithRouter('/utilities?tab=converter');
    expect(screen.getByTestId('converter-page')).toHaveAttribute('data-embedded', 'true');
  });
});
