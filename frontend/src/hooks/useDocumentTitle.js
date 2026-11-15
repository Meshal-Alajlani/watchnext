import { useEffect } from 'react';

/** Sets the browser tab title, for example "Inception · WatchNext". */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · WatchNext` : 'WatchNext';
  }, [title]);
}
