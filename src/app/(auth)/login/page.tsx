
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, ArrowRight, Loader2, Mail, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ 
        variant: "destructive", 
        title: "Email Required", 
        description: "Please enter your email to receive a recovery link." 
      });
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Reset Link Sent",
        description: "Password reset email sent! Check your inbox for instructions.",
      });
      setView('login');
    } catch (error: any) {
      const message = error.code === 'auth/user-not-found' 
        ? "No account found with this email." 
        : error.message;
      
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: message,
      });
    } finally {
      setResetLoading(false);
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
          <h1 className="text-5xl font-headline font-bold mb-6 leading-tight text-white">
            {view === 'login' ? "Welcome Back, \nTrader." : "Recover Your \nAccount."}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {view === 'login' 
              ? "The markets are moving. Log in to your dashboard to monitor your challenges and performance."
              : "Enter your email address and we'll send you a link to reset your password securely."}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col justify-center items-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-headline font-bold text-white">
              {view === 'login' ? 'Sign In' : 'Forgot Password'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {view === 'login' 
                ? 'Enter your credentials to access your account' 
                : 'Enter your email to receive a recovery link'}
            </p>
          </div>
          
          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="trader@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 text-white"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button 
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-xs text-primary font-bold hover:underline uppercase tracking-widest"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 bg-secondary/50 border-border/50 focus:border-primary/50 text-white"
                />
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-lg cyan-box-glow" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="trader@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 pl-12 bg-secondary/50 border-border/50 focus:border-primary/50 text-white"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <Button type="submit" className="w-full h-12 font-bold text-lg cyan-box-glow" disabled={resetLoading}>
                  {resetLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {resetLoading ? 'Sending...' : 'Send Recovery Link'}
                </Button>
                <button 
                  type="button" 
                  onClick={() => setView('login')}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary uppercase tracking-[0.2em] transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" /> Back to Login
                </button>
              </div>
            </form>
          )}
          
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account? <Link href="/signup" className="text-primary font-semibold hover:underline">Join PrimeFunded</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
