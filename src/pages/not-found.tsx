import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="section-pad container-x flex flex-col items-center justify-center text-center">
      <h1 className="heading-1 mb-4">Page not found</h1>
      <p className="mb-6 max-w-lg text-ink-600">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="text-forest-700 hover:underline">Return home</Link>
    </div>
  );
}
