"use client";

import { useEffect, useState, useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Activity, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Server,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Circle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { aiComplianceMonitorAlerts } from '@/ai/flows/ai-compliance-monitor-alerts';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

// Mock 14-day performance data
const performanceData = [
  { day: '01/03', pnl: 450 },
  { day: '02/03', pnl: -120 },
  { day: '03/03', pnl: 300 },
  { day: '04/03', pnl: 800 },
  { day: '05/03', pnl: -450 },
  { day: '06/03', pnl: 1200 },
  { day: '07/03', pnl: 200 },
  { day: '08/03', pnl: -100 },
  { day: '09/03', pnl: 650 },
  { day: '10/03', pnl: 400 },
  { day: '11/03', pnl: -220 },
  { day: '12/03', pnl: 550 },
  { day: '13/03', pnl: 150 },
  { day: '14/03', pnl: 890 },
];

export default function DashboardPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const db = useFirestore();
  const [isConnected, setIsConnected] = useState(true);
  const [compliance, setCompliance] = useState<any>(null);

  // Fetch active account data
  const accountsQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(db, 'accounts'), where('userId', '==', user.uid), where('status', '==', 'active'));
  }, [db, user]);

  const { data: accounts, loading: accountsLoading } = useCollection<any>('accounts', accountsQuery ? [where('userId', '==', user?.uid || ''), where('status', '==', 'active')] : []);
  const activeAccount = accounts?.[0];

  useEffect(() => {
    if (activeAccount) {
      const fetchCompliance = async () => {
        try {
          const result = await aiComplianceMonitorAlerts({
            plan: activeAccount.plan as any || "1-Step Pro",
            dailyLoss: 1.2,
            totalLoss: 0.8,
            profit: 2.5,
            tradingDays: 5,
            hasOpenTrades: true
          });
          setCompliance(result);
        } catch (err) {
          console.error(err);
        }
      };
      fetchCompliance();
    }
  }, [activeAccount]);

  if (authLoading || accountsLoading) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = {
    balance: activeAccount?.balance || userData?.balance || 100000,
    equity: activeAccount?.balance ? activeAccount.balance * 1.02 : (userData?.balance || 100000) * 1.02,
    dailyPnL: 2450.50,
    winRate: 64,
    tradesToday: 12,
    profitTarget: 10,
    currentProfitPercent: 2.45
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1">Trader Terminal</h1>
            <p className="text-muted-foreground">Welcome back, {userData?.name || 'Elite Trader'}.</p>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Account Balance" 
            value={`$${metrics.balance.toLocaleString()}`} 
            icon={<Wallet className="text-primary" />}
            footer={activeAccount ? `${activeAccount.size} ${activeAccount.plan}` : 'No active challenge'}
          />
          <MetricCard 
            title="Current Equity" 
            value={`$${metrics.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={<Activity className="text-accent" />}
            trend={+2.45}
          />
          <MetricCard 
            title="Today's P&L" 
            value={`$${metrics.dailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={metrics.dailyPnL >= 0 ? <TrendingUp className="text-accent" /> : <TrendingDown className="text-destructive" />}
            trend={metrics.dailyPnL >= 0 ? +1.2 : -0.5}
          />
          <MetricCard 
            title="Win Rate" 
            value={`${metrics.winRate}%`} 
            icon={<CheckCircle2 className="text-primary" />}
            footer={`${metrics.tradesToday} trades executed today`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Performance Chart */}
          <Card className="lg:col-span-2 border-border/50 shadow-xl shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-headline">14-Day Performance</CardTitle>
                <CardDescription>Daily profit and loss distribution</CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">HISTORY</Badge>
                <Badge className="bg-accent text-accent-foreground font-bold">REAL-TIME</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--secondary))', opacity: 0.2}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                      {performanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'oklch(0.7 0.18 155)' : 'oklch(0.62 0.22 25)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Account Details & AI Panel */}
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> My Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Plan" value={activeAccount?.plan || '1-Step Pro'} />
                  <DetailItem label="Size" value={activeAccount?.size || '$100,000'} />
                  <DetailItem label="Tier" value={userData?.tier || 'Bronze'} />
                  <DetailItem label="Days" value="5 / 30" />
                </div>
                <div className="pt-4 border-t border-primary/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</span>
                    <Badge className="bg-accent text-accent-foreground font-bold px-2 py-0.5">IN PROGRESS</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span>Profit Target Progress</span>
                      <span className="text-accent">{metrics.currentProfitPercent}% / {metrics.profitTarget}%</span>
                    </div>
                    <Progress value={(metrics.currentProfitPercent / metrics.profitTarget) * 100} className="h-2 bg-secondary" />
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
                {compliance ? (
                  <div className={`p-4 rounded-xl border ${compliance.status === 'at-risk' ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/10 border-primary/20'}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-primary flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> System Insight
                    </p>
                    <p className="text-sm font-medium leading-relaxed mb-3">{compliance.message}</p>
                    <div className="space-y-2">
                      {compliance.warnings?.map((w: string, i: number) => (
                        <div key={i} className="flex gap-2 items-start text-xs text-muted-foreground">
                          <Circle className="w-1.5 h-1.5 mt-1.5 fill-destructive text-destructive flex-shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Trades Table */}
        <Card className="border-border/50">
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
                  <TradeRow symbol="EURUSD" direction="Buy" lot={2.5} pnl={250.50} time="14:45:12" />
                  <TradeRow symbol="XAUUSD" direction="Sell" lot={0.5} pnl={-130.20} time="12:22:45" />
                  <TradeRow symbol="NAS100" direction="Buy" lot={1.0} pnl={450.00} time="10:15:33" />
                  <TradeRow symbol="GBPUSD" direction="Buy" lot={1.5} pnl={-12.40} time="08:30:10" />
                  <TradeRow symbol="USDJPY" direction="Sell" lot={3.0} pnl={1240.00} time="07:05:01" />
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
    <Card className="border-border/50 bg-card/40 hover:border-primary/30 transition-all group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</span>
          <div className="p-2 bg-secondary rounded-lg border border-border group-hover:border-primary/20 transition-colors">
            {icon}
          </div>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-3xl font-bold font-headline tabular-nums">{value}</span>
          {trend && (
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

function TradeRow({ symbol, direction, lot, pnl, time }: { symbol: string, direction: 'Buy' | 'Sell', lot: number, pnl: number, time: string }) {
  const isProfit = pnl >= 0;
  return (
    <tr className="hover:bg-secondary/10 transition-colors group">
      <td className="py-4 px-6 font-bold font-mono text-white">{symbol}</td>
      <td className="py-4 px-4">
        <Badge variant="outline" className={direction === 'Buy' ? 'text-accent border-accent/20' : 'text-blue-400 border-blue-400/20'}>
          {direction}
        </Badge>
      </td>
      <td className="py-4 px-4 text-muted-foreground font-mono">{lot.toFixed(2)}</td>
      <td className={`py-4 px-4 font-bold font-mono ${isProfit ? 'text-accent' : 'text-destructive'}`}>
        {isProfit ? '+' : ''}{pnl.toFixed(2)}
      </td>
      <td className="py-4 px-6 text-right text-muted-foreground font-mono text-xs">{time}</td>
    </tr>
  );
}
