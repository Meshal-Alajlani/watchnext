import { useEffect, useRef, useState } from 'react';
import { useServices } from '../context/services/ServicesContext.js';

/**
 * Loads data from the MovieApi and tracks loading and error state.
 *
 *   const movie = useApiQuery((api, signal) => api.movie(id, { signal }), [id]);
 *
 * `deps` decide when to load again, like useEffect. An older request is cancelled when a
 * newer one starts, so a slow answer can never overwrite fresh data.
 * Pass `{ enabled: false }` to wait, for example until a search box has enough letters.
 */
export function useApiQuery(load, deps, { enabled = true } = {}) {
  const { api } = useServices();
  const loadRef = useRef(load);
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, data: undefined, error: null });
  const key = enabled ? `${JSON.stringify(deps)}#${version}` : null;

  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (key === null) return undefined;
    const controller = new AbortController();
    loadRef.current(api, controller.signal).then(
      (data) => setResult({ key, data, error: null }),
      (error) => {
        if (error?.name !== 'AbortError') setResult({ key, data: undefined, error });
      },
    );
    return () => controller.abort();
  }, [api, key]);

  const isCurrent = result.key === key;
  return {
    data: isCurrent ? result.data : undefined,
    error: isCurrent ? result.error : null,
    loading: enabled && !isCurrent,
    reload: () => setVersion((v) => v + 1),
  };
}
