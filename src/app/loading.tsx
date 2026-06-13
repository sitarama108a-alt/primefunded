
'use client';

import { TrendingUp } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <TrendingUp className="text-primary w-6 h-6 animate-pulse" />
        </div>
      </div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
        Initializing PrimeFunded Node...
      </p>
    </div>
  );
}
