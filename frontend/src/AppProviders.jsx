import { AuthProvider } from './context/auth/AuthProvider.jsx';
import { LibraryProvider } from './context/library/LibraryProvider.jsx';
import { ProfileProvider } from './context/profile/ProfileProvider.jsx';
import { ServicesProvider } from './context/services/ServicesProvider.jsx';
import { ToastProvider } from './context/toast/ToastProvider.jsx';

/**
 * App-wide state, from the most basic to the most specific. Each provider only uses
 * the ones above it: services -> toast -> auth -> profile -> library.
 */
export function AppProviders({ services, children }) {
  return (
    <ServicesProvider services={services}>
      <ToastProvider>
        <AuthProvider>
          <ProfileProvider>
            <LibraryProvider>{children}</LibraryProvider>
          </ProfileProvider>
        </AuthProvider>
      </ToastProvider>
    </ServicesProvider>
  );
}
