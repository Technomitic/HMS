'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-warning-500/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-warning-500" />
        </div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-neutral-muted text-sm">{error.message}</p>
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        )}
      </div>
    </div>
  );
}