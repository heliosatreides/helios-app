import { render, screen } from '@testing-library/react';
import App from './App.jsx';

// Mock localStorage and sessionStorage for App tests
const makeStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

Object.defineProperty(globalThis, 'localStorage', { value: makeStorageMock(), writable: true });
Object.defineProperty(globalThis, 'sessionStorage', { value: makeStorageMock(), writable: true });

test('App renders without crashing and shows login when not authenticated', () => {
  render(<App />);
  // When not authenticated, shows login page (multiple "Sign in" elements expected)
  const signIns = screen.getAllByText(/Sign in/i);
  expect(signIns.length).toBeGreaterThan(0);
});
