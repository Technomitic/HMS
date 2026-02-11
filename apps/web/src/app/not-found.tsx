import Link from 'next/link';
import { Activity, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-6xl font-bold gradient-text">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-neutral-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn-primary flex items-center gap-2">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
}