
"use client";

import { useState, useMemo } from 'react';
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
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function MT5AccountPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const isActive = userData?.accountStatus === 'active' && userData?.mt5Login;

  const copyToClipboard = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const copyTraderId = () => {
    if (userData?.uid) {
      navigator.clipboard.writeText(userData.uid);
      toast({ title: "Copied!", description: "Trader UID copied to clipboard." });
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {!isActive ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
              <Clock className="w-12 h-12" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-headline font-bold text-white">Awaiting Activation</h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Your account is currently under review by our compliance team. Once your payment is verified, your institutional credentials will appear here instantly.
              </p>
              <div className="p-4 bg-secondary/30 rounded-xl border border-border inline-flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-bold text-white uppercase tracking-tight">ETA: 1-4 Hours</span>
              </div>
            </div>
            <Button variant="outline" className="font-bold rounded-xl border-border/50" asChild>
              <a href="/support">Need Help?</a>
            </Button>
          </div>
        ) : (
          <>
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-xl bg-accent/20 border border-accent/30 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-[0_0_20px_rgba(17,179,245,0.4)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">🎉 Account Fully Active</h3>
                <p className="text-sm text-muted-foreground">Your credentials have been provisioned. Welcome to the desk.</p>
              </div>
            </motion.div>

            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-3xl font-headline font-bold mb-1 text-white">Institutional Terminal</h1>
                <p className="text-muted-foreground">Secure access to your MetaTrader 5 trading infrastructure.</p>
              </div>
              <div 
                className="flex items-center gap-3 px-4 py-2 bg-secondary border border-primary/20 rounded-xl cursor-pointer hover:border-primary/50 transition-all group" 
                onClick={copyTraderId}
              >
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Trader UID</p>
                  <p className="font-mono text-sm font-bold text-white">{userData?.uid || '--------'}</p>
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
                        {userData.accountSize} {userData.accountPlan}
                      </CardTitle>
                      <CardDescription className="text-primary font-bold uppercase text-[10px] tracking-widest">Login: {userData.mt5Login}</CardDescription>
                    </div>
                    <Badge className="bg-accent text-accent-foreground font-black px-4 py-1.5 shadow-[0_0_15px_rgba(17,179,245,0.2)]">ACTIVE</Badge>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-8 p-8 rounded-2xl bg-background/50 border border-white/5">
                      <div className="space-y-6">
                        <CredentialField 
                          icon={<User className="w-4 h-4" />} 
                          label="Login ID" 
                          value={userData.mt5Login} 
                          onCopy={() => copyToClipboard("Login ID", userData.mt5Login)} 
                        />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">
                            <Key className="w-3.5 h-3.5 text-primary" />
                            <span>Master Password</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xl font-bold flex-1 text-white tracking-tight">
                              {showPassword ? userData.mt5Password : '••••••••••••'}
                            </span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={() => copyToClipboard("Password", userData.mt5Password)}>
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
                          value={userData.mt5Server} 
                          onCopy={() => copyToClipboard("Server", userData.mt5Server)} 
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

                <Card className="bg-secondary/20 border-border/50">
                  <CardHeader><CardTitle className="text-lg text-white">Connection Protocol</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      "Install MetaTrader 5 on your preferred device.",
                      "Go to 'File' → 'Login to Trade Account'.",
                      "Select 'PrimeFunded-Live' (or manually type server name).",
                      "Paste your Credentials from above. Ensure no spaces are included.",
                      "Once connected, the status icon (bottom right) will turn green."
                    ].map((step, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black border border-primary/20 shrink-0 group-hover:scale-110 transition-transform">
                          {i + 1}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed pt-1">{step}</p>
                      </div>
                    ))}
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
                      <AlertTriangle className="w-5 h-5" /> Rules Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <RuleItem label="Plan Stage" value="Funded (Phase 3)" />
                    <RuleItem label="Daily Drawdown" value="3% Max" />
                    <RuleItem label="Total Drawdown" value="6% Max" />
                    <RuleItem label="Floating Loss Rule" value="1% Threshold" />
                    
                    <div className="pt-4 border-t border-amber-500/10 space-y-3">
                      <p className="text-[10px] uppercase font-black text-amber-500 tracking-widest">Restricted Activity</p>
                      <ul className="text-xs text-muted-foreground space-y-2.5">
                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-destructive" /> No Martingale Strategies</li>
                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-destructive" /> No Signal Copying</li>
                        <li className="flex items-center gap-2"><XCircle className="w-3 h-3 text-destructive" /> Hold Trades {'>'} 2 Minutes</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader><CardTitle className="text-lg text-white">Desk Support</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Facing connection issues or server timeout? Our desk specialists are available 24/7 to assist with credential resets or routing updates.
                    </p>
                    <Button variant="outline" className="w-full h-11 font-bold border-primary/30 text-primary hover:bg-primary/10" asChild>
                      <a href="/support">Open Support Desk</a>
                    </Button>
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

function CredentialField({ icon, label, value, onCopy }: { icon: React.ReactNode, label: string, value: string, onCopy?: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] uppercase font-black text-muted-foreground tracking-[0.2em]">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-bold text-white tracking-tight">{value}</span>
        {onCopy && (
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
