import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const ToastContext = createContext(null);
let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, { type = 'info', duration = 3000 } = {}) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const colors = {
    success: 'border-green-800 text-green-400',
    error: 'border-red-800 text-red-400',
    info: 'text-foreground',
    warning: 'border-yellow-800 text-yellow-400',
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 bg-background border border-border text-sm transition-all duration-200 ${colors[toast.type] || ''} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <span className="font-medium">{toast.message}</span>
      <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground text-xs ml-2 shrink-0">×</button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { addToast: () => {}, removeToast: () => {}, success: () => {}, error: () => {}, info: () => {} };
  return {
    ...ctx,
    success: (msg, opts) => ctx.addToast(msg, { type: 'success', ...opts }),
    error: (msg, opts) => ctx.addToast(msg, { type: 'error', ...opts }),
    info: (msg, opts) => ctx.addToast(msg, { type: 'info', ...opts }),
  };
}
