"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Server,
  ShieldCheck,
  CheckCircle2,
  Clock,
  BarChart3,
  User,
  Copy,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { aiComplianceMonitorAlerts } from '@/ai/flows/ai-compliance-monitor-alerts';
import { useFirestore, useCollection } from '@/firebase';
import { where, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const [isConnected, setIsConnected] = useState(true);
  const [compliance, setCompliance] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  // Profile completion state
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [completingPhone, setCompletingPhone] = useState('');
  const [completingCountry, setCompletingCountry] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (userData && (!userData.phone || !userData.country)) {
      setShowProfilePrompt(true);
    } else {
      setShowProfilePrompt(false);
    }
  }, [userData]);

  const handleCompleteProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        phone: completingPhone,
        country: completingCountry
      });
      toast({ title: "Profile Completed", description: "Thank you for updating your information." });
      setShowProfilePrompt(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  const accountConstraints = useMemo(() => {
    if (!user?.uid) return [];
    return [where('userId', '==', user.uid), where('status', '==', 'active')];
  }, [user?.uid]);

  const { data: accounts, loading: accountsLoading } = useCollection<any>(
    user ? 'accounts' : null, 
    accountConstraints
  );

  const activeAccount = accounts?.[0];

  useEffect(() => {
    if (activeAccount) {
      let isMounted = true;
      const fetchCompliance = async () => {
        try {
          const result = await aiComplianceMonitorAlerts({
            plan: activeAccount.plan as any || "1-Step Pro",
            dailyLoss: 0,
            totalLoss: 0,
            profit: 0,
            tradingDays: 0,
            hasOpenTrades: false
          });
          if (isMounted) setCompliance(result);
        } catch (err) {
          // Centrally handled
        }
      };
      fetchCompliance();
      return () => { isMounted = false; };
    }
  }, [activeAccount?.id, activeAccount?.plan]);

  const metrics = useMemo(() => {
    if (!activeAccount) {
      return {
        balance: 0,
        equity: 0,
        dailyPnL: 0,
        winRate: 0,
        tradesToday: 0,
        profitTarget: 0,
        currentProfitPercent: 0
      };
    }

    const balance = activeAccount?.balance || 0;
    return {
      balance,
      equity: balance * 1.02, 
      dailyPnL: 0,
      winRate: 0,
      tradesToday: 0,
      profitTarget: activeAccount?.plan?.includes('1-Step') ? 10 : activeAccount?.plan?.includes('2-Step') ? 8 : 0,
      currentProfitPercent: 0
    };
  }, [activeAccount]);

  const copyTraderId = () => {
    if (userData?.traderId) {
      navigator.clipboard.writeText(userData.traderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Trader UID copied to clipboard." });
    }
  };

  if (authLoading || accountsLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      
      <main className="flex-1 p-8 overflow-y-auto">
        {showProfilePrompt && (
          <div className="mb-8 p-6 rounded-2xl bg-primary/10 border border-primary/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_20px_rgba(17,179,245,0.1)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground">Please provide your contact details to enable full dashboard features.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none">
                <Input 
                  placeholder="Phone Number" 
                  value={completingPhone} 
                  onChange={(e) => setCompletingPhone(e.target.value)}
                  className="bg-background/50 border-primary/20 h-10 min-w-[150px]"
                />
              </div>
              <div className="flex-1 md:flex-none">
                <Input 
                  placeholder="Country" 
                  value={completingCountry} 
                  onChange={(e) => setCompletingCountry(e.target.value)}
                  className="bg-background/50 border-primary/20 h-10 min-w-[150px]"
                />
              </div>
              <Button onClick={handleCompleteProfile} disabled={savingProfile || !completingPhone || !completingCountry} className="font-bold h-10 px-6">
                Save & Continue
              </Button>
            </div>
          </div>
        )}

        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1">Trader Terminal</h1>
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">Welcome back, {userData?.name || 'Trader'}.</p>
              
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="flex items-center gap-2 px-3 py-1 bg-secondary border border-primary/20 rounded-lg group hover:border-primary/50 transition-colors cursor-pointer" 
                  onClick={copyTraderId}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">UID:</span>
                  <span className="font-mono text-sm font-bold text-white">{userData?.traderId || '--------'}</span>
                  <button className="text-muted-foreground group-hover:text-primary transition-colors">
                    {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent live-indicator' : 'bg-destructive'}`} />
              <span className="text-xs font-semibold uppercase tracking-wider">{isConnected ? 'LIVE DATA' : 'DISCONNECTED'}</span>
            </div>
            <Button variant="outline" size="icon" onClick={() => setIsConnected(!isConnected)}>
              <RefreshCw className={`w-4 h-4 ${isConnected ? 'animate-spin-slow' : ''}`} />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Account Balance" 
            value={`$${metrics.balance.toLocaleString('en-US')}`} 
            icon={<Wallet className="text-primary" />}
            footer={activeAccount ? `${activeAccount.size} ${activeAccount.plan}` : 'NO ACTIVE ACCOUNT'}
          />
          <MetricCard 
            title="Current Equity" 
            value={`$${metrics.equity.toLocaleString('en-US')}`} 
            icon={<Activity className="text-accent" />}
            trend={0}
            footer={!activeAccount ? 'NO ACTIVE ACCOUNT' : undefined}
          />
          <MetricCard 
            title="Today's P&L" 
            value={`$${metrics.dailyPnL.toLocaleString('en-US')}`} 
            icon={metrics.dailyPnL >= 0 ? <TrendingUp className="text-accent" /> : <TrendingDown className="text-destructive" />}
            trend={0}
            footer={!activeAccount ? 'NO ACTIVE ACCOUNT' : undefined}
          />
          <MetricCard 
            title="Win Rate" 
            value={`${metrics.winRate}%`} 
            icon={<CheckCircle2 className="text-primary" />}
            footer={activeAccount ? `${metrics.tradesToday} trades executed today` : 'NO ACTIVE ACCOUNT'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 border-border/50 shadow-xl shadow-primary/5 bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-headline">14-Day Performance</CardTitle>
                <CardDescription>Visualizing your daily trading P&L</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full mt-4 flex items-center justify-center bg-secondary/10 rounded-xl border border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">No trading history found for this account.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> My Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Plan" value={activeAccount?.plan || 'None'} />
                  <DetailItem label="Size" value={activeAccount?.size || 'N/A'} />
                  <DetailItem label="Tier" value={userData?.tier || 'Bronze'} />
                  <DetailItem label="Status" value={activeAccount?.status || 'N/A'} />
                </div>
                <div className="pt-4 border-t border-primary/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progress</span>
                    <Badge className={activeAccount ? "bg-accent text-accent-foreground font-bold px-2 py-0.5 text-[9px]" : "bg-muted text-muted-foreground font-bold px-2 py-0.5 text-[9px]"}>
                      {activeAccount ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span>Profit Target</span>
                      <span className="text-accent">{metrics.currentProfitPercent}% / {metrics.profitTarget}%</span>
                    </div>
                    <Progress value={metrics.profitTarget > 0 ? (metrics.currentProfitPercent / metrics.profitTarget) * 100 : 0} className="h-2 bg-secondary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent" /> AI Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div className="h-24 flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-primary" /></div>}>
                  {compliance ? (
                    <div className={`p-4 rounded-xl border ${compliance.status === 'at-risk' ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/10 border-primary/20'}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-primary flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> System Insight
                      </p>
                      <p className="text-sm font-medium leading-relaxed mb-3">{compliance.message}</p>
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-xs italic">
                      Monitoring disabled: Connect account to MT5 server.
                    </div>
                  )}
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-headline">Recent Executions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                    <th className="py-4 px-6">Symbol</th>
                    <th className="py-4 px-4">Direction</th>
                    <th className="py-4 px-4">Lot Size</th>
                    <th className="py-4 px-4">P&L</th>
                    <th className="py-4 px-6 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                   <tr>
                     <td colSpan={5} className="py-10 text-center text-muted-foreground italic">No live trades detected. Start trading on MT5 to see your executions here.</td>
                   </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, footer }: { title: string, value: string, icon: React.ReactNode, trend?: number, footer?: string }) {
  return (
    <Card className="border-border/50 bg-card/40 hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</span>
          <div className="p-2 bg-secondary rounded-lg border border-border group-hover:border-primary/20 transition-colors">
            {icon}
          </div>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-bold font-headline tabular-nums leading-none">{value}</span>
          {trend !== undefined && trend !== 0 && (
            <span className={`text-[10px] font-black mb-1.5 flex items-center px-1.5 py-0.5 rounded-full ${trend >= 0 ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {footer && <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-wider"><Server className="w-3 h-3" /> {footer}</p>}
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-white truncate">{value}</p>
    </div>
  );
}
