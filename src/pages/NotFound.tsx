import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppIcon from '../components/ui/AppIcon';

import '../styles/pages/not-found.css';

const NotFound = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const homePath = isAuthenticated ? (isAdmin ? '/dashboard' : '/delivery/home') : '/login';

  return (
    <section className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-card">
        <span className="not-found-icon" aria-hidden="true">
          <AppIcon name="search" />
        </span>
        <p className="not-found-code">404</p>
        <h1 id="not-found-title">Page not found</h1>
        <p className="not-found-copy">
          The page you requested does not exist or may have been moved.
        </p>
        <div className="not-found-actions">
          <Link to={homePath} className="create-button">
            Go to {isAuthenticated ? 'Home' : 'Login'}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
