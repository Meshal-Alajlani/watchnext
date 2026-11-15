import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.js';
import { useServices } from '../services/ServicesContext.js';
import { ProfileContext } from './ProfileContext.js';

const EMPTY = { profile: null, error: null };

export function ProfileProvider({ children }) {
  const { api } = useServices();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [loaded, setLoaded] = useState({ userId: null, profile: null, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;
    const controller = new AbortController();
    api.profile({ signal: controller.signal }).then(
      (profile) => setLoaded({ userId, profile, error: null }),
      (error) => {
        if (error?.name !== 'AbortError') setLoaded({ userId, profile: null, error });
      },
    );
    return () => controller.abort();
  }, [api, userId, version]);

  const update = useCallback(
    async (changes) => {
      const profile = await api.updateProfile(changes);
      setLoaded({ userId, profile, error: null });
      return profile;
    },
    [api, userId],
  );

  // Reloads the counts in the background; the old values stay on screen meanwhile.
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  // Ignore data that belongs to a previous user (after signing out or switching accounts).
  const current = userId && loaded.userId === userId ? loaded : EMPTY;

  const value = useMemo(
    () => ({
      profile: current.profile,
      error: current.error,
      loading: Boolean(userId) && !current.profile && !current.error,
      update,
      refresh,
    }),
    [current, userId, update, refresh],
  );

  return <ProfileContext value={value}>{children}</ProfileContext>;
}
