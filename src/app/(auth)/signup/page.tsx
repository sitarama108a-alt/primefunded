
"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

function SignupContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const referralCodeFromUrl = searchParams.get('ref');

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'PRIME-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateTraderId = () => {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const traderId = generateTraderId();
      const referralCode = generateReferralCode();

      // Find referring user UID if ref code exists
      let referredByUid = null;
      if (referralCodeFromUrl) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('referralCode', '==', referralCodeFromUrl));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          referredByUid = querySnapshot.docs[0].id;
        }
      }

      const userData = {
        uid: user.uid,
        traderId,
        referralCode,
        referredBy: referredByUid,
        referralCount: 0,
        referralEarnings: 0,
        name,
        email,
        phone,
        country,
        tier: 'Bronze',
        joinDate: new Date().toISOString(),
        balance: 0,
        equity: 0,
        status: 'active',
        kycVerified: false,
        createdAt: serverTimestamp()
      };

      const userRef = doc(db, `users`, user.uid);
      await setDoc(userRef, userData)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: userData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center p-20 bg-secondary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <TrendingUp className="text-primary w-10 h-10" />
            <span className="font-headline font-bold text-3xl tracking-tight text-white">PrimeFunded</span>
          </div>
          <h1 className="text-5xl font-headline font-bold mb-8 leading-tight">Start Your <br />Funding Journey.</h1>
          <div className="space-y-6">
            <FeatureItem text="Up to $200k in institutional capital" />
            <FeatureItem text="No hidden rules or time limits" />
            <FeatureItem text="Fast payouts and bi-weekly withdrawals" />
            <FeatureItem text="80% Profit Split" />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-headline font-bold">Create Account</h2>
            <p className="text-muted-foreground mt-2">Join the world's most transparent funding firm</p>
            {referralCodeFromUrl && (
              <p className="text-xs text-primary font-bold mt-2 uppercase tracking-widest">
                Referral Code Active: {referralCodeFromUrl}
              </p>
            )}
          </div>
          
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="trader@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-secondary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input 
                  id="phone" 
                  placeholder="+1 555..." 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="h-11 bg-secondary/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  placeholder="United Kingdom" 
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="h-11 bg-secondary/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-secondary/50"
              />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input type="checkbox" id="terms" className="rounded border-border bg-secondary" required />
              <label htmlFor="terms" className="text-[10px] text-muted-foreground">
                I agree to the <Link href="#" className="text-primary underline">Terms of Service</Link> and <Link href="#" className="text-primary underline">Risk Disclosure</Link>.
              </label>
            </div>
            <Button type="submit" className="w-full h-12 font-bold text-lg" disabled={loading}>
              {loading ? 'Creating Account...' : 'Get Started'}
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
        <CheckCircle2 className="text-primary w-4 h-4" />
      </div>
      <span className="text-lg text-foreground font-medium">{text}</span>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
