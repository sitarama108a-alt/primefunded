"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle2 } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

function PaymentContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const plan = searchParams.get('plan') || '1-step';
  const size = searchParams.get('size') || '$100k';
  const price = searchParams.get('price') || '$549';
  
  const [txHash, setTxHash] = useState('');
  const [network, setNetwork] = useState('ERC20');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const orderData = {
        userId: user.uid,
        email: user.email,
        plan,
        size,
        price,
        network,
        txHash,
        status: 'pending',
        date: new Date().toISOString(),
      };

      const ordersRef = collection(db, 'orders');
      addDoc(ordersRef, orderData)
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'orders',
            operation: 'create',
            requestResourceData: orderData
          }));
        });

      setSubmitted(true);
      toast({
        title: "Order Submitted",
        description: "An admin will verify your transaction shortly.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText('0x1234567890ABCDEF1234567890ABCDEF12345678');
    toast({ title: "Copied", description: "Payment address copied to clipboard." });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-8">
          <CheckCircle2 className="text-accent w-10 h-10" />
        </div>
        <h2 className="text-3xl font-headline font-bold mb-4">Payment Pending Verification</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-10 leading-relaxed">
          Thank you for your purchase! Our team is verifying your transaction on the blockchain. 
          Your MT5 credentials will be sent to your email ({user?.email}) once approved.
        </p>
        <Button size="lg" asChild>
          <a href="/dashboard">Back to Dashboard</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-headline font-bold mb-2">Complete Your Purchase</h1>
        <p className="text-muted-foreground">Follow the steps below to finalize your {size} {plan.toUpperCase()} challenge.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>1. Send Payment</CardTitle>
            <CardDescription>Transfer the exact amount to our secure crypto address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-secondary rounded-xl border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount Due</span>
                <span className="text-sm font-bold text-primary">USDT</span>
              </div>
              <div className="text-3xl font-headline font-bold">{price}</div>
            </div>
            
            <div className="space-y-2">
              <Label>Select Network</Label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setNetwork('ERC20')}
                  className={`p-3 rounded-lg border text-sm font-bold transition-all ${network === 'ERC20' ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary/50 border-border text-muted-foreground'}`}
                >
                  USDT (ERC20)
                </button>
                <button 
                  onClick={() => setNetwork('TRC20')}
                  className={`p-3 rounded-lg border text-sm font-bold transition-all ${network === 'TRC20' ? 'bg-primary/10 border-primary text-primary' : 'bg-secondary/50 border-border text-muted-foreground'}`}
                >
                  USDT (TRC20)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Address</Label>
              <div className="flex gap-2">
                <Input readOnly value="0x1234567890ABCDEF1234567890ABCDEF12345678" className="bg-secondary/50 font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={copyAddress}><Copy className="w-4 h-4" /></Button>
              </div>
              <p className="text-[10px] text-destructive font-bold uppercase tracking-widest mt-2">Only send USDT on the selected network</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>2. Submit Details</CardTitle>
            <CardDescription>Provide your transaction hash for instant verification.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction Hash (TXID)</Label>
                <Input 
                  id="txHash" 
                  placeholder="Paste your transaction hash here..." 
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  required
                  className="bg-secondary/50 h-12"
                />
              </div>
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex gap-2"><CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" /> Verified by Admin within 1-4 hours</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" /> MT5 Credentials sent via email</li>
                  <li className="flex gap-2"><CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" /> Dashboard activated instantly upon approval</li>
                </ul>
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-lg" disabled={loading || !txHash}>
                {loading ? 'Submitting...' : 'Confirm Payment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading payment details...</div>}>
          <PaymentContent />
        </Suspense>
      </main>
    </div>
  );
}
