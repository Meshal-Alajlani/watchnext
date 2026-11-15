import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './Toast.module.css';
import { ToastContext } from './ToastContext.js';

const VISIBLE_MS = 3200;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const show = useCallback((message, tone = 'info') => {
    if (!message) return;
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), VISIBLE_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className={`${styles.toast} ${toast.tone === 'error' ? styles.error : ''}`}>
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext>
  );
}
