'use client';

import { useEffect } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-bg">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-danger-500 flex items-center justify-center">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-neutral-muted">
          We encountered an unexpected error. Please try again.
        </p>
        <button onClick={reset} className="btn-primary flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  );
}