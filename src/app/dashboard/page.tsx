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
  Zap
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
  const userData = adminViewMode ? loggedInUserData : loggedInUserData; // In a real app we'd fetch targetUid but AuthContext handles current user well

  const [mt5Data, setMt5Data] = useState<any>(null);
  const [mt5DocExists, setMt5DocExists] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('7D');
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    if (!effectiveUid || !db || !userData?.mt5Login) return;

    const login = userData.mt5Login.toString();
    const unsubscribeMt5 = onSnapshot(doc(db, 'mt5_accounts', login), (snapshot) => {
      if (snapshot.exists()) {
        setMt5Data(snapshot.data());
        setMt5DocExists(true);
      } else {
        setMt5DocExists(false);
      }
    });
    return () => unsubscribeMt5();
  }, [effectiveUid, db, userData?.mt5Login]);

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
    };
  }, [userData?.accountBalance, userData?.accountSize, mt5Data]);

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
      if (plan.includes('instant')) return 2;
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

  if (authLoading) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {!adminViewMode && <Navigation />}
      
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        {userData?.accountStatus === 'breached' && (
          <div className="mb-6 p-6 rounded-2xl bg-destructive/20 border border-destructive/40 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
              <Skull className="w-8 h-8 text-destructive" />
              <div>
                <h3 className="text-xl font-headline font-bold text-white uppercase">Account Terminated</h3>
                <p className="text-sm text-destructive-foreground">Reason: {userData.breachReason || 'Rule Violation'}</p>
              </div>
            </div>
            <Button variant="destructive" asChild><Link href="/support">Appeal Decision</Link></Button>
          </div>
        )}

        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1 text-white">Trader Terminal</h1>
            <p className="text-muted-foreground">Welcome back, {userData?.name || 'Trader'}.</p>
          </div>
          <div className="flex items-center gap-4">
            {!adminViewMode && <NotificationBell />}
            <Badge variant="outline" className="h-9 px-4 uppercase font-bold tracking-widest border-white/10">
              <div className={cn("w-2 h-2 rounded-full mr-2", mt5DocExists ? 'bg-accent live-indicator' : 'bg-muted')} />
              {mt5DocExists ? 'Live Sync' : 'Offline'}
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard title="Account Balance" value={`$${metrics.balance.toLocaleString()}`} icon={<Wallet className="text-primary" />} />
          <MetricCard title="Equity" value={`$${metrics.equity.toLocaleString()}`} icon={<Activity className="text-accent" />} />
          <MetricCard title="Total Referrals" value={(userData?.referralCount || 0).toString()} icon={<Users className="text-emerald-500" />} />
          <MetricCard title="Referral Earnings" value={`$${(userData?.referralEarnings || 0).toFixed(2)}`} icon={<DollarSign className="text-amber-500" />} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-border/50 bg-card/40">
            <CardContent className="p-6">
              <div className="flex justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Daily P&L</span>
                {dailyRiskMetrics.isPositive ? <TrendingUp className="text-emerald-500 w-4 h-4" /> : <TrendingDown className="text-destructive w-4 h-4" />}
              </div>
              <p className={cn("text-3xl font-bold font-headline", dailyRiskMetrics.isPositive ? 'text-emerald-500' : 'text-destructive')}>
                {dailyRiskMetrics.isPositive ? '+' : ''}${dailyRiskMetrics.pnl.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{dailyRiskMetrics.pnlPct.toFixed(2)}% of start balance</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/40">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-headline text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Performance</CardTitle>
                </div>
                <Tabs value={chartPeriod} onValueChange={setChartPeriod}>
                  <TabsList className="bg-secondary/50"><TabsTrigger value="7D" className="text-[10px] font-bold">7D</TabsTrigger><TabsTrigger value="1M" className="text-[10px] font-bold">1M</TabsTrigger></TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground italic text-sm">
                No performance data captured for this period.
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white"><ShieldCheck className="w-5 h-5 text-primary" /> My Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-muted-foreground uppercase">Current Phase</p>
                      <Badge className={cn("gap-1.5 py-1 px-3", currentPhaseDisplay.className)}>
                        {currentPhaseDisplay.icon}
                        {currentPhaseDisplay.label}
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
      </main>
    </div>
  );
}
