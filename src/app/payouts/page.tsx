"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowDownRight, History, Clock } from 'lucide-react';

export default function PayoutsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">Payouts & Withdrawals</h1>
          <p className="text-muted-foreground">Monitor your earnings and request profit splits.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Withdrawable Profit</p>
                <Wallet className="text-primary w-5 h-5" />
              </div>
              <h3 className="text-4xl font-headline font-bold mb-2">$2,450.50</h3>
              <p className="text-xs text-muted-foreground">Next Split Available: 4 Days</p>
              <Button className="w-full mt-6 font-bold" disabled>Request Payout</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Paid Out</p>
                <ArrowDownRight className="text-accent w-5 h-5" />
              </div>
              <h3 className="text-4xl font-headline font-bold mb-2">$12,800.00</h3>
              <p className="text-xs text-muted-foreground">Across 4 transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Payouts</p>
                <Clock className="text-primary w-5 h-5" />
              </div>
              <h3 className="text-4xl font-headline font-bold mb-2">$0.00</h3>
              <p className="text-xs text-muted-foreground">No active requests</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" /> Payout History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                    <th className="pb-4 pt-0 px-2">Date</th>
                    <th className="pb-4 pt-0 px-2">Method</th>
                    <th className="pb-4 pt-0 px-2">Amount</th>
                    <th className="pb-4 pt-0 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <PayoutRow date="2024-03-01" method="USDT (ERC20)" amount="$4,200.00" status="Completed" />
                  <PayoutRow date="2024-02-15" method="USDT (ERC20)" amount="$3,100.00" status="Completed" />
                  <PayoutRow date="2024-01-30" method="Bank Wire" amount="$2,500.00" status="Completed" />
                  <PayoutRow date="2024-01-15" method="USDT (ERC20)" amount="$3,000.00" status="Completed" />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function PayoutRow({ date, method, amount, status }: { date: string, method: string, amount: string, status: string }) {
  return (
    <tr className="hover:bg-secondary/20 transition-colors">
      <td className="py-4 px-2 font-medium">{date}</td>
      <td className="py-4 px-2 text-muted-foreground">{method}</td>
      <td className="py-4 px-2 font-bold text-accent">{amount}</td>
      <td className="py-4 px-2 text-right">
        <Badge className="bg-accent/10 text-accent border-accent/20">{status}</Badge>
      </td>
    </tr>
  );
}
