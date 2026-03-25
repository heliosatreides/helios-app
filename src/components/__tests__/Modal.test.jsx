import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Modal } from '../Modal';

describe('Modal', () => {
  let onClose;

  beforeEach(() => {
    onClose = vi.fn();
    document.body.style.overflow = '';
  });

  it('renders children when open=true', () => {
    render(<Modal open={true} onClose={onClose}><p>Hello</p></Modal>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('does not render when open=false', () => {
    render(<Modal open={false} onClose={onClose}><p>Hello</p></Modal>);
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('calls onClose when ESC pressed', () => {
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop clicked', () => {
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when modal content clicked', () => {
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    fireEvent.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sets body overflow hidden when open', () => {
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow on close', () => {
    const { rerender } = render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<Modal open={false} onClose={onClose}><p>Content</p></Modal>);
    expect(document.body.style.overflow).toBe('');
  });
});
