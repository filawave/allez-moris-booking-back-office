import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-muted-foreground/30">404</p>
        <h1 className="text-xl font-semibold text-foreground mt-4">Page not found</h1>
        <Link to="/dashboard" className="text-sm text-primary hover:underline mt-3 inline-block">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
