import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="section-pad container-x flex flex-col items-center justify-center text-center">
      <div className="mb-6 rounded-full bg-destructive/10 p-4 text-destructive">
        <ShieldX className="h-8 w-8" />
      </div>
      <h1 className="heading-1 mb-4">Access denied</h1>
      <p className="mb-6 max-w-lg text-ink-600">
        Your account doesn&apos;t have permission to view this area. If you believe this is a mistake, contact the hotel.
      </p>
      <Button asChild>
        <Link to="/">Return home</Link>
      </Button>
    </div>
  );
}
