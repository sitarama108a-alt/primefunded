"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Copy, CheckCircle2, AlertTriangle, QrCode, Wallet, Mail, Hash, Loader2, Globe } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { sanitizeInput } from '@/lib/utils';
import { z } from 'zod';

const PaymentSchema = z.object({
  email: z.string().email("Invalid email format"),
  txHash: z.string().min(10, "Transaction hash is too short").max(100, "Transaction hash is too long"),
  network: z.string().min(1, "Please select a network"),
});

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
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const plan = searchParams.get('plan') || '1-step';
  const size = searchParams.get('size') || '$100k';
  const price = searchParams.get('price') || '$499';
  
  const [txHash, setTxHash] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  const getDisplayName = (id: string) => {
    if (id === '1-step') return '1-Step Pro';
    if (id === '2-step') return '2-Step Classic';
    if (id === '3-step') return '3-Step Classic';
    return 'Instant Funding';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to purchase a challenge." });
      return;
    }

    // Validation
    const validation = PaymentSchema.safeParse({ email, txHash, network: selectedNetwork });
    if (!validation.success) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validation.error.errors[0].message,
      });
      return;
    }
    
    setLoading(true);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedHash = sanitizeInput(txHash);

    const orderData = {
      userId: user.uid,
      email: sanitizedEmail,
      plan: getDisplayName(plan),
      size,
      price,
      txHash: sanitizedHash,
      network: selectedNetwork,
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
        <h2 className="text-4xl font-headline font-bold mb-4 text-white">Verification Pending</h2>
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          Thank you! We&apos;ve received your transaction details. Our compliance team will verify your payment within 1-4 hours. 
          Your MT5 credentials will be emailed to <span className="text-primary font-bold">{email}</span> as soon as verification is complete.
        </p>
        <div className="flex gap-4">
          <Button size="lg" className="h-14 px-8 rounded-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" size="lg" className="h-14 px-8 rounded-xl font-bold cursor-pointer" onClick={() => router.push('/accounts')}>
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
        <h1 className="text-4xl font-headline font-bold mb-2 text-white">Complete Your Purchase</h1>
        <p className="text-muted-foreground">You are purchasing a <span className="text-white font-bold">{size} {getDisplayName(plan)}</span> challenge for <span className="text-primary font-bold">{price}</span>.</p>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 p-6 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-start gap-4"
      >
        <AlertTriangle className="text-destructive w-8 h-8 flex-shrink-0" />
        <div>
          <h4 className="text-destructive font-bold text-lg mb-1">WARNING: NETWORK ACCURACY REQUIRED</h4>
          <p className="text-destructive/80 text-sm leading-relaxed font-medium">
            Send only to the correct network. Sending to the wrong network will result in <span className="underline font-bold">PERMANENT LOSS</span> of funds.
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {cryptoWallets.map((wallet) => (
              <Card key={wallet.network} className="bg-secondary/20 border-border/50 hover:border-primary/30 transition-all">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold text-white">{wallet.network}</CardTitle>
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
                      <Input readOnly value={wallet.address} className="bg-background/50 font-mono text-[10px] h-10 border-border text-white" />
                      <Button variant="secondary" size="icon" className="h-10 w-10 flex-shrink-0 cursor-pointer" onClick={() => copyToClipboard(wallet.address)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-primary/20 shadow-2xl sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl font-headline text-white">Verify Payment</CardTitle>
              <CardDescription>Submit your transaction details for approval.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-white">
                    <Globe className="w-3 h-3 text-primary" /> Select Network
                  </Label>
                  <Select value={selectedNetwork} onValueChange={setSelectedNetwork} required>
                    <SelectTrigger className="bg-secondary/30 h-12 rounded-xl text-white">
                      <SelectValue placeholder="Choose payment network" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ethereum">Ethereum (ERC20)</SelectItem>
                      <SelectItem value="Tron (TRC20)">Tron (TRC20)</SelectItem>
                      <SelectItem value="BNB Smart Chain">BNB Smart Chain (BEP20)</SelectItem>
                      <SelectItem value="Polygon">Polygon (MATIC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-white">
                    <Mail className="w-3 h-3 text-primary" /> Notification Email
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary/30 h-12 rounded-xl text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="txHash" className="flex items-center gap-2 text-white">
                    <Hash className="w-3 h-3 text-primary" /> Transaction Hash (TXID)
                  </Label>
                  <Input 
                    id="txHash" 
                    placeholder="Paste TXID here..." 
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    required
                    className="bg-secondary/30 h-12 rounded-xl font-mono text-xs text-white"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 font-bold text-lg rounded-xl cyan-box-glow cursor-pointer" 
                  disabled={loading || !txHash || !email || !selectedNetwork}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
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
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>}>
          <PaymentContent />
        </Suspense>
      </main>
    </div>
  );
}
