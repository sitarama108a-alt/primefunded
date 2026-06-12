"use client";

import { useEffect, useState } from 'react';
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
  Server
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { aiComplianceMonitorAlerts } from '@/ai/flows/ai-compliance-monitor-alerts';

const mockChartData = [
  { name: '01:00', profit: 4000 },
  { name: '04:00', profit: 3000 },
  { name: '08:00', profit: 2000 },
  { name: '12:00', profit: 2780 },
  { name: '16:00', profit: 1890 },
  { name: '20:00', profit: 2390 },
  { name: '23:59', profit: 3490 },
];

export default function DashboardPage() {
  const { userData, loading } = useAuth();
  const [metrics, setMetrics] = useState({
    balance: 100000,
    equity: 102450.50,
    dailyPnL: 2450.50,
    drawdown: 0.8,
    winRate: 64,
    tradesToday: 12
  });
  const [isConnected, setIsConnected] = useState(true);
  const [compliance, setCompliance] = useState<any>(null);

  useEffect(() => {
    if (userData) {
      setMetrics(prev => ({
        ...prev,
        balance: userData.balance || prev.balance,
        equity: userData.equity || prev.equity,
      }));
    }

    const fetchCompliance = async () => {
      try {
        const result = await aiComplianceMonitorAlerts({
          plan: "1-Step Pro",
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

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        equity: prev.equity + (Math.random() - 0.5) * 100,
        dailyPnL: prev.dailyPnL + (Math.random() - 0.5) * 10,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [userData]);

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1">Trading Terminal</h1>
            <p className="text-muted-foreground">Monitor your performance and rules in real-time.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-accent live-indicator' : 'bg-destructive'}`} />
              <span className="text-xs font-semibold">{isConnected ? 'LIVE CONNECTED' : 'DISCONNECTED'}</span>
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
            footer="Active Challenge: $100k 1-Step"
          />
          <MetricCard 
            title="Current Equity" 
            value={`$${metrics.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={<Activity className="text-accent" />}
            trend={+2.45}
          />
          <MetricCard 
            title="Daily P&L" 
            value={`$${metrics.dailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
            icon={metrics.dailyPnL >= 0 ? <TrendingUp className="text-accent" /> : <TrendingDown className="text-destructive" />}
            trend={metrics.dailyPnL >= 0 ? +1.2 : -0.5}
          />
          <MetricCard 
            title="Max Drawdown" 
            value={`${metrics.drawdown}%`} 
            icon={<AlertTriangle className="text-destructive" />}
            footer="Limit: 6.00%"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <Card className="lg:col-span-2 border-border/50 shadow-xl shadow-primary/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-headline">Equity Curve</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">24H</Badge>
                <Badge variant="secondary">7D</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* AI Compliance Panel */}
          <Card className="border-border/50 bg-secondary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-primary w-5 h-5" />
                <CardTitle className="text-xl font-headline">Rule Monitor</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <RuleItem label="Daily Loss Limit (3%)" current="1.20%" limit="3.00%" status="ok" />
                <RuleItem label="Total Loss Limit (6%)" current="0.80%" limit="6.00%" status="ok" />
                <RuleItem label="Profit Target (10%)" current="2.50%" limit="10.0%" status="progress" />
                <RuleItem label="Minimum Days (3)" current="2" limit="3" status="progress" />
              </div>

              {compliance && (
                <div className={`p-4 rounded-xl border ${compliance.status === 'at-risk' ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/10 border-primary/20'}`}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1 text-primary">AI INSIGHTS</p>
                  <p className="text-sm font-medium leading-relaxed">{compliance.message}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Trades Table */}
        <div className="mt-8">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-headline">Recent Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                      <th className="pb-4 pt-0 px-2">Symbol</th>
                      <th className="pb-4 pt-0 px-2">Type</th>
                      <th className="pb-4 pt-0 px-2">Lot</th>
                      <th className="pb-4 pt-0 px-2">Open</th>
                      <th className="pb-4 pt-0 px-2">P&L</th>
                      <th className="pb-4 pt-0 px-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <TradeRow symbol="EURUSD" type="Buy" lot={1.5} open={1.0845} pnl={120.50} time="10:45:12" />
                    <TradeRow symbol="XAUUSD" type="Sell" lot={0.5} open={2045.20} pnl={-45.20} time="09:22:45" />
                    <TradeRow symbol="NAS100" type="Buy" lot={2.0} open={18240.5} pnl={450.00} time="08:15:33" />
                    <TradeRow symbol="GBPUSD" type="Buy" lot={1.0} open={1.2654} pnl={12.40} time="07:30:10" />
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, icon, trend, footer }: { title: string, value: string, icon: React.ReactNode, trend?: number, footer?: string }) {
  return (
    <Card className="border-border/50 bg-card hover:border-primary/30 transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <div className="p-2 bg-secondary rounded-lg">
            {icon}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold font-headline">{value}</span>
          {trend && (
            <span className={`text-xs font-bold mb-1 flex items-center ${trend >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        {footer && <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5"><Server className="w-3 h-3" /> {footer}</p>}
      </CardContent>
    </Card>
  );
}

function RuleItem({ label, current, limit, status }: { label: string, current: string, limit: string, status: 'ok' | 'warning' | 'error' | 'progress' }) {
  const isOk = status === 'ok';
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span>{label}</span>
        <span className={isOk ? 'text-accent' : 'text-primary'}>{current} / {limit}</span>
      </div>
      <Progress value={(parseFloat(current) / parseFloat(limit)) * 100} className="h-1.5" />
    </div>
  );
}

function TradeRow({ symbol, type, lot, open, pnl, time }: { symbol: string, type: string, lot: number, open: number, pnl: number, time: string }) {
  const isProfit = pnl >= 0;
  return (
    <tr className="hover:bg-secondary/20 transition-colors">
      <td className="py-4 px-2 font-semibold font-mono">{symbol}</td>
      <td className="py-4 px-2">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${type === 'Buy' ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'}`}>
          {type}
        </span>
      </td>
      <td className="py-4 px-2 text-muted-foreground">{lot.toFixed(2)}</td>
      <td className="py-4 px-2 text-muted-foreground">{open}</td>
      <td className={`py-4 px-2 font-bold font-mono ${isProfit ? 'text-accent' : 'text-destructive'}`}>
        {isProfit ? '+' : ''}{pnl.toFixed(2)}
      </td>
      <td className="py-4 px-2 text-right text-muted-foreground font-mono">{time}</td>
    </tr>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
