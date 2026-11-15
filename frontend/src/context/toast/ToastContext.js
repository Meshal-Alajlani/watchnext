import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

/** Shows a short message at the bottom of the screen: `show(message, 'info' | 'error')`. */
export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>.');
  return toast;
}
