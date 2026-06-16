
"use client";

import { useState, useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Loader2,
  RefreshCw,
  Skull,
  Wallet,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';

/**
 * @fileOverview Institutional MT5 Credentials Terminal.
 * Synchronized with AuthContext to show exact plan rules and credentials.
 */

export default function MT5AccountPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const mt5Login = userData?.mt5Login || null;
  const mt5Password = userData?.mt5Password || null;
  const mt5Server = userData?.mt5Server || 'MetaQuotes-Demo';
  const accountSize = userData?.accountSize || 'Standard';
  const accountPlan = userData?.accountPlan || 'Challenge';
  const accountStatus = userData?.accountStatus || 'none';
  const breachReason = userData?.breachReason || 'Rule Violation';
  const breachedAt = userData?.breachedAt;

  const isActive = useMemo(() => mt5Login && mt5Login !== "" && accountStatus === 'active', [mt5Login, accountStatus]);
  const isBreached = accountStatus === 'breached';

  // Helper to get exact plan rules
  const planRules = useMemo(() => {
    const plan = accountPlan?.toLowerCase() || '';
    if (plan.includes('1-step')) return { daily: '3.0%', max: '6.0%' };
    if (plan.includes('2-step')) return { daily: '5.0%', max: '10.0%' };
    if (plan.includes('3-step')) return { daily: '4.0%', max: '8.0%' };
    if (plan.includes('instant')) return { daily: '3.0%', max: '4.0%' };
    return { daily: '3.0%', max: '6.0%' };
  }, [accountPlan]);

  const liveMetrics = useMemo(() => {
    const parseSize = (sizeStr: string) => {
      if (!sizeStr) return 0;
      return parseFloat(sizeStr.replace(/[$,]/g, '').replace(/k/i, '000')) || 0;
    };

    const staticBalance = userData?.accountBalance || parseSize(userData?.accountSize);
    const balance = userData?.liveBalance !== undefined ? userData.liveBalance : staticBalance;
    const equity = userData?.liveEquity !== undefined ? userData.liveEquity : balance;
    
    return { balance, equity };
  }, [userData]);

  const copyToClipboard = (label: string, text: string | null) => {
    if (!text) {
      toast({ variant: "destructive", title: "Action Failed", description: "Credential not available." });
      return;
    }
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Node...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {isBreached ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8"
          >
            <div className="w-24 h-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive animate-pulse">
              <Skull className="w-12 h-12" />
            </div>
            <div className="space-y-4">
              <Badge variant="destructive" className="px-4 py-1 uppercase tracking-widest font-black text-xs">Terminal Access Revoked</Badge>
              <h1 className="text-4xl font-headline font-bold text-white">Account Breached</h1>
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-6">
                  <p className="text-destructive font-bold uppercase text-[10px] tracking-widest mb-2">Termination Reason</p>
                  <p className="text-white text-lg font-medium leading-relaxed">{breachReason}</p>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Terminated on: {breachedAt?.seconds ? new Date(breachedAt.seconds * 1000).toLocaleString() : 'Recent'}</span>
                  </div>
                </CardContent>
              </Card>
              <p className="text-muted-foreground">This account has violated institutional risk protocols and is no longer valid for trading. All credentials have been liquidated.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button size="lg" className="font-bold h-14 px-10 rounded-2xl bg-destructive hover:bg-destructive/90" asChild>
                <Link href="/support">Contact Compliance Desk</Link>
              </Button>
              <Button variant="outline" size="lg" className="font-bold h-14 px-10 rounded-2xl border-white/10" asChild>
                <Link href="/challenges">Start New Challenge</Link>
              </Button>
            </div>
          </motion.div>
        ) : !isActive ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse"><Clock className="w-12 h-12" /></div>
            <div className="space-y-4">
              <h1 className="text-4xl font-headline font-bold text-white">Awaiting Activation</h1>
              <p className="text-muted-foreground text-lg">Our desk is provisioning your institutional node. Credentials will appear here instantly once verified.</p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-xl border border-border inline-flex items-center gap-3 text-amber-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-bold uppercase tracking-tight">Listening for Credentials...</span>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-8 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-black"><CheckCircle2 className="w-6 h-6" /></div>
                <div><h3 className="font-bold text-white text-lg">🎉 Institutional Node Active</h3><p className="text-sm text-muted-foreground">MT5 Credentials successfully provisioned.</p></div>
              </div>
              <Badge className="bg-emerald-500 text-black font-bold">LIVE</Badge>
            </div>

            <header className="mb-10">
              <h1 className="text-3xl font-headline font-bold text-white">Trading Credentials</h1>
              <p className="text-muted-foreground">{accountSize} {accountPlan} Plan</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-primary/20 bg-card/40 backdrop-blur-sm overflow-hidden">
                <div className="h-1 bg-primary" />
                <CardContent className="p-8 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8 p-8 rounded-2xl bg-background/50 border border-white/5">
                    <div className="space-y-6">
                      <CredentialField icon={<User className="w-4 h-4" />} label="MT5 Login ID" value={mt5Login} onCopy={() => copyToClipboard("Login ID", mt5Login)} />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground"><Key className="w-3.5 h-3.5 text-primary" /><span>Master Password</span></div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xl font-bold flex-1 text-white">{showPassword ? mt5Password : '••••••••••••'}</span>
                          <Button variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                          <Button variant="ghost" size="icon" onClick={() => copyToClipboard("Password", mt5Password)}><Copy className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <CredentialField icon={<Server className="w-4 h-4" />} label="Trading Server" value={mt5Server} onCopy={() => copyToClipboard("Server", mt5Server)} />
                      <CredentialField icon={<Terminal className="w-4 h-4" />} label="Platform" value="MetaTrader 5 (MT5)" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-6 bg-secondary/20 rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg"><Wallet className="w-4 h-4 text-primary" /></div>
                      <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Live Balance</p><p className="font-bold text-white text-lg">${liveMetrics.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent/10 rounded-lg"><Activity className="w-4 h-4 text-accent" /></div>
                      <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Live Equity</p><p className="font-bold text-white text-lg">${liveMetrics.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2"><Download className="w-5 h-5 text-primary" /> Get MT5 Platform</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <DownloadBtn icon={<Monitor />} label="Windows" href="https://www.metatrader5.com/en/download" />
                      <DownloadBtn icon={<Monitor />} label="macOS" href="https://www.metatrader5.com/en/download" />
                      <DownloadBtn icon={<Smartphone />} label="Android" href="https://www.metatrader5.com/en/download" />
                      <DownloadBtn icon={<Smartphone />} label="iOS" href="https://www.metatrader5.com/en/download" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-500/30 bg-amber-500/5 h-fit">
                <CardHeader><CardTitle className="text-amber-500 flex items-center gap-2 text-lg"><ShieldCheck className="w-5 h-5" /> Active Guard</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <RuleItem label="Daily Drawdown" value={planRules.daily} />
                  <RuleItem label="Max Drawdown" value={planRules.max} />
                  <div className="pt-4 border-t border-white/5 text-xs text-muted-foreground italic">Institutional risk monitoring is active on this account.</div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function CredentialField({ icon, label, value, onCopy }: { icon: React.ReactNode, label: string, value: string | null, onCopy?: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground"><span className="text-primary">{icon}</span><span>{label}</span></div>
      <div className="flex items-center justify-between"><span className="font-mono text-lg font-bold text-white">{value || '---'}</span>{onCopy && <Button variant="ghost" size="icon" onClick={onCopy}><Copy className="w-4 h-4" /></Button>}</div>
    </div>
  );
}

function DownloadBtn({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-white group"><div className="mb-2 text-muted-foreground group-hover:text-primary">{icon}</div><span className="text-[10px] font-black uppercase tracking-widest">{label}</span></a>
  );
}

function RuleItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-xs font-bold"><span className="text-muted-foreground">{label}</span><span className="text-white">{value}</span></div>
  );
}
