import { Link } from 'react-router-dom';
import PageMetadata from '../components/analytics/PageMetadata';

function NotFound() {
  return (
    <div className="not-found-container">
      <PageMetadata title="Page not found" noindex />
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <p className="not-found-message">Page not found</p>
        <p className="not-found-description">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="not-found-link">
          Go back home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
