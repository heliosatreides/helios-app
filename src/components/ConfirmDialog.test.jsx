import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete item?',
    message: 'This will permanently delete this item.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Delete item?')).not.toBeInTheDocument();
  });

  it('renders title and message when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Delete item?')).toBeInTheDocument();
    expect(screen.getByText('This will permanently delete this item.')).toBeInTheDocument();
  });

  it('renders default confirm label "Delete"', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByTestId('confirm-delete')).toHaveTextContent('Delete');
  });

  it('renders custom confirm label', () => {
    render(<ConfirmDialog {...defaultProps} confirmLabel="Remove" />);
    expect(screen.getByTestId('confirm-delete')).toHaveTextContent('Remove');
  });

  it('renders Cancel button', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('confirm-delete'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when modal backdrop is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('modal-backdrop'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when modal close button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('modal-close'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('confirm and cancel buttons have 44px minimum height for mobile touch targets', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmBtn = screen.getByTestId('confirm-delete');
    const cancelBtn = screen.getByText('Cancel');
    expect(confirmBtn.className).toContain('min-h-[44px]');
    expect(cancelBtn.className).toContain('min-h-[44px]');
  });

  it('confirm button has danger styling by default', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const btn = screen.getByTestId('confirm-delete');
    expect(btn.className).toContain('border-red-800');
    expect(btn.className).toContain('text-red-400');
  });
});
