"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Download, Filter, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function HistoryPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1">Trading History</h1>
            <p className="text-muted-foreground">Review every execution across all your accounts.</p>
          </div>
          <Button variant="outline" disabled><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        </header>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input className="pl-10" placeholder="Search by symbol, type, or order ID..." />
          </div>
          <Button variant="secondary" disabled><Filter className="w-4 h-4 mr-2" /> Filters</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30">
                  <tr className="border-b border-border/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                    <th className="py-4 px-6">Symbol</th>
                    <th className="py-4 px-2">Type</th>
                    <th className="py-4 px-2">Lot</th>
                    <th className="py-4 px-2">Entry</th>
                    <th className="py-4 px-2">Exit</th>
                    <th className="py-4 px-2">P&L</th>
                    <th className="py-4 px-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td colSpan={7} className="py-20 text-center flex flex-col items-center justify-center">
                      <History className="w-10 h-10 text-muted-foreground opacity-20 mb-2" />
                      <p className="text-muted-foreground italic">No historical data found. Connect your account to MT5 to start logging trades.</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
