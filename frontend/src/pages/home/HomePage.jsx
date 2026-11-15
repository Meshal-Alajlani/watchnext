import { PageSpinner } from '../../components/ui/Spinner.jsx';
import { useAuth } from '../../context/auth/AuthContext.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { PersonalHome } from './PersonalHome.jsx';
import { WelcomeHome } from './WelcomeHome.jsx';

/** Visitors see the welcome page; signed-in users see their personal picks. */
export function HomePage() {
  const { user, ready } = useAuth();
  useDocumentTitle(null);

  if (!ready) return <PageSpinner />;
  return user ? <PersonalHome user={user} /> : <WelcomeHome />;
}
