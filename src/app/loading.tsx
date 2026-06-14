'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || 'https://picsum.photos/seed/pflogo-blue-silver/400/400';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Image 
            src={logoUrl || 'https://picsum.photos/seed/pflogo-blue-silver/400/400'} 
            alt="PrimeFunded" 
            width={50} 
            height={50} 
            className="rounded-full animate-pulse shadow-[0_0_20px_rgba(17,179,245,0.4)]"
            data-ai-hint="PF logo"
          />
        </div>
      </div>
      <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
        Initializing PrimeFunded Node...
      </p>
    </div>
  );
}
