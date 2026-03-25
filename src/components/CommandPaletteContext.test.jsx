import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';
import { CommandPaletteProvider, useCommandPalette } from './CommandPaletteContext';

function TestConsumer() {
  const { open, openCommandPalette, closeCommandPalette, toggleCommandPalette } = useCommandPalette();
  return (
    <div>
      <span data-testid="state">{open ? 'open' : 'closed'}</span>
      <button data-testid="open-btn" onClick={openCommandPalette}>Open</button>
      <button data-testid="close-btn" onClick={closeCommandPalette}>Close</button>
      <button data-testid="toggle-btn" onClick={toggleCommandPalette}>Toggle</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <CommandPaletteProvider>
      <TestConsumer />
    </CommandPaletteProvider>
  );
}

test('CommandPaletteContext: starts closed', () => {
  renderWithProvider();
  expect(screen.getByTestId('state')).toHaveTextContent('closed');
});

test('CommandPaletteContext: openCommandPalette sets open to true', () => {
  renderWithProvider();
  fireEvent.click(screen.getByTestId('open-btn'));
  expect(screen.getByTestId('state')).toHaveTextContent('open');
});

test('CommandPaletteContext: closeCommandPalette sets open to false', () => {
  renderWithProvider();
  fireEvent.click(screen.getByTestId('open-btn'));
  expect(screen.getByTestId('state')).toHaveTextContent('open');
  fireEvent.click(screen.getByTestId('close-btn'));
  expect(screen.getByTestId('state')).toHaveTextContent('closed');
});

test('CommandPaletteContext: toggleCommandPalette toggles state', () => {
  renderWithProvider();
  expect(screen.getByTestId('state')).toHaveTextContent('closed');
  fireEvent.click(screen.getByTestId('toggle-btn'));
  expect(screen.getByTestId('state')).toHaveTextContent('open');
  fireEvent.click(screen.getByTestId('toggle-btn'));
  expect(screen.getByTestId('state')).toHaveTextContent('closed');
});

test('CommandPaletteContext: multiple opens are idempotent', () => {
  renderWithProvider();
  fireEvent.click(screen.getByTestId('open-btn'));
  fireEvent.click(screen.getByTestId('open-btn'));
  expect(screen.getByTestId('state')).toHaveTextContent('open');
});
