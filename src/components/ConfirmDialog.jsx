import { Modal } from './Modal';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  variant = 'danger',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-muted-foreground text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 min-h-[44px] border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          data-testid="confirm-delete"
          className={`flex-1 min-h-[44px] text-sm font-medium transition-colors ${
            variant === 'danger'
              ? 'border border-red-800 text-red-400 hover:bg-red-950'
              : 'bg-foreground text-background hover:bg-foreground/90'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
