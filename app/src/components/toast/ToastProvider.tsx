import React, { useCallback, useState } from 'react';
import { ToastContext } from './context';

type ToastItem = {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
  timeout?: number;
};

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: ToastItem = { id, ...t };
    setToasts(s => [toast, ...s]);
    const ttl = t.timeout ?? 6000;
    if (ttl > 0) setTimeout(() => setToasts(s => s.filter(x => x.id !== id)), ttl);
    return id;
  }, []);

  const remove = useCallback((id: string) => setToasts(s => s.filter(t => t.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="fixed top-4 right-4 z-[99999] flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`max-w-sm w-full rounded shadow-lg p-3 border ${t.type === 'success' ? 'bg-green-50 border-green-200' : t.type === 'error' ? 'bg-red-50 border-red-200' : 'bg-surface border-stone-200'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="font-medium text-sm text-ink">{t.title}</div>
                {t.description && <div className="text-xs text-inkMuted mt-1">{t.description}</div>}
              </div>
              <button onClick={() => remove(t.id)} className="text-xs text-inkMuted">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
