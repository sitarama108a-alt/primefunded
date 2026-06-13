"use client";

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDocs, collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn, sanitizeInput } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { z } from 'zod';

const SignupSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100, "Name must be under 100 characters"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(5, "Phone number is too short").max(20, "Phone number is too long"),
  country: z.string().min(2, "Country is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function SignupContent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [referralInput, setReferralInput] = useState('');
  const [referralStatus, setReferralStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user: existingUser, loading: authLoading } = useAuth();

  const referralCodeFromUrl = searchParams.get('ref');
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (existingUser && !authLoading) {
      router.push(redirectTo);
    }
  }, [existingUser, authLoading, router, redirectTo]);

  useEffect(() => {
    if (referralCodeFromUrl) {
      setReferralInput(referralCodeFromUrl.toUpperCase());
      validateCode(referralCodeFromUrl.toUpperCase());
    }
  }, [referralCodeFromUrl]);

  useEffect(() => {
    if (!referralInput || referralInput === referralCodeFromUrl?.toUpperCase()) return;
    
    const timeout = setTimeout(() => {
      validateCode(referralInput);
    }, 500);

    return () => clearTimeout(timeout);
  }, [referralInput]);

  const validateCode = async (code: string) => {
    if (!code || code.length < 4) {
      setReferralStatus('idle');
      return;
    }
    setReferralStatus('validating');
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setReferralStatus('valid');
      } else {
        setReferralStatus('invalid');
      }
    } catch (err) {
      setReferralStatus('invalid');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const validation = SignupSchema.safeParse({ name, email, phone, country, password });
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
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = sanitizeInput(phone);
    const sanitizedCountry = sanitizeInput(country);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
      const user = userCredential.user;
      
      const traderId = Math.floor(10000000 + Math.random() * 90000000).toString();
      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

      let referredByUid = null;
      if (referralStatus === 'valid' && referralInput) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('referralCode', '==', referralInput.toUpperCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          referredByUid = querySnapshot.docs[0].id;
        }
      }

      const userData = {
        uid: user.uid,
        traderId,
        referralCode,
        codeChangesCount: 0,
        referredBy: referredByUid,
        referralCount: 0,
        referralEarnings: 0,
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        country: sanitizedCountry,
        tier: 'Bronze',
        joinDate: new Date().toISOString(),
        balance: 0,
        equity: 0,
        status: 'active',
        kycVerified: false,
        kycStatus: 'none',
        createdAt: serverTimestamp()
      };

      const userRef = doc(db, `users`, user.uid);
      setDoc(userRef, userData)
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: userData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });

      const codeRegRef = doc(db, 'referralCodes', referralCode);
      setDoc(codeRegRef, {
        code: referralCode,
        userId: user.uid,
        active: true,
        createdAt: serverTimestamp()
      });

      router.push(redirectTo);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.code === 'auth/email-already-in-use' ? "This email is already registered." : error.message,
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
            <h2 className="text-3xl font-headline font-bold text-white">Create Account</h2>
            <p className="text-muted-foreground mt-2">Join the world's most transparent funding firm</p>
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
                className="h-11 bg-secondary/50 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="trader@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-secondary/50 text-white"
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
                  className="h-11 bg-secondary/50 text-white"
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
                  className="h-11 bg-secondary/50 text-white"
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
                className="h-11 bg-secondary/50 text-white"
              />
              <p className="text-[10px] text-muted-foreground">Min. 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral" className="flex items-center gap-2">
                Referral Code (Optional)
                {referralStatus === 'validating' && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                {referralStatus === 'valid' && <CheckCircle2 className="w-3 h-3 text-accent" />}
                {referralStatus === 'invalid' && <XCircle className="w-3 h-3 text-destructive" />}
              </Label>
              <Input 
                id="referral" 
                placeholder="e.g. LAVANYA" 
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                readOnly={!!referralCodeFromUrl}
                className={cn(
                  "h-11 bg-secondary/50 transition-all uppercase font-mono text-xs text-white",
                  referralStatus === 'valid' && "border-accent/50",
                  referralStatus === 'invalid' && "border-destructive/50"
                )}
              />
            </div>

            <Button type="submit" className="w-full h-12 font-bold text-lg cyan-box-glow" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              {loading ? 'Creating Account...' : 'Get Started'}
            </Button>
          </form>
          
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link href={redirectTo !== '/dashboard' ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'} className="text-primary font-semibold hover:underline">Sign In</Link>
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
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-white">Loading Terminal...</div>}>
      <SignupContent />
    </Suspense>
  );
}
