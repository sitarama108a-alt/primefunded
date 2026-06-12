"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, Search, Download, Filter } from 'lucide-react';
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
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        </header>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input className="pl-10" placeholder="Search by symbol, type, or order ID..." />
          </div>
          <Button variant="secondary"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
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
                  <HistoryRow symbol="EURUSD" type="Buy" lot={1.5} entry={1.0845} exit={1.0862} pnl={255.00} date="2024-03-12 14:22" />
                  <HistoryRow symbol="XAUUSD" type="Sell" lot={0.5} entry={2045.20} exit={2047.80} pnl={-130.00} date="2024-03-12 11:15" />
                  <HistoryRow symbol="NAS100" type="Buy" lot={2.0} entry={18240} exit={18285} pnl={900.00} date="2024-03-11 20:30" />
                  <HistoryRow symbol="GBPUSD" type="Buy" lot={1.0} entry={1.2654} exit={1.2662} pnl={80.00} date="2024-03-11 09:45" />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function HistoryRow({ symbol, type, lot, entry, exit, pnl, date }: any) {
  const isProfit = pnl >= 0;
  return (
    <tr className="hover:bg-secondary/20 transition-colors">
      <td className="py-4 px-6 font-mono font-bold">{symbol}</td>
      <td className="py-4 px-2">
        <Badge variant={type === 'Buy' ? 'default' : 'destructive'} className="text-[10px] uppercase">{type}</Badge>
      </td>
      <td className="py-4 px-2 text-muted-foreground">{lot.toFixed(2)}</td>
      <td className="py-4 px-2 text-muted-foreground">{entry.toFixed(5)}</td>
      <td className="py-4 px-2 text-muted-foreground">{exit.toFixed(5)}</td>
      <td className={`py-4 px-2 font-mono font-bold ${isProfit ? 'text-accent' : 'text-destructive'}`}>
        {isProfit ? '+' : ''}{pnl.toFixed(2)}
      </td>
      <td className="py-4 px-6 text-right text-muted-foreground text-xs">{date}</td>
    </tr>
  );
}
