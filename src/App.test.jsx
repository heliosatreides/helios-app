import { render, screen } from '@testing-library/react';
import App from './App.jsx';

// Mock localStorage for App tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

test('App renders without crashing', () => {
  render(<App />);
  // Multiple "Helios" elements exist (sidebar + mobile header), use getAllByText
  const heliosElements = screen.getAllByText(/Helios/i);
  expect(heliosElements.length).toBeGreaterThan(0);
});
