
"use client";

import { useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, ArrowDownRight, History, Clock, AlertTriangle, ShieldCheck, XCircle, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/firebase';
import { where } from 'firebase/firestore';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function PayoutsPage() {
  const { user, userData } = useAuth();
  
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

  const kycStatus = userData?.kycStatus || 'none';
  const isKycVerified = userData?.kycVerified === true;

  const renderKycWarning = () => {
    if (isKycVerified) return (
      <div className="mb-8 p-4 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent w-5 h-5" />
          <div>
            <p className="text-sm font-bold text-accent">KYC Verified - Payouts Unlocked</p>
            <p className="text-xs text-muted-foreground">Your account is fully eligible for profit withdrawals.</p>
          </div>
        </div>
        <Badge className="bg-accent text-accent-foreground">VERIFIED</Badge>
      </div>
    );

    if (kycStatus === 'pending') return (
      <div className="mb-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <Clock className="w-6 h-6" />
          <h3 className="font-bold text-lg">KYC Under Review</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your KYC documents are currently being reviewed by our compliance team. Payouts will be unlocked once approved. 
          Verification usually takes 24-48 hours.
        </p>
        <Badge variant="outline" className="border-amber-500 text-amber-500">PENDING REVIEW</Badge>
      </div>
    );

    if (kycStatus === 'rejected') return (
      <div className="mb-8 p-6 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-4">
        <div className="flex items-center gap-3 text-destructive">
          <XCircle className="w-6 h-6" />
          <h3 className="font-bold text-lg">KYC Rejected</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your KYC was rejected. <strong>Reason: {userData?.kycRejectionReason || 'No reason provided.'}</strong>. 
          Please resubmit your documents to unlock payouts.
        </p>
        <Button size="sm" variant="destructive" asChild>
          <Link href="/kyc">Resubmit KYC</Link>
        </Button>
      </div>
    );

    return (
      <div className="mb-8 p-6 rounded-2xl bg-destructive/10 border border-destructive/30 space-y-4">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="font-bold text-lg">KYC Verification Required</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You must complete KYC verification before requesting a payout. This is required to ensure secure and compliant transactions.
        </p>
        <Button size="sm" className="bg-primary hover:bg-primary/90 font-bold" asChild>
          <Link href="/kyc">Complete KYC Now</Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1 text-white">Payouts & Withdrawals</h1>
          <p className="text-muted-foreground">Monitor your earnings and request profit splits.</p>
        </header>

        {renderKycWarning()}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className={isKycVerified ? "bg-primary/10 border-primary/20" : "bg-secondary/20 border-border opacity-60"}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Withdrawable Profit</p>
                <Wallet className="text-primary w-5 h-5" />
              </div>
              <h3 className="text-4xl font-headline font-bold mb-2">$0.00</h3>
              <p className="text-xs text-muted-foreground italic">Eligibility checked daily.</p>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="w-full">
                      <Button 
                        className="w-full mt-6 font-bold" 
                        disabled={!isKycVerified}
                      >
                        Request Payout
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!isKycVerified && (
                    <TooltipContent className="bg-destructive text-white border-none">
                      <p className="text-xs font-bold">Complete KYC verification to unlock payouts</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Paid Out</p>
                <ArrowDownRight className="text-accent w-5 h-5" />
              </div>
              <h3 className="text-4xl font-headline font-bold mb-2">${stats.totalPaid.toLocaleString('en-US')}</h3>
              <p className="text-xs text-muted-foreground">Lifetime withdrawals</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pending Payouts</p>
                <Clock className="text-primary w-5 h-5" />
              </div>
              <h3 className="text-4xl font-headline font-bold mb-2">${stats.pending.toLocaleString('en-US')}</h3>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
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
                    <th className="pb-4 pt-0 px-2 text-right">Amount</th>
                    <th className="pb-4 pt-0 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {payouts?.length > 0 ? payouts.map(p => (
                    <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-2 font-medium">{new Date(p.date).toLocaleDateString()}</td>
                      <td className="py-4 px-2 text-muted-foreground">{p.method}</td>
                      <td className="py-4 px-2 font-bold text-accent text-right">${parseFloat(p.amount).toLocaleString('en-US')}</td>
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
