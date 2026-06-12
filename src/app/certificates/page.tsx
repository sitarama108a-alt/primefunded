"use client";

import { Navigation } from '@/components/Navigation';
import { Award } from 'lucide-react';

export default function CertificatesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">Your Certificates</h1>
          <p className="text-muted-foreground">Verified proof of your trading excellence.</p>
        </header>

        <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-border rounded-3xl bg-secondary/10">
          <div className="p-6 bg-primary/10 rounded-full border border-primary/20">
            <Award className="w-16 h-16 text-primary opacity-50" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">No certificates yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Pass an evaluation or reach a payout milestone to earn your official PrimeFunded credentials.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
