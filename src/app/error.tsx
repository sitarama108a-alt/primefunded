'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-headline font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        An unexpected error occurred. Our team has been notified. Please try refreshing the page or contact support if the issue persists.
      </p>
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="font-bold cursor-pointer"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
        <Button 
          className="font-bold cursor-pointer"
          onClick={() => reset()}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
      <div className="mt-12 text-[10px] uppercase font-black tracking-widest text-muted-foreground/30">
        Error ID: {error.digest || 'N/A'}
      </div>
    </div>
  );
}