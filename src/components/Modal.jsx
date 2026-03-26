import { useEffect, useRef, useCallback } from 'react';

export function Modal({ open, onClose, children, className = '', title = '' }) {
  const contentRef = useRef(null);

  // ESC key to close
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    function handleTab(e) {
      if (e.key !== 'Tab') return;
      const el = contentRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      data-testid="modal-backdrop"
      onClick={onClose}
    >
      <div
        ref={contentRef}
        className={`bg-background border border-border p-4 sm:p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          {title ? (
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors -mr-2 -mt-2"
            aria-label="Close"
            data-testid="modal-close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
