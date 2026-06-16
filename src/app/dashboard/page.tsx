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
  Skull 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { where, doc, limit, orderBy, onSnapshot, collection, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { NotificationBell } from '@/components/NotificationBell';
import { cn } from '@/lib/utils';

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
  const [linkCopied, setLinkCopied] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const [softBreachWarning, setSoftBreachWarning] = useState<string | null>(null);

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

  const referralConstraints = useMemo(() => [
    where('referrerId', '==', effectiveUid || 'none'),
    orderBy('createdAt', 'desc')
  ], [effectiveUid]);

  const { data: referrals } = useCollection<any>('referrals', referralConstraints);

  const refStats = useMemo(() => {
    const data = referrals || [];
    return {
      total: data.length,
      earned: data.reduce((acc: number, r: any) => acc + (r.amount || 0), 0)
    };
  }, [referrals]);

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

  const copyTraderId = () => {
    const idToCopy = userData?.uid || userData?.traderId;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied!", description: "Trader UID copied to clipboard." });
    }
  };

  const copyReferralLink = () => {
    if (!userData?.referralCode) return;
    const link = `${window.location.origin}/signup?ref=${userData.referralCode}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    toast({ title: "Link Copied!", description: "Referral link is ready to share." });
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            value={refStats.total.toString()} 
            icon={<Users className="text-emerald-500" />}
            footer="Signups via your code"
          />
          <MetricCard 
            title="Referral Earnings" 
            value={`$${refStats.earned.toFixed(2)}`} 
            icon={<DollarSign className="text-amber-500" />}
            footer="Withdrawable commission"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 border-border/50 shadow-xl shadow-primary/5 bg-card/40 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-headline text-white">Referral Terminal</CardTitle>
                <CardDescription>Share your link and earn up to 10% commission on purchases.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-3">Your Referral Link:</p>
                 <div className="flex items-center gap-2">
                   <div className="flex-1 font-mono text-sm font-bold p-3 bg-background/50 rounded-xl border border-border text-white truncate">
                     {window.location.origin}/signup?ref={userData?.referralCode || 'CODE'}
                   </div>
                   <Button onClick={copyReferralLink} className="h-12 w-12 rounded-xl cyan-box-glow cursor-pointer" size="icon">
                     {linkCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                   </Button>
                 </div>
              </div>
              <Button variant="outline" className="w-full font-bold h-12 border-primary/20 text-primary cursor-pointer" asChild>
                <Link href="/referral">View Detailed History <ExternalLink className="ml-2 w-4 h-4" /></Link>
              </Button>
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
      </main>
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
