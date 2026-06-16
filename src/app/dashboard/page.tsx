
'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  Activity, 
  Server, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertTriangle, 
  ExternalLink, 
  Users, 
  DollarSign, 
  Skull,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  History,
  Trophy,
  Zap,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection } from '@/firebase';
import { where, doc, limit, orderBy, onSnapshot, collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';
import { cn } from '@/lib/utils';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ChartTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, subMonths, differenceInSeconds, isValid } from 'date-fns';

interface DashboardPageProps {
  adminViewMode?: boolean;
  targetUid?: string;
}

const MetricCard = memo(function MetricCard({ title, value, icon, footer, disabled }: { title: string, value: string, icon: React.ReactNode, footer?: string, disabled?: boolean }) {
  return (
    <Card className={cn(
      "border-border/50 bg-card/40 transition-all duration-300 group",
      disabled ? "opacity-40 grayscale" : "hover:border-primary/30"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</span>
          <div className="p-2 bg-secondary rounded-lg border border-border group-hover:border-primary/20 transition-colors">
            {icon}
          </div>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-bold font-headline tabular-nums leading-none text-white">{value}</span>
        </div>
        {footer && <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-wider"><Server className="w-3 h-3" /> {footer}</p>}
      </CardContent>
    </Card>
  );
});

export default function DashboardPage({ adminViewMode = false, targetUid }: DashboardPageProps) {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const effectiveUid = adminViewMode && targetUid ? targetUid : user?.uid;
  const [chartPeriod, setChartPeriod] = useState('7D');
  const { toast } = useToast();

  const isBreached = userData?.accountStatus === 'breached';

  // Determine EA Connectivity Status
  const connectivityStatus = useMemo(() => {
    if (isBreached) return 'terminated';
    if (!userData?.lastMT5Update) return 'awaiting';
    
    try {
      const lastUpdate = userData.lastMT5Update?.seconds 
        ? new Date(userData.lastMT5Update.seconds * 1000) 
        : userData.lastMT5Update?.toDate?.() || new Date(userData.lastMT5Update);

      if (!isValid(lastUpdate)) return 'offline';

      const diffSeconds = Math.abs(differenceInSeconds(new Date(), lastUpdate));
      return diffSeconds < 60 ? 'live' : 'offline';
    } catch (e) {
      return 'offline';
    }
  }, [userData?.lastMT5Update, isBreached]);

  // Fetch recent trades
  const tradeConstraints = useMemo(() => [
    orderBy('date', 'desc'),
    limit(10)
  ], []);

  const { data: recentTrades, loading: tradesLoading } = useCollection<any>(
    effectiveUid ? `users/${effectiveUid}/trades` : null,
    tradeConstraints
  );

  const metrics = useMemo(() => {
    const parseSize = (sizeStr: string) => {
      if (!sizeStr) return 0;
      return parseFloat(sizeStr.replace(/[$,]/g, '').replace(/k/i, '000')) || 0;
    };

    const staticBalance = userData?.accountBalance || parseSize(userData?.accountSize);
    const liveBalance = userData?.liveBalance !== undefined ? userData.liveBalance : staticBalance;
    const liveEquity = userData?.liveEquity !== undefined ? userData.liveEquity : liveBalance;
    
    return {
      balance: liveBalance,
      equity: liveEquity,
    };
  }, [userData]);

  const dailyRiskMetrics = useMemo(() => {
    const dailyStart = userData?.dailyStartBalance || metrics.balance;
    const currentEquity = metrics.equity;
    const pnl = currentEquity - dailyStart;
    const pnlPct = dailyStart > 0 ? (pnl / dailyStart) * 100 : 0;
    
    const getLimit = () => {
      const plan = userData?.accountPlan?.toLowerCase() || '';
      if (plan.includes('1-step')) return 3;
      if (plan.includes('2-step')) return 5;
      if (plan.includes('3-step')) return 4;
      if (plan.includes('instant')) return 3;
      return 3;
    };

    const limit = getLimit();
    const drawdownPct = pnl < 0 ? Math.abs(pnlPct) : 0;
    const usage = Math.min((drawdownPct / limit) * 100, 100);

    return { pnl, pnlPct, usage, limit, drawdownPct, isPositive: pnl >= 0 };
  }, [userData, metrics]);

  const currentPhaseDisplay = useMemo(() => {
    const phase = userData?.currentPhase || 'evaluation';
    if (phase === 'funded') return { label: 'Funded Stage', icon: <Trophy className="w-3 h-3" />, className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
    if (phase === 'phase1') return { label: 'Phase 1: Evaluation', icon: <Zap className="w-3 h-3" />, className: 'bg-primary/10 text-primary border-primary/20' };
    if (phase === 'phase2') return { label: 'Phase 2: Verification', icon: <Zap className="w-3 h-3" />, className: 'bg-primary/10 text-primary border-primary/20' };
    if (phase === 'phase3') return { label: 'Phase 3: Final Stage', icon: <Zap className="w-3 h-3" />, className: 'bg-primary/10 text-primary border-primary/20' };
    return { label: 'Evaluation Phase', icon: <Zap className="w-3 h-3" />, className: 'bg-primary/10 text-primary border-primary/20' };
  }, [userData?.currentPhase]);

  const getTradeDate = (time: any) => {
    if (!time) return null;
    if (typeof time === 'number') return new Date(time * 1000);
    if (time.toDate && typeof time.toDate === 'function') return time.toDate();
    return new Date(time);
  };

  const calculateHoldingTime = (open: any, close: any) => {
    const openDate = getTradeDate(open);
    const closeDate = getTradeDate(close);
    
    if (!openDate || !closeDate) return 'N/A';
    try {
      const seconds = differenceInSeconds(closeDate, openDate);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } catch (e) {
      return 'N/A';
    }
  };

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {!adminViewMode && <Navigation />}
      
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {isBreached && (
          <div className="mb-8 p-6 rounded-2xl bg-destructive/20 border border-destructive/40 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive flex items-center justify-center text-white shrink-0">
                <Skull className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-headline font-bold text-white uppercase tracking-tight">Account Liquidated</h3>
                <p className="text-sm text-destructive-foreground">This account has been terminated due to a hard rule breach: <span className="font-bold text-white">{userData?.breachReason || 'Rule Violation'}</span>.</p>
              </div>
            </div>
            <Button size="lg" className="bg-destructive hover:bg-destructive/90 font-bold whitespace-nowrap px-8 h-12 rounded-xl" asChild>
              <Link href="/challenges">Start New Challenge <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        )}

        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1 text-white">Trader Terminal</h1>
            <p className="text-muted-foreground">Welcome back, {userData?.name || 'Trader'}.</p>
          </div>
          <div className="flex items-center gap-4">
            {!adminViewMode && <NotificationBell />}
            <Badge variant="outline" className={cn(
              "h-9 px-4 uppercase font-bold tracking-widest border-white/10",
              connectivityStatus === 'terminated' && "border-destructive/30 text-destructive",
              connectivityStatus === 'offline' && "border-destructive/30 text-destructive",
              connectivityStatus === 'live' && "border-accent/30 text-accent"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full mr-2", 
                connectivityStatus === 'live' ? 'bg-accent live-indicator' : 
                connectivityStatus === 'offline' || connectivityStatus === 'terminated' ? 'bg-destructive' : 'bg-muted'
              )} />
              {connectivityStatus === 'live' ? 'Live Sync' : 
               connectivityStatus === 'offline' ? 'EA Offline' : 
               connectivityStatus === 'terminated' ? 'Terminated' : 'Awaiting Sync'}
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard title="Account Balance" value={`$${metrics.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<Wallet className="text-primary" />} disabled={isBreached} />
          <MetricCard title="Equity" value={`$${metrics.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<Activity className="text-accent" />} disabled={isBreached} />
          <MetricCard title="Total Referrals" value={(userData?.referralCount || 0).toString()} icon={<Users className="text-emerald-500" />} />
          <MetricCard title="Referral Earnings" value={`$${(userData?.referralEarnings || 0).toFixed(2)}`} icon={<DollarSign className="text-amber-500" />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className={cn("border-border/50 bg-card/40 transition-opacity", isBreached && "opacity-40 grayscale")}>
            <CardContent className="p-6">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Daily P&L</span>
                {dailyRiskMetrics.isPositive ? <TrendingUp className="text-emerald-500 w-4 h-4" /> : <TrendingDown className="text-destructive w-4 h-4" />}
              </div>
              <p className={cn("text-3xl font-bold font-headline", dailyRiskMetrics.isPositive ? 'text-emerald-500' : 'text-destructive')}>
                {dailyRiskMetrics.isPositive ? '+' : ''}${dailyRiskMetrics.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{dailyRiskMetrics.pnlPct.toFixed(2)}% of start balance</p>
            </CardContent>
          </Card>

          <Card className={cn("border-border/50 bg-card/40 transition-opacity", isBreached && "opacity-40 grayscale")}>
            <CardContent className="p-6">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Daily Drawdown</span>
                <span className="text-[10px] font-bold text-muted-foreground">Limit: {dailyRiskMetrics.limit}%</span>
              </div>
              <p className="text-3xl font-bold font-headline text-white">{dailyRiskMetrics.drawdownPct.toFixed(2)}%</p>
              <div className="mt-4 space-y-1.5">
                <Progress value={dailyRiskMetrics.usage} className="h-1.5" />
                <p className={cn("text-[9px] font-black uppercase", dailyRiskMetrics.usage > 80 ? 'text-destructive' : 'text-primary')}>
                  {dailyRiskMetrics.usage.toFixed(1)}% of limit utilized
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className={cn("border-border/50 bg-card/40", isBreached && "opacity-40 grayscale")}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-headline text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Performance</CardTitle>
                </div>
                <Tabs value={chartPeriod} onValueChange={setChartPeriod}>
                  <TabsList className="bg-secondary/50">
                    <TabsTrigger value="7D" className="text-[10px] font-bold">7D</TabsTrigger>
                    <TabsTrigger value="14D" className="text-[10px] font-bold">14D</TabsTrigger>
                    <TabsTrigger value="1M" className="text-[10px] font-bold">1M</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                {isBreached ? "No performance data visible for liquidated accounts." : "No performance data captured for this period."}
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className={cn("border-primary/20 bg-primary/5", isBreached && "border-destructive/20 bg-destructive/5 grayscale")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  {isBreached ? <Skull className="w-5 h-5 text-destructive" /> : <ShieldCheck className="w-5 h-5 text-primary" />}
                  My Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-muted-foreground uppercase">Current Phase</p>
                      <Badge className={cn("gap-1.5 py-1 px-3", isBreached ? "bg-destructive/10 text-destructive border-destructive/20" : currentPhaseDisplay.className)}>
                        {isBreached ? <Skull className="w-3 h-3" /> : currentPhaseDisplay.icon}
                        {isBreached ? 'Breached' : currentPhaseDisplay.label}
                      </Badge>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><p className="text-[9px] font-black text-muted-foreground uppercase">Plan</p><p className="text-xs font-bold text-white">{userData?.accountPlan || 'None'}</p></div>
                  <div className="space-y-1"><p className="text-[9px] font-black text-muted-foreground uppercase">Size</p><p className="text-xs font-bold text-white">{userData?.accountSize || 'N/A'}</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className={cn("border-border/50 bg-card/40 backdrop-blur-sm", isBreached && "opacity-40 grayscale")}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-headline text-white flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Recent Trades
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white" asChild>
              <Link href="/history">View Full Journal <ArrowRight className="ml-2 w-3 h-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="py-4 px-6">Symbol</th>
                    <th className="py-4 px-4">Type</th>
                    <th className="py-4 px-4">Time</th>
                    <th className="py-4 px-4">Duration</th>
                    <th className="py-4 px-4 text-right">Lots</th>
                    <th className="py-4 px-6 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {tradesLoading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse"><td colSpan={6} className="py-6 px-6"><div className="h-4 bg-secondary/50 rounded w-full" /></td></tr>
                    ))
                  ) : recentTrades.length > 0 ? (
                    recentTrades.map((trade: any) => {
                      const tradeDate = getTradeDate(trade.time || trade.date);
                      const closeDate = getTradeDate(trade.closeDate || trade.updatedAt);
                      return (
                        <tr key={trade.id} className="hover:bg-primary/5 transition-colors">
                          <td className="py-4 px-6 font-bold text-white">{trade.symbol || 'N/A'}</td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className={cn(
                              "text-[9px] font-black uppercase px-2",
                              trade.type?.toLowerCase() === 'buy' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-destructive/30 text-destructive bg-destructive/5'
                            )}>
                              {trade.type || 'N/A'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-xs text-muted-foreground font-mono">
                            {tradeDate ? format(tradeDate, 'MMM d, HH:mm') : 'N/A'}
                          </td>
                          <td className="py-4 px-4 text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {calculateHoldingTime(trade.time || trade.date, trade.closeDate || trade.updatedAt)}
                          </td>
                          <td className="py-4 px-4 text-right text-white font-mono">{trade.lots || trade.volume || '0.00'}</td>
                          <td className={cn(
                            "py-4 px-6 text-right font-bold tabular-nums",
                            (trade.pnl || trade.profit || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'
                          )}>
                            {(trade.pnl || trade.profit || 0) >= 0 ? '+' : ''}${(trade.pnl || trade.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-muted-foreground italic text-sm">
                        No trades recorded yet. Your MT5 executions will appear here live.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
