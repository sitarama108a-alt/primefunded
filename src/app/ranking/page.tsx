"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medal, Users } from 'lucide-react';

export default function RankingPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1 text-primary flex items-center gap-3">
            <Medal className="w-8 h-8" /> Trader Rankings
          </h1>
          <p className="text-muted-foreground">The elite 1% of PrimeFunded. Top performers by verified all-time profit.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Top 3 slots will be populated here */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">All-Time Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="p-20 text-center flex flex-col items-center justify-center border-t border-border">
            <Users className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-bold">No ranking data available</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Rankings are updated weekly based on verified trading performance. Start trading to earn your spot!</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
