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

  it('renders built-in close button', () => {
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    const closeBtn = screen.getByTestId('modal-close');
    expect(closeBtn).toBeInTheDocument();
    expect(closeBtn).toHaveAttribute('aria-label', 'Close');
  });

  it('calls onClose when close button clicked', () => {
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders title when provided', () => {
    render(<Modal open={true} onClose={onClose} title="Edit Item"><p>Content</p></Modal>);
    expect(screen.getByText('Edit Item')).toBeInTheDocument();
  });

  it('close button has 44px minimum tap target', () => {
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    const closeBtn = screen.getByTestId('modal-close');
    expect(closeBtn.className).toContain('min-w-[44px]');
    expect(closeBtn.className).toContain('min-h-[44px]');
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

  it('content div has max-h-[90dvh] and overflow-y-auto for tall modal scrolling', () => {
    render(<Modal open={true} onClose={onClose}><p>Content</p></Modal>);
    const backdrop = screen.getByTestId('modal-backdrop');
    const contentDiv = backdrop.firstChild;
    expect(contentDiv.className).toContain('max-h-[90dvh]');
    expect(contentDiv.className).toContain('overflow-y-auto');
  });

  it('allows className override without losing base scroll classes', () => {
    render(<Modal open={true} onClose={onClose} className="max-w-lg"><p>Content</p></Modal>);
    const backdrop = screen.getByTestId('modal-backdrop');
    const contentDiv = backdrop.firstChild;
    expect(contentDiv.className).toContain('max-h-[90dvh]');
    expect(contentDiv.className).toContain('overflow-y-auto');
    expect(contentDiv.className).toContain('max-w-lg');
  });
});
