import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/auth/AuthContext.js';
import { loginPath } from '../../domain/navigation.js';
import { PageSpinner } from '../ui/Spinner.jsx';

/** Wraps routes that need an account. Signed-out visitors go to sign in, then come back here. */
export function RequireAuth() {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <PageSpinner />;
  if (!user) return <Navigate to={loginPath(location.pathname + location.search)} replace />;
  return <Outlet />;
}
