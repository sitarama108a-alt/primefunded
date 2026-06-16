"use client";

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Terminal, 
  Copy, 
  CheckCircle2, 
  Key, 
  Server, 
  User, 
  Eye, 
  EyeOff, 
  Download,
  AlertTriangle,
  Monitor,
  Smartphone,
  ShieldCheck,
  Clock,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

/**
 * @fileOverview Institutional MT5 Credentials Terminal.
 * 
 * Provides a secure, real-time interface for traders to access their 
 * MT5 login details. Hardened with defensive checks to prevent crashes 
 * during data hydration.
 */

export default function MT5AccountPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [pageHydrated, setPageHydrated] = useState(false);

  // Sync hydration state to prevent flicker
  useEffect(() => {
    if (!authLoading) {
      setPageHydrated(true);
    }
  }, [authLoading]);

  // Safe data extraction with institutional fallbacks
  const accountStatus = userData?.accountStatus || 'none';
  const mt5Login = userData?.mt5Login || null;
  const mt5Password = userData?.mt5Password || null;
  const mt5Server = userData?.mt5Server || 'PrimeFunded-Live';
  const accountSize = userData?.accountSize || 'Standard';
  const accountPlan = userData?.accountPlan || 'Challenge';

  const isActive = accountStatus === 'active' && mt5Login;
  const isBreached = accountStatus === 'breached';

  const copyToClipboard = (label: string, text: string | null) => {
    if (!text) {
      toast({ variant: "destructive", title: "Action Failed", description: "Credential not yet available." });
      return;
    }
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const copyTraderId = () => {
    const id = userData?.uid || userData?.traderId || 'PF-NODE';
    navigator.clipboard.writeText(id);
    toast({ title: "Copied!", description: "Trader UID copied to clipboard." });
  };

  // 1. Initial Auth Loading State
  if (authLoading || !pageHydrated) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
            <Loader2 className="w-12 h-12 animate-spin text-primary absolute top-0 left-0 [animation-delay:-0.5s]" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Terminal Node...</p>
        </div>
      </div>
    );
  }

  // 2. Error Fallback (If user is null but auth finished)
  if (!user) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6 text-center">
        <Card className="max-w-md border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h3 className="text-xl font-bold">Authentication Lost</h3>
            <p className="text-sm text-muted-foreground">We couldn't verify your session. Please try logging in again to access your credentials.</p>
            <Button className="w-full font-bold" onClick={() => window.location.href = '/login'}>Return to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {/* State A: Account Breached */}
        {isBreached ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
            <div className="w-24 h-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive animate-pulse">
              <XCircle className="w-12 h-12" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-headline font-bold text-white">Terminal Offline</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Your credentials have been revoked due to a hard rule violation. Access to the trading infrastructure is suspended.
              </p>
              <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 inline-flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <span className="text-sm font-bold text-white uppercase tracking-tight">Status: Breached</span>
              </div>
            </div>
            <Button variant="outline" className="font-bold rounded-xl border-border/50" asChild>
              <a href="/support">Appeal or Reset</a>
            </Button>
          </div>
        ) : !isActive ? (
          /* State B: Awaiting Activation */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
              <Clock className="w-12 h-12" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-headline font-bold text-white">Awaiting Activation</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our desk is currently processing your challenge. Your institutional credentials will appear here automatically once verified.
              </p>
              <div className="p-4 bg-secondary/30 rounded-xl border border-border inline-flex items-center gap-3 text-amber-500">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-bold text-white uppercase tracking-tight">Verification in Progress</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <DownloadBtn icon={<Monitor />} label="Windows" href="https://www.metatrader5.com/en/download" />
              <DownloadBtn icon={<Smartphone />} label="Mobile" href="https://www.metatrader5.com/en/download" />
            </div>
            <p className="text-xs text-muted-foreground italic flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin" /> Credentials will refresh instantly upon admin approval.
            </p>
          </div>
        ) : (
          /* State C: Active Credentials */
          <>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-xl bg-accent/20 border border-accent/30 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-[0_0_20px_rgba(17,179,245,0.4)]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">🎉 Institutional Node Active</h3>
                  <p className="text-sm text-muted-foreground">Your MT5 credentials are ready for use. Start trading now.</p>
                </div>
              </div>
              <Badge className="bg-accent text-accent-foreground font-black px-4 h-8 uppercase tracking-widest">LIVE DATA</Badge>
            </motion.div>

            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-3xl font-headline font-bold mb-1 text-white">Terminal Credentials</h1>
                <p className="text-muted-foreground">Secure access to your MetaTrader 5 trading infrastructure.</p>
              </div>
              <div 
                className="flex items-center gap-3 px-4 py-2 bg-secondary border border-primary/20 rounded-xl cursor-pointer hover:border-primary/50 transition-all group" 
                onClick={copyTraderId}
              >
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Trader UID</p>
                  <p className="font-mono text-sm font-bold text-white">{userData?.uid || userData?.traderId || '--------'}</p>
                </div>
                <Copy className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-primary/20 bg-card/40 backdrop-blur-sm overflow-hidden">
                  <div className="h-1 bg-primary shadow-[0_0_15px_rgba(17,179,245,0.5)]" />
                  <CardHeader className="flex flex-row items-center justify-between pb-6">
                    <div>
                      <CardTitle className="text-2xl font-headline font-bold text-white">
                        {accountSize} {accountPlan}
                      </CardTitle>
                      <CardDescription className="text-primary font-bold uppercase text-[10px] tracking-widest">Login: {mt5Login}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8 p-8 rounded-2xl bg-background/50 border border-white/5">
                      <div className="space-y-6">
                        <CredentialField 
                          icon={<User className="w-4 h-4" />} 
                          label="MT5 Login ID" 
                          value={mt5Login} 
                          onCopy={() => copyToClipboard("Login ID", mt5Login)} 
                        />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">
                            <Key className="w-3.5 h-3.5 text-primary" />
                            <span>Master Password</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xl font-bold flex-1 text-white tracking-tight">
                              {showPassword ? mt5Password : '••••••••••••'}
                            </span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={() => copyToClipboard("Password", mt5Password)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <CredentialField 
                          icon={<Server className="w-4 h-4" />} 
                          label="Trading Server" 
                          value={mt5Server} 
                          onCopy={() => copyToClipboard("Server", mt5Server)} 
                        />
                        <CredentialField 
                          icon={<Terminal className="w-4 h-4" />} 
                          label="Platform" 
                          value="MetaTrader 5 (MT5)" 
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                        <Download className="w-5 h-5 text-primary" /> Download Platform
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <DownloadBtn icon={<Monitor />} label="Windows" href="https://www.metatrader5.com/en/download" />
                        <DownloadBtn icon={<Monitor />} label="macOS" href="https://www.metatrader5.com/en/download" />
                        <DownloadBtn icon={<Smartphone />} label="Android" href="https://www.metatrader5.com/en/download" />
                        <DownloadBtn icon={<Smartphone />} label="iOS" href="https://www.metatrader5.com/en/download" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <ShieldCheck className="w-24 h-24 text-amber-500" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-amber-500 flex items-center gap-2 text-lg font-headline">
                      <AlertTriangle className="w-5 h-5" /> Safety Protocol
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RuleItem label="Max Daily Drawdown" value="3.0% - 5.0%" />
                    <RuleItem label="Max Total Drawdown" value="6.0% - 10.0%" />
                    <RuleItem label="Max Floating Loss" value="1.0%" />
                    <div className="pt-4 border-t border-amber-500/10">
                      <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-3">Restrictions</p>
                      <ul className="text-[11px] space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-destructive" /> No Martingale Strategy</li>
                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-destructive" /> No Signal Copying / EAs</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-accent" /> High-Impact News Trading OK</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-border bg-secondary/20">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Need help connecting? Contact our technical desk at <span className="text-primary font-bold">Supportprimefunded@gmail.com</span> for priority assistance.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function CredentialField({ icon, label, value, onCopy }: { icon: React.ReactNode, label: string, value: string | null, onCopy?: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-bold text-white tracking-tight">{value || 'Generating...'}</span>
        {onCopy && value && (
          <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 cursor-pointer" onClick={onCopy}>
            <Copy className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function DownloadBtn({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group cursor-pointer"
    >
      <div className="mb-2 text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white">{label}</span>
    </a>
  );
}

function RuleItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-xs font-bold">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
