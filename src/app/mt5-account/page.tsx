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
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * @fileOverview Institutional MT5 Credentials Terminal.
 * Provides a real-time, high-availability interface for account activation.
 */

export default function MT5AccountPage() {
  const { user, userData: initialUserData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Real-time listener for the specific user document
  useEffect(() => {
    if (!user?.uid) return;

    console.log(`[MT5-Terminal] Attaching real-time listener for UID: ${user.uid}`);
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        console.log(`[MT5-Terminal] Live Sync Received: Login=${data.mt5Login || 'PENDING'}`);
        setLiveData(data);
      }
      setLoading(false);
    }, (error) => {
      console.error('[MT5-Terminal] Sync Error:', error);
      setLoading(false);
    });

    return () => unsub();
  }, [user?.uid]);

  const userData = liveData || initialUserData;
  const mt5Login = userData?.mt5Login || null;
  const mt5Password = userData?.mt5Password || null;
  const mt5Server = userData?.mt5Server || 'PrimeFunded-Live';
  const accountSize = userData?.accountSize || 'Standard';
  const accountPlan = userData?.accountPlan || 'Challenge';
  const accountStatus = userData?.accountStatus || 'none';

  const isActive = mt5Login && mt5Login !== "" && accountStatus === 'active';
  const isBreached = accountStatus === 'breached';

  const copyToClipboard = (label: string, text: string | null) => {
    if (!text) {
      toast({ variant: "destructive", title: "Action Failed", description: "Credential not available." });
      return;
    }
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Synchronizing Node...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center p-6 text-center">
        <Card className="max-w-md border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h3 className="text-xl font-bold">Authentication Lost</h3>
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
        {isBreached ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
            <div className="w-24 h-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive"><XCircle className="w-12 h-12" /></div>
            <div className="space-y-4">
              <h1 className="text-4xl font-headline font-bold text-white">Terminal Revoked</h1>
              <p className="text-muted-foreground text-lg">Your account has been terminated due to a hard rule breach.</p>
            </div>
            <Button variant="outline" className="font-bold h-12 px-8 rounded-xl" asChild><a href="/support">Appeal Decision</a></Button>
          </div>
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
                  <RuleItem label="Daily Drawdown" value="3.0% - 5.0%" />
                  <RuleItem label="Max Drawdown" value="6.0% - 10.0%" />
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