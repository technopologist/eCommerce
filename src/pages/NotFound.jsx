import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty">
      <p className="empty-emoji">🧭</p>
      <h2>Page not found</h2>
      <Link to="/" className="btn btn-primary">Back to shop</Link>
    </div>
  );
}
