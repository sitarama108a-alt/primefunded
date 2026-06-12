"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle2, AlertTriangle, QrCode, Wallet, Mail, Hash } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const cryptoWallets = [
  {
    network: 'Ethereum',
    token: 'USDC/USDT',
    address: '0x3ab3ca43dc691f468bea91883f493cabf6da84d4'
  },
  {
    network: 'Tron (TRC20)',
    token: 'USDT',
    address: 'TMitDXKKnsHKgBVENHdorV4axBou6KC5JM'
  },
  {
    network: 'BNB Smart Chain',
    token: 'USDT',
    address: '0x3ab3ca43dc691f468bea91883f493cabf6da84d4'
  },
  {
    network: 'Polygon',
    token: 'USDT',
    address: '0x3ab3ca43dc691f468bea91883f493cabf6da84d4'
  }
];

function PaymentContent() {
  const searchParams = useSearchParams();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const plan = searchParams.get('plan') || '1-step';
  const size = searchParams.get('size') || '$100k';
  const price = searchParams.get('price') || '$499';
  
  const [txHash, setTxHash] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const getDisplayName = (id: string) => {
    if (id === '1-step') return '1-Step Pro';
    if (id === '2-step') return '2-Step Classic';
    return 'Instant Funding';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to purchase a challenge." });
      return;
    }
    
    setLoading(true);
    const orderData = {
      userId: user.uid,
      email: email,
      plan: getDisplayName(plan),
      size,
      price,
      txHash,
      status: 'pending',
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };

    try {
      const ordersRef = collection(db, 'orders');
      addDoc(ordersRef, orderData)
        .then(() => {
          setSubmitted(true);
          toast({
            title: "Order Submitted",
            description: "Your payment verification is being processed.",
          });
        })
        .catch(async (err) => {
          const permissionError = new FirestorePermissionError({
            path: 'orders',
            operation: 'create',
            requestResourceData: orderData
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Submission Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Address Copied", description: "The wallet address has been copied to your clipboard." });
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto"
      >
        <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-8 cyan-box-glow">
          <CheckCircle2 className="text-accent w-12 h-12" />
        </div>
        <h2 className="text-4xl font-headline font-bold mb-4">Verification Pending</h2>
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          Thank you! We've received your transaction details. Our compliance team will verify your payment within 1-4 hours. 
          Your MT5 credentials will be emailed to <span className="text-primary font-bold">{email}</span> as soon as verification is complete.
        </p>
        <div className="flex gap-4">
          <Button size="lg" className="h-14 px-8 rounded-xl font-bold" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-8 rounded-xl font-bold" onClick={() => router.push('/accounts')}>
            View Accounts
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="mb-12 text-center">
        <Badge variant="outline" className="mb-4 border-primary/30 text-primary px-4 py-1">SECURE CHECKOUT</Badge>
        <h1 className="text-4xl font-headline font-bold mb-2">Complete Your Purchase</h1>
        <p className="text-muted-foreground">You are purchasing a <span className="text-white font-bold">{size} {getDisplayName(plan)}</span> challenge for <span className="text-primary font-bold">{price}</span>.</p>
      </header>

      {/* Warning Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 p-6 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-start gap-4"
      >
        <AlertTriangle className="text-destructive w-8 h-8 flex-shrink-0" />
        <div>
          <h4 className="text-destructive font-bold text-lg mb-1">WARNING: NETWORK ACCURACY REQUIRED</h4>
          <p className="text-destructive/80 text-sm leading-relaxed font-medium">
            Send only to the correct network. Sending to the wrong network (e.g. USDT-ERC20 to a TRC20 address) will result in <span className="underline font-bold">PERMANENT LOSS</span> of funds. Always double-check both the address and the network before confirming your transfer.
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Payment Options */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {cryptoWallets.map((wallet) => (
              <Card key={wallet.network} className="bg-secondary/20 border-border/50 hover:border-primary/30 transition-all">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold">{wallet.network}</CardTitle>
                    <Badge className="bg-primary/10 text-primary border-primary/20">{wallet.token}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-3 rounded-xl flex justify-center w-fit mx-auto shadow-xl">
                    <QRCodeSVG value={wallet.address} size={140} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Wallet Address</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={wallet.address} className="bg-background/50 font-mono text-[10px] h-10 border-border" />
                      <Button variant="secondary" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => copyToClipboard(wallet.address)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Verification Form */}
        <div className="space-y-6">
          <Card className="bg-card border-primary/20 shadow-2xl sticky top-24">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="text-primary w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-headline">Verify Payment</CardTitle>
              <CardDescription>Submit your transaction details for instant approval.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-primary" /> Notification Email
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary/30 h-12 rounded-xl"
                  />
                  <p className="text-[10px] text-muted-foreground px-1">Credentials will be sent to this address.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="txHash" className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-primary" /> Transaction Hash (TXID)
                  </Label>
                  <Input 
                    id="txHash" 
                    placeholder="Paste your 64-character hash here..." 
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    required
                    className="bg-secondary/30 h-12 rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">1</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Admin verification usually takes 1-4 hours.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">2</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">MT5 credentials will be generated and sent via email.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-primary">3</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Access your trading terminal instantly upon approval.</p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 font-bold text-lg rounded-xl cyan-box-glow hover:scale-[1.02] transition-all" 
                  disabled={loading || !txHash || !email}
                >
                  {loading ? 'Processing...' : 'Submit for Verification'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Securing payment gateway...</p>
          </div>
        }>
          <PaymentContent />
        </Suspense>
      </main>
    </div>
  );
}