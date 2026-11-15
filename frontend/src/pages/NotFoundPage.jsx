import { Button } from '../components/ui/Button.jsx';
import { StateMessage } from '../components/ui/StateMessage.jsx';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <div className="container">
      <StateMessage
        icon="film"
        title="This page doesn't exist"
        message="The link may be broken, or the page was moved."
        action={
          <Button variant="primary" to="/">
            Go home
          </Button>
        }
      />
    </div>
  );
}
