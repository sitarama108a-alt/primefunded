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
  CheckCircle2, 
  Clock, 
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
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useDoc } from '@/firebase';
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
  Tooltip as ChartTooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays, subMonths } from 'date-fns';

interface DashboardPageProps {
  adminViewMode?: boolean;
  targetUid?: string;
}

const MetricCard = memo(function MetricCard({ title, value, icon, footer }: { title: string, value: string, icon: React.ReactNode, footer?: string }) {
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
          <span className="text-3xl font-bold font-headline tabular-nums leading-none text-white">{value}</span>
        </div>
        {footer && <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-bold uppercase tracking-wider"><Server className="w-3 h-3" /> {footer}</p>}
      </CardContent>
    </Card>
  );
});

export default function DashboardPage({ adminViewMode = false, targetUid }: DashboardPageProps) {
  const { user, userData: loggedInUserData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const effectiveUid = adminViewMode && targetUid ? targetUid : user?.uid;
  
  const { data: targetUserData, loading: targetUserLoading } = useDoc<any>(
    adminViewMode && effectiveUid ? `users/${effectiveUid}` : null
  );
  
  const userData = adminViewMode ? targetUserData : loggedInUserData;
  
  const [mt5Data, setMt5Data] = useState<any>(null);
  const [mt5DocExists, setMt5DocExists] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('7D');
  const { toast } = useToast();
  const db = useFirestore();

  const [softBreachWarning, setSoftBreachWarning] = useState<string | null>(null);

  // Performance Data Fetching
  const performanceConstraints = useMemo(() => {
    if (!effectiveUid) return [];
    let startDate = subDays(new Date(), 7);
    if (chartPeriod === '14D') startDate = subDays(new Date(), 14);
    if (chartPeriod === '1M') startDate = subMonths(new Date(), 1);
    
    return [
      orderBy('date', 'asc'),
      where('date', '>=', startDate.toISOString())
    ];
  }, [effectiveUid, chartPeriod]);

  const { data: performanceData } = useCollection<any>(
    effectiveUid ? `users/${effectiveUid}/dailyPnL` : null,
    performanceConstraints
  );

  const { data: tradesData } = useCollection<any>(
    effectiveUid ? `users/${effectiveUid}/trades` : null,
    [orderBy('date', 'desc'), limit(10)]
  );

  useEffect(() => {
    if (!effectiveUid || !db || !userData?.mt5Login) return;

    const login = userData.mt5Login.toString();
    const unsubscribeMt5 = onSnapshot(doc(db, 'mt5_accounts', login), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setMt5Data(data);
        setMt5DocExists(true);
        
        if (!adminViewMode) {
          fetch('/api/breach-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: effectiveUid, mt5Data: data })
          }).catch(err => {});
        }
      } else {
        setMt5DocExists(false);
        setMt5Data(null);
      }
    });
    return () => unsubscribeMt5();
  }, [effectiveUid, db, adminViewMode, userData?.mt5Login]);

  useEffect(() => {
    if (!effectiveUid || !db) return;
    const q = query(
      collection(db, 'users', effectiveUid, 'notifications'), 
      where('type', '==', 'soft_breach_warning'), 
      where('isRead', '==', false), 
      limit(1)
    );
    const unsubscribeNotif = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setSoftBreachWarning(snapshot.docs[0].data().message);
      } else {
        setSoftBreachWarning(null);
      }
    });

    return () => unsubscribeNotif();
  }, [effectiveUid, db]);

  useEffect(() => {
    if (!authLoading && !user && !adminViewMode) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, authLoading, router, adminViewMode]);

  const connectionStatus = useMemo(() => {
    if (!userData?.mt5Login) return 'none';
    if (!mt5DocExists) return 'awaiting';
    if (!mt5Data?.updatedAt) return 'offline';

    const lastUpdate = mt5Data.updatedAt?.seconds ? mt5Data.updatedAt.seconds * 1000 : 
                       mt5Data.updatedAt ? new Date(mt5Data.updatedAt).getTime() : 0;
    
    const isStale = (Date.now() - lastUpdate) > 60000;
    return isStale ? 'offline' : 'online';
  }, [userData?.mt5Login, mt5DocExists, mt5Data]);

  const metrics = useMemo(() => {
    const parseSize = (sizeStr: string) => {
      if (!sizeStr) return 0;
      return parseFloat(sizeStr.replace(/[$,]/g, '').replace(/k/i, '000')) || 0;
    };

    const staticBalance = userData?.accountBalance || parseSize(userData?.accountSize);
    const liveBalance = mt5Data?.balance !== undefined ? mt5Data.balance : staticBalance;
    const liveEquity = mt5Data?.equity !== undefined ? mt5Data.equity : liveBalance;
    
    return {
      balance: liveBalance,
      equity: liveEquity,
      winRate: mt5Data?.winRate || 0,
      tradesToday: mt5Data?.tradesToday || 0
    };
  }, [userData?.accountBalance, userData?.accountSize, mt5Data]);

  const performanceStats = useMemo(() => {
    if (!performanceData || performanceData.length === 0) return null;
    
    const totalPnL = performanceData.reduce((acc, curr) => acc + (curr.pnl || 0), 0);
    const positiveDays = performanceData.filter(d => (d.pnl || 0) > 0).length;
    const winRate = (positiveDays / performanceData.length) * 100;
    
    const sortedByPnL = [...performanceData].sort((a, b) => (b.pnl || 0) - (a.pnl || 0));
    const bestDay = sortedByPnL[0]?.pnl || 0;
    const worstDay = sortedByPnL[sortedByPnL.length - 1]?.pnl || 0;

    return { totalPnL, winRate, bestDay, worstDay, count: performanceData.length };
  }, [performanceData]);

  const dailyRiskMetrics = useMemo(() => {
    const dailyStart = userData?.dailyStartBalance || metrics.balance;
    const currentEquity = metrics.equity;
    const pnl = currentEquity - dailyStart;
    const pnlPct = dailyStart > 0 ? (pnl / dailyStart) * 100 : 0;
    
    const dailyLimit = (() => {
      const plan = userData?.accountPlan?.toLowerCase() || '';
      if (plan.includes('1-step')) return 3;
      if (plan.includes('2-step')) return 5;
      if (plan.includes('3-step')) return 4;
      if (plan.includes('instant')) return 2;
      return 3;
    })();

    const drawdownPct = pnl < 0 ? Math.abs(pnlPct) : 0;
    const usage = Math.min((drawdownPct / dailyLimit) * 100, 100);

    return {
      pnl,
      pnlPct,
      drawdownPct,
      dailyLimit,
      usage,
      isPositive: pnl >= 0
    };
  }, [userData?.dailyStartBalance, userData?.accountPlan, metrics.balance, metrics.equity]);

  const copyTraderId = () => {
    const idToCopy = userData?.uid || userData?.traderId;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Trader UID copied to clipboard." });
    }
  };

  if (authLoading || (adminViewMode && targetUserLoading)) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !adminViewMode) return null;

  const hasActiveAccount = userData?.accountStatus === 'active';

  return (
    <div className="flex min-h-screen bg-background">
      {!adminViewMode && <Navigation />}
      
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {userData?.accountStatus === 'breached' && (
          <div className="mb-6 p-6 rounded-2xl bg-destructive/20 border border-destructive/40 flex items-center justify-between shadow-2xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-destructive/30 flex items-center justify-center text-destructive">
                <Skull className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-headline font-bold text-white uppercase tracking-tighter">Account Terminated (Hard Breach)</h3>
                <p className="text-sm text-destructive-foreground font-medium">Termination Reason: <span className="font-bold underline">{userData.breachReason || 'Rule Violation'}</span></p>
              </div>
            </div>
            <Button variant="destructive" className="font-bold px-8 h-12" asChild>
              <Link href="/support">Appeal Decision</Link>
            </Button>
          </div>
        )}

        {softBreachWarning && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase tracking-tight">Active Strategy Warning</p>
              <p className="text-xs text-amber-200/70">{softBreachWarning}</p>
            </div>
          </div>
        )}

        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1 text-white">Trader Terminal</h1>
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">Welcome back, {userData?.name || 'Trader'}.</p>
              <div className="flex items-center gap-2 mt-1">
                <div 
                  className="flex items-center gap-2 px-3 py-1 bg-secondary border border-primary/20 rounded-lg group hover:border-primary/50 transition-colors cursor-pointer" 
                  onClick={copyTraderId}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">UID:</span>
                  <span className="font-mono text-sm font-bold text-white">{userData?.uid || userData?.traderId || '--------'}</span>
                  <button className="text-muted-foreground group-hover:text-primary transition-colors cursor-pointer">
                    {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {!adminViewMode && <NotificationBell />}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
              <span className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'online' ? 'bg-accent live-indicator' : 
                connectionStatus === 'offline' ? 'bg-destructive' : 'bg-muted-foreground'
              )} />
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                {connectionStatus === 'online' ? 'LIVE SYNC' : 
                 connectionStatus === 'offline' ? 'EA OFFLINE' : 
                 connectionStatus === 'awaiting' ? 'AWAITING SYNC' : 'TERMINAL IDLE'}
              </span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard 
            title="Account Balance" 
            value={`$${metrics.balance.toLocaleString('en-US')}`} 
            icon={<Wallet className="text-primary" />}
            footer={hasActiveAccount ? `${userData.accountSize} ${userData.accountPlan}` : 'NO ACTIVE ACCOUNT'}
          />
          <MetricCard 
            title="Equity" 
            value={`$${metrics.equity.toLocaleString('en-US')}`} 
            icon={<Activity className="text-accent" />}
            footer="Live margin available"
          />
          <MetricCard 
            title="Total Referrals" 
            value={(userData?.referralCount || 0).toString()} 
            icon={<Users className="text-emerald-500" />}
            footer="Signups via your code"
          />
          <MetricCard 
            title="Referral Earnings" 
            value={`$${(userData?.referralEarnings || 0).toFixed(2)}`} 
            icon={<DollarSign className="text-amber-500" />}
            footer="Withdrawable commission"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/50 bg-card/40 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Daily P&L</span>
                <div className={cn(
                  "p-2 rounded-lg border",
                  dailyRiskMetrics.isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-destructive/10 border-destructive/20 text-destructive"
                )}>
                  {dailyRiskMetrics.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className={cn(
                  "text-3xl font-bold font-headline tabular-nums",
                  dailyRiskMetrics.isPositive ? "text-emerald-500" : "text-destructive"
                )}>
                  {dailyRiskMetrics.isPositive ? '+' : ''}${dailyRiskMetrics.pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {dailyRiskMetrics.pnlPct.toFixed(2)}% of starting equity
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/40 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Drawdown Level</span>
                <div className="p-2 bg-secondary rounded-lg border border-border">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-bold font-headline tabular-nums text-white">
                    {dailyRiskMetrics.drawdownPct.toFixed(2)}%
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Limit: {dailyRiskMetrics.dailyLimit}%
                  </span>
                </div>
                <div className="space-y-2">
                  <Progress 
                    value={dailyRiskMetrics.usage} 
                    className="h-2"
                  />
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className={cn(
                      dailyRiskMetrics.usage > 80 ? "text-destructive" : 
                      dailyRiskMetrics.usage > 50 ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {dailyRiskMetrics.usage.toFixed(1)}% of daily limit used
                    </span>
                    {dailyRiskMetrics.usage > 80 && <span className="text-destructive flex items-center gap-1 animate-pulse"><AlertTriangle className="w-3 h-3" /> Critical</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 border-border/50 bg-card/40 backdrop-blur-sm shadow-xl shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl font-headline text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Trading Performance
                </CardTitle>
                <CardDescription>Equity growth and risk analysis.</CardDescription>
              </div>
              <Tabs value={chartPeriod} onValueChange={setChartPeriod}>
                <TabsList className="bg-secondary/50 p-1">
                  <TabsTrigger value="7D" className="text-[10px] font-bold px-3">7D</TabsTrigger>
                  <TabsTrigger value="14D" className="text-[10px] font-bold px-3">14D</TabsTrigger>
                  <TabsTrigger value="1M" className="text-[10px] font-bold px-3">1M</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px] w-full mb-8">
                {performanceData && performanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#666" 
                        fontSize={10} 
                        tickFormatter={(str) => format(new Date(str), 'MMM d')}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#666" 
                        fontSize={10} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                      />
                      <ChartTooltip 
                        contentStyle={{ backgroundColor: '#0a0f1e', border: '1px solid #11b3f5', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#11b3f5' }}
                        labelFormatter={(str) => format(new Date(str), 'PPPP')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="endBalance" 
                        stroke="#11b3f5" 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: '#11b3f5' }} 
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-secondary/10">
                    <Calendar className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                    <p className="text-muted-foreground text-sm">No performance data captured for this period.</p>
                  </div>
                )}
              </div>

              {performanceStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-border/50">
                  <StatItem label="Total P&L" value={`$${performanceStats.totalPnL.toLocaleString()}`} color={performanceStats.totalPnL >= 0 ? 'emerald' : 'destructive'} />
                  <StatItem label="Win Rate" value={`${performanceStats.winRate.toFixed(1)}%`} />
                  <StatItem label="Total Trades" value={performanceStats.count.toString()} />
                  <StatItem label="Best Day" value={`+$${performanceStats.bestDay.toLocaleString()}`} color="emerald" />
                  <StatItem label="Worst Day" value={`-$${Math.abs(performanceStats.worstDay).toLocaleString()}`} color="destructive" />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <ShieldCheck className="w-5 h-5 text-primary" /> My Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Plan" value={userData?.accountPlan || 'None'} />
                  <DetailItem label="Size" value={userData?.accountSize || 'N/A'} />
                  <DetailItem label="Tier" value={userData?.tier || 'Bronze'} />
                  <DetailItem label="Status" value={userData?.accountStatus || 'N/A'} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-secondary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Activity className="w-5 h-5 text-accent" /> AI Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userData?.accountStatus === 'breached' ? (
                  <div className="p-4 rounded-xl border bg-destructive/10 border-destructive/20">
                    <p className="text-xs font-bold text-destructive flex items-center gap-2 uppercase">
                      <Skull className="w-4 h-4" /> Monitoring Disabled
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Evaluation halted due to rule violation.</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border bg-primary/10 border-primary/20">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-primary flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> System Insight
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-white">Institutional risk guard is active. Monitoring for drawdown and strategy compliance.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm mb-8 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
            <div>
              <CardTitle className="text-xl font-headline text-white flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Total Trade History
              </CardTitle>
              <CardDescription>Last 10 executions across your accounts.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/10" asChild>
              <Link href="/history">View All <ExternalLink className="ml-2 w-4 h-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-2">Symbol</th>
                    <th className="py-4 px-2">Type</th>
                    <th className="py-4 px-2 text-right">Lots</th>
                    <th className="py-4 px-2 text-right">Open</th>
                    <th className="py-4 px-2 text-right">Close</th>
                    <th className="py-4 px-6 text-right">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {tradesData && tradesData.length > 0 ? (
                    tradesData.map((trade: any) => (
                      <tr key={trade.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="py-4 px-6 font-medium text-muted-foreground whitespace-nowrap">
                          {trade.date ? format(new Date(trade.date), 'MMM d, HH:mm') : 'N/A'}
                        </td>
                        <td className="py-4 px-2 font-bold text-white">{trade.symbol}</td>
                        <td className="py-4 px-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                            trade.type?.toLowerCase() === 'buy' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'
                          )}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-right text-white font-mono">{trade.lots}</td>
                        <td className="py-4 px-2 text-right text-muted-foreground font-mono">{trade.openPrice}</td>
                        <td className="py-4 px-2 text-right text-muted-foreground font-mono">{trade.closePrice}</td>
                        <td className={cn(
                          "py-4 px-6 text-right font-bold tabular-nums",
                          (trade.pnl || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'
                        )}>
                          {(trade.pnl || 0) >= 0 ? '+' : ''}${trade.pnl?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-20 text-center text-muted-foreground italic bg-secondary/5">
                        No trade history found. Executions will populate here after they are closed on MT5.
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

function StatItem({ label, value, color = 'muted' }: { label: string, value: string, color?: 'emerald' | 'destructive' | 'muted' }) {
  const colorMap = {
    emerald: 'text-emerald-500',
    destructive: 'text-destructive',
    muted: 'text-white'
  };
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className={cn("text-sm font-bold tabular-nums", colorMap[color])}>{value}</p>
    </div>
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
