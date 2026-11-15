import { useEffect, useRef } from 'react';
import { Button } from './Button.jsx';
import styles from './ConfirmDialog.module.css';

/** A modal "are you sure?" dialog, built on the browser's own <dialog> element (keyboard and focus handled). */
export function ConfirmDialog({ open, title, message, confirmLabel, busyLabel, busy = false, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const cancel = (event) => {
    event.preventDefault(); // Escape key: let React state decide, so it stays in sync
    if (!busy) onCancel();
  };

  return (
    <dialog ref={ref} className={styles.dialog} onCancel={cancel} aria-labelledby="confirm-title">
      <h2 id="confirm-title" className={styles.title}>
        {title}
      </h2>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? busyLabel : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
