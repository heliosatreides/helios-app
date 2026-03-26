import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ToastProvider, useToast } from './Toast';

function TestTrigger() {
  const { addToast } = useToast();
  return <button onClick={() => addToast('Test message', { type: 'success', duration: 0 })}>Show toast</button>;
}

test('toast container has bottom-20 for mobile and md:bottom-4 for desktop', () => {
  const { container } = render(
    <ToastProvider>
      <TestTrigger />
    </ToastProvider>
  );

  // Trigger a toast so the container is in the DOM
  act(() => {
    screen.getByText('Show toast').click();
  });

  const toastContainer = container.querySelector('.fixed.bottom-20.md\\:bottom-4');
  expect(toastContainer).toBeInTheDocument();
});

test('displays toast message after addToast is called', () => {
  render(
    <ToastProvider>
      <TestTrigger />
    </ToastProvider>
  );

  act(() => {
    screen.getByText('Show toast').click();
  });

  expect(screen.getByText('Test message')).toBeInTheDocument();
});

test('toast dismiss button removes toast', () => {
  render(
    <ToastProvider>
      <TestTrigger />
    </ToastProvider>
  );

  act(() => {
    screen.getByText('Show toast').click();
  });

  expect(screen.getByText('Test message')).toBeInTheDocument();

  act(() => {
    screen.getByText('×').click();
  });

  expect(screen.queryByText('Test message')).not.toBeInTheDocument();
});

test('useToast returns no-op functions outside provider', () => {
  function Standalone() {
    const { addToast, success, error, info } = useToast();
    // Should not throw — just no-ops
    addToast('test');
    success('test');
    error('test');
    info('test');
    return <div>ok</div>;
  }

  render(<Standalone />);
  expect(screen.getByText('ok')).toBeInTheDocument();
});
