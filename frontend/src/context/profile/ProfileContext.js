import { createContext, useContext } from 'react';

export const ProfileContext = createContext(null);

/**
 * The signed-in user's WatchNext profile: display name, Hide 18+ setting and counts.
 * `profile` is null while loading or when signed out.
 */
export function useProfile() {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error('useProfile must be used inside <ProfileProvider>.');
  return profile;
}
