"use client";

import { useState, useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Terminal, 
  Copy, 
  ExternalLink, 
  CheckCircle2, 
  Key, 
  Server, 
  User, 
  Eye, 
  EyeOff, 
  Download,
  AlertTriangle,
  Monitor,
  Smartphone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function MT5AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [showPassword] = useState(false);

  // Memoize the query for the user's active accounts
  const accountsQuery = useMemo(() => {
    if (!user) return null;
    return query(
      collection(db, 'accounts'),
      where('userId', '==', user.uid),
      where('status', '==', 'active')
    );
  }, [db, user]);

  const { data: accounts, loading: accountsLoading } = useCollection<any>('accounts', accountsQuery ? [where('userId', '==', user?.uid || ''), where('status', '==', 'active')] : []);

  const activeAccount = accounts?.[0];

  const copyToClipboard = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const getPlanRules = (plan: string) => {
    const p = plan.toLowerCase();
    if (p.includes('1-step')) {
      return { profit: '10%', daily: '3%', max: '6%', days: '5' };
    } else if (p.includes('2-step')) {
      return { profit: '8% (Phase 1)', daily: '5%', max: '10%', days: '5' };
    } else {
      return { profit: 'N/A (Instant)', daily: '2%', max: '4%', days: 'None' };
    }
  };

  if (authLoading || accountsLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeAccount) {
    return (
      <div className="flex min-h-screen bg-background">
        <Navigation />
        <main className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-headline font-bold mb-2">No Active Account Found</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            You don't have any verified trading accounts yet. Complete a challenge purchase and wait for admin verification.
          </p>
          <Button asChild>
            <a href="/challenges">Browse Challenges</a>
          </Button>
        </main>
      </div>
    );
  }

  const rules = getPlanRules(activeAccount.plan);

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Success Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-accent/20 border border-accent/30 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">🎉 Your Account is Ready!</h3>
            <p className="text-sm text-muted-foreground">Your credentials have been generated. Start trading now.</p>
          </div>
        </motion.div>

        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">MT5 Credentials</h1>
          <p className="text-muted-foreground">Access details for your MetaTrader 5 trading terminal.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* My Account Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-headline font-bold">
                    {activeAccount.size} {activeAccount.plan}
                  </CardTitle>
                  <CardDescription>Account ID: PF-{activeAccount.mt5Login}</CardDescription>
                </div>
                <Badge className="bg-accent text-accent-foreground font-bold px-3 py-1">ACTIVE</Badge>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Credentials Box */}
                <div className="grid md:grid-cols-2 gap-6 p-6 rounded-2xl bg-secondary/50 border border-white/10 mb-8">
                  <div className="space-y-4">
                    <CredentialField 
                      icon={<User className="w-4 h-4" />} 
                      label="Login" 
                      value={activeAccount.mt5Login} 
                      onCopy={() => copyToClipboard("Login ID", activeAccount.mt5Login)} 
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                        <Key className="w-3.5 h-3.5 text-primary" />
                        <span>Master Password</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold flex-1">
                          {activeAccount.mt5Password}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => copyToClipboard("Password", activeAccount.mt5Password)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <CredentialField 
                      icon={<Server className="w-4 h-4" />} 
                      label="Trading Server" 
                      value={activeAccount.mt5Server} 
                      onCopy={() => copyToClipboard("Server", activeAccount.mt5Server)} 
                    />
                    <CredentialField 
                      icon={<Terminal className="w-4 h-4" />} 
                      label="Platform" 
                      value="MetaTrader 5" 
                    />
                  </div>
                </div>

                {/* Download MT5 Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Download className="w-5 h-5 text-primary" /> Download MetaTrader 5
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

            {/* Setup Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    "Download and install MetaTrader 5 from the link above.",
                    "Open MT5 and click 'File' → 'Open an Account'.",
                    "Search for server 'PrimeFunded-Demo' and select it.",
                    "Choose 'Existing Account' and enter your Login and Password above.",
                    "Click 'Finish' - your account balance should now appear.",
                    "Start trading according to your challenge rules."
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rules Reminder Sidebar */}
          <div className="space-y-6">
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-amber-500 flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5" /> Rules Reminder
                </CardTitle>
                <CardDescription className="text-amber-500/70">
                  Stay compliant to pass your challenge.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RuleMetric label="Profit Target" value={rules.profit} />
                <RuleMetric label="Daily Loss Limit" value={rules.daily} />
                <RuleMetric label="Max Overall Loss" value={rules.max} />
                <RuleMetric label="Min Trading Days" value={rules.days} />
                
                <div className="pt-4 border-t border-amber-500/20 mt-4">
                  <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest mb-2">Prohibited</p>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li>• No News Trading (±5 mins)</li>
                    <li>• No Overnight Weekend Holding</li>
                    <li>• No Martingale/Arbitrage</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Assistance?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you have trouble logging in, please contact our 24/7 support team via live chat or the support portal.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/support">Open Support Ticket</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function CredentialField({ icon, label, value, onCopy }: { icon: React.ReactNode, label: string, value: string, onCopy?: () => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-bold">{value}</span>
        {onCopy && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={onCopy}>
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
      className="flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group"
    >
      <div className="mb-2 text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </a>
  );
}

function RuleMetric({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-amber-500">{value}</span>
    </div>
  );
}
