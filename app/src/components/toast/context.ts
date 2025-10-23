import { createContext } from 'react';

export type ToastContextValue = {
  push: (t: { type: 'success' | 'error' | 'info'; title: string; description?: string; timeout?: number }) => string;
  remove: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export default ToastContext;
