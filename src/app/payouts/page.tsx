"use client";

import { useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowDownRight, History, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/firebase';
import { where } from 'firebase/firestore';

export default function PayoutsPage() {
  const { user } = useAuth();
  
  const payoutConstraints = useMemo(() => {
    if (!user?.uid) return [];
    return [where('userId', '==', user.uid)];
  }, [user?.uid]);

  const { data: payouts, loading } = useCollection<any>('payouts', payoutConstraints);

  const stats = useMemo(() => {
    const totalPaid = payouts?.filter(p => p.status === 'done').reduce((acc, p) => acc + parseFloat(p.amount || 0), 0) || 0;
    const pending = payouts?.filter(p => p.status === 'pending' || p.status === 'approved').reduce((acc, p) => acc + parseFloat(p.amount || 0), 0) || 0;
    return { totalPaid, pending };
  }, [payouts]);

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
              <h3 className="text-4xl font-headline font-bold mb-2">$0.00</h3>
              <p className="text-xs text-muted-foreground italic">Eligibility checked daily.</p>
              <Button className="w-full mt-6 font-bold" disabled>Request Payout</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Paid Out</p>
                <ArrowDownRight className="text-accent w-5 h-5" />
              </div>
              <h3 className="text-4xl font-headline font-bold mb-2">${stats.totalPaid.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground">Lifetime withdrawals</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Payouts</p>
                <Clock className="text-primary w-5 h-5" />
              </div>
              <h3 className="text-4xl font-headline font-bold mb-2">${stats.pending.toLocaleString()}</h3>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
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
                  {payouts?.length > 0 ? payouts.map(p => (
                    <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-2 font-medium">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-4 px-2 text-muted-foreground">{p.method}</td>
                      <td className="py-4 px-2 font-bold text-accent">${p.amount}</td>
                      <td className="py-4 px-2 text-right">
                        <span className="px-2 py-1 rounded-full bg-accent/10 text-accent text-[10px] border border-accent/20 uppercase font-bold">{p.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground italic">No payout requests found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
