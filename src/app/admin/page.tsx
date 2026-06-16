"use client";

import { useState, useMemo, useEffect, memo } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, Users, ShoppingCart, Wallet, Activity, Search, Loader2, DollarSign, ChevronLeft, Gift, Skull, AlertTriangle, CheckCircle2, ShieldEllipsis, Trophy, Landmark
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import DashboardPage from '@/app/dashboard/page';
import { doc, setDoc, collection, onSnapshot, query, orderBy, limit, updateDoc, serverTimestamp, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useBrandSettings } from '@/hooks/use-brand-settings';
import { useAuth } from '@/context/AuthContext';

const StatCard = memo(function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  const colors: any = {
    blue: 'text-primary bg-primary/10 border-primary/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    green: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  };
  return (
    <Card className="border-border/50 bg-card/30 hover:border-primary/20 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-lg border", colors[color])}>{icon}</div>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-white/10">LIVE</Badge>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
        <h3 className="text-3xl font-headline font-bold text-white group-hover:text-primary transition-colors">{value}</h3>
      </CardContent>
    </Card>
  );
});

export default function AdminPage() {
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const [adminData, setAdminData] = useState<any>({ users: [], orders: [], payouts: [], referrals: [], broadcasts: [], breaches: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const branding = useBrandSettings();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyForm, setVerifyVerifyForm] = useState({ login: '', password: '', server: 'MetaQuotes-Demo' });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isKycReviewOpen, setIsKycReviewOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isBreachModalOpen, setIsBreachModalOpen] = useState(false);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [giftForm, setGiftForm] = useState({ plan: '1-Step Pro', size: '$100,000', login: '', password: '', server: 'MetaQuotes-Demo', note: '' });
  const [breachForm, setBreachForm] = useState({ reason: 'Daily Drawdown Exceeded', note: '' });
  const [phaseForm, setPhaseForm] = useState({ 
    newPhase: 'evaluation', 
    assignNewAccount: true,
    login: '',
    password: '',
    server: 'MetaQuotes-Demo'
  });

  useEffect(() => {
    const isVerified = localStorage.getItem('adminVerified') === 'true';
    if (isVerified) setIsAuthenticated(true);
    else setShowAdminModal(true);
    const savedTab = localStorage.getItem('admin_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const masterKey = "93463962569392846256";
    if (adminPasswordInput === masterKey) {
      setIsAuthenticated(true);
      setShowAdminModal(false);
      localStorage.setItem('adminVerified', 'true');
      toast({ title: "Admin Access Granted" });
    } else {
      setAdminError("❌ Access Denied");
      setAdminPasswordInput('');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribers: (() => void)[] = [];
    const setupListener = (collName: string, setterKey: string, orderByField?: string) => {
      const collRef = collection(db, collName);
      const q = orderByField ? query(collRef, orderBy(orderByField, 'desc'), limit(500)) : query(collRef, limit(500));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAdminData((prev: any) => ({ ...prev, [setterKey]: data }));
        setIsLoading(false);
      });
      unsubscribers.push(unsub);
    };
    setupListener('users', 'users', 'createdAt');
    setupListener('orders', 'orders', 'submittedAt');
    setupListener('payouts', 'payouts', 'date');
    setupListener('referrals', 'referrals', 'createdAt');
    setupListener('broadcasts', 'broadcasts', 'sentAt');
    setupListener('breaches', 'breaches', 'breachedAt');
    return () => unsubscribers.forEach(unsub => unsub());
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    if (!adminData) return null;
    const verifiedOrders = adminData.orders.filter((o: any) => o.status === 'verified');
    const totalRevenue = verifiedOrders.reduce((acc: number, o: any) => acc + (parseFloat(o.amountPaid) || 0), 0);
    const totalTraders = adminData.users.length;
    
    const giftedCount = adminData.users.filter((u: any) => u.isGifted === true).length;
    const verifiedCount = verifiedOrders.length + giftedCount;
    
    const pendingOrders = adminData.orders.filter((o: any) => o.status === 'pending').length;
    return { totalRevenue, totalTraders, verifiedCount, pendingOrders };
  }, [adminData]);

  const filteredUsers = useMemo(() => {
    const queryStr = searchTerm.toLowerCase();
    return adminData.users.filter((u: any) => u.name?.toLowerCase().includes(queryStr) || u.email?.toLowerCase().includes(queryStr) || u.uid?.toString().includes(searchTerm));
  }, [adminData.users, searchTerm]);

  const handleVerifyOrder = async () => {
    if (!selectedOrder || !verifyForm.login || !verifyForm.password) return;
    setActionLoading(true);
    try {
      const balanceValue = parseFloat(selectedOrder.accountSize?.replace(/[$,]/g, '') || '100000');
      
      await updateDoc(doc(db, 'orders', selectedOrder.id), { status: 'verified', verifiedAt: serverTimestamp() });
      await updateDoc(doc(db, 'users', selectedOrder.userId), {
        mt5Login: verifyForm.login,
        mt5Password: verifyForm.password,
        mt5Server: verifyForm.server,
        accountPlan: selectedOrder.plan,
        accountSize: selectedOrder.accountSize,
        accountBalance: balanceValue,
        accountActive: true,
        accountStatus: "active",
        currentPhase: "evaluation",
        activatedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'mt5_accounts', verifyForm.login), {
        userId: selectedOrder.userId,
        login: verifyForm.login,
        balance: balanceValue,
        equity: balanceValue,
        status: 'active',
        planType: selectedOrder.plan,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, 'users', selectedOrder.userId, 'notifications'), {
        title: "✅ Account Activated",
        message: `Your ${selectedOrder.accountSize} account is ready! Check Credentials tab.`,
        type: 'challenge_passed',
        isRead: false,
        createdAt: serverTimestamp()
      });
      toast({ title: "Order Verified", description: "Credentials provisioned." });
      setIsVerifyModalOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Verification Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGiftAccount = async () => {
    if (!selectedUser || !giftForm.login || !giftForm.password) return;
    setActionLoading(true);
    try {
      const balanceValue = parseFloat(giftForm.size.replace(/[$,]/g, '') || '100000');

      await updateDoc(doc(db, 'users', selectedUser.id), {
        accountPlan: giftForm.plan,
        accountSize: giftForm.size,
        accountBalance: balanceValue,
        accountActive: true,
        accountStatus: "active",
        currentPhase: "evaluation",
        mt5Login: giftForm.login,
        mt5Password: giftForm.password,
        mt5Server: giftForm.server,
        isGifted: true,
        activatedAt: serverTimestamp()
      });

      await setDoc(doc(db, 'mt5_accounts', giftForm.login), {
        userId: selectedUser.id,
        login: giftForm.login,
        balance: balanceValue,
        equity: balanceValue,
        status: 'active',
        planType: giftForm.plan,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await addDoc(collection(db, 'users', selectedUser.id, 'notifications'), {
        title: "🎁 Account Gifted",
        message: `An institutional ${giftForm.size} account has been provisioned to your profile.`,
        type: 'challenge_passed',
        isRead: false,
        createdAt: serverTimestamp()
      });
      toast({ title: "🎁 Account gifted successfully!" });
      setIsGiftModalOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Gift Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualBreach = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        accountStatus: 'breached',
        accountActive: false,
        breachType: 'hard',
        breachReason: breachForm.reason,
        breachedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'breaches'), {
        userId: selectedUser.id,
        userEmail: selectedUser.email,
        userName: selectedUser.name,
        plan: selectedUser.accountPlan || 'Unknown',
        breachType: 'hard',
        breachReason: `${breachForm.reason}: ${breachForm.note}`,
        breachedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'notifications'), {
        title: "🚨 Account Terminated",
        message: `Your account has been breached: ${breachForm.reason}. ${breachForm.note}`,
        type: 'hard_breach',
        isRead: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Account Terminated", description: "Breach logged successfully." });
      setIsBreachModalOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Breach Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdvancePhase = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const updates: any = {
        currentPhase: phaseForm.newPhase,
        updatedAt: serverTimestamp()
      };

      if (phaseForm.assignNewAccount) {
        // Archive current credentials if they exist
        if (selectedUser.mt5Login) {
          await addDoc(collection(db, 'users', selectedUser.id, 'previousAccounts'), {
            login: selectedUser.mt5Login,
            password: selectedUser.mt5Password,
            server: selectedUser.mt5Server,
            phase: selectedUser.currentPhase || 'evaluation',
            retiredAt: serverTimestamp(),
            status: 'retired'
          });
        }

        updates.mt5Login = phaseForm.login;
        updates.mt5Password = phaseForm.password;
        updates.mt5Server = phaseForm.server;
      }

      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, updates);

      await addDoc(collection(db, 'users', selectedUser.id, 'phaseHistory'), {
        phase: phaseForm.newPhase,
        accountSize: selectedUser.accountSize,
        mt5Login: phaseForm.assignNewAccount ? phaseForm.login : (selectedUser.mt5Login || 'N/A'),
        advancedAt: serverTimestamp(),
        advancedBy: "admin"
      });

      const message = phaseForm.assignNewAccount 
        ? `🎉 You advanced to the ${phaseForm.newPhase} stage! New MT5 credentials have been issued. Your previous account is now inactive.`
        : `🎉 Congratulations! You have been moved to the ${phaseForm.newPhase} phase. Check your dashboard for updates.`;

      await addDoc(collection(db, 'users', selectedUser.id, 'notifications'), {
        title: "🎉 Stage Advanced!",
        message,
        type: 'challenge_passed',
        isRead: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Phase Advanced", description: `${selectedUser.name} is now in ${phaseForm.newPhase}.` });
      setIsPhaseModalOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const getAvailablePhases = (plan?: string) => {
    const p = plan?.toLowerCase() || '';
    if (p.includes('1-step')) return ['evaluation', 'funded'];
    if (p.includes('2-step')) return ['phase1', 'phase2', 'funded'];
    if (p.includes('3-step')) return ['phase1', 'phase2', 'phase3', 'funded'];
    return ['funded'];
  };

  if (previewUserId) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed top-0 left-0 w-full z-[100] bg-primary h-14 flex items-center justify-between px-6 shadow-xl">
          <span className="text-xs font-black uppercase text-primary-foreground">Previewing Trader: {previewUserId}</span>
          <Button variant="secondary" size="sm" onClick={() => setPreviewUserId(null)}><ChevronLeft className="w-3 h-3 mr-1" /> Exit Preview</Button>
        </div>
        <div className="pt-14"><DashboardPage adminViewMode={true} targetUid={previewUserId} /></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden relative">
      <Navigation />
      <main className="flex-1 flex flex-col min-h-0">
        <div className="p-8 pb-4 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold mb-1 text-white">Administrative Terminal</h1>
              <p className="text-muted-foreground text-sm">Monitor performance and manage institutional capital deployment.</p>
            </div>
            <div className="relative md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search trader..." className="pl-10 bg-secondary/50" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={val => { setActiveTab(val); localStorage.setItem('admin_active_tab', val); }}>
            <TabsList className="bg-secondary/50 h-12 w-full justify-start overflow-x-auto no-scrollbar">
              <TabsTrigger value="overview" className="font-bold">Overview</TabsTrigger>
              <TabsTrigger value="user_directory" className="font-bold">User Directory</TabsTrigger>
              <TabsTrigger value="order_journal" className="font-bold">Order Journal</TabsTrigger>
              <TabsTrigger value="kyc" className="font-bold">KYC Hub</TabsTrigger>
              <TabsTrigger value="breaches" className="font-bold">Breaches</TabsTrigger>
              <TabsTrigger value="referrals" className="font-bold">Referrals</TabsTrigger>
              <TabsTrigger value="payouts" className="font-bold">Payouts</TabsTrigger>
              <TabsTrigger value="broadcast" className="font-bold">Broadcast</TabsTrigger>
              <TabsTrigger value="branding" className="font-bold">Branding</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign />} color="blue" />
                <StatCard title="Total Traders" value={stats.totalTraders} icon={<Users />} color="purple" />
                <StatCard title="Verified Challenges" value={stats.verifiedCount} icon={<Landmark />} color="green" />
                <StatCard title="Pending Payments" value={stats.pendingOrders} icon={<ShoppingCart />} color="amber" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card className="bg-card/30 border-border/50">
                    <CardHeader><CardTitle className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Newest Traders</CardTitle></CardHeader>
                    <CardContent className="p-0">
                       <div className="divide-y divide-border/30">
                          {adminData.users.slice(0, 4).map((u: any) => (
                             <div key={u.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                   <Avatar className="h-10 w-10 border border-white/10"><AvatarFallback>{u.name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                   <div><p className="font-bold text-white text-sm">{u.name}</p><p className="text-[10px] text-muted-foreground uppercase">{u.country || 'International'}</p></div>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">{u.tier || 'BRONZE'} TIER</p>
                                   <p className="text-[10px] text-muted-foreground">{u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'Today'}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="bg-card/30 border-border/50">
                    <CardHeader><CardTitle className="text-lg font-bold text-white flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-primary" /> Latest Orders</CardTitle></CardHeader>
                    <CardContent className="p-0">
                       <div className="divide-y divide-border/30">
                          {adminData.orders.slice(0, 4).map((o: any) => (
                             <div key={o.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div><p className="font-bold text-white text-sm">{o.accountSize} {o.plan}</p><p className="text-[10px] text-muted-foreground">{o.userName || o.email}</p></div>
                                <div className="text-right">
                                   <Badge variant={o.status === 'verified' ? 'default' : 'secondary'} className="text-[9px] font-black uppercase mb-1">{o.status}</Badge>
                                   <p className="text-[10px] font-mono text-muted-foreground">${o.amountPaid || '0.00'}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </CardContent>
                 </Card>
              </div>
            </div>
          )}

          {activeTab === 'user_directory' && (
            <div className="space-y-6">
              <Card className="bg-card/30 border-border/50">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black">
                        <tr><th className="py-4 px-6">Trader Name</th><th className="py-4 px-6">Email / Phone</th><th className="py-4 px-6">Referral Code</th><th className="py-4 px-6 text-right">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredUsers.map((u: any) => (
                          <tr key={u.id} className="hover:bg-primary/5">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10"><AvatarFallback>{u.name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                <div><div className="font-bold text-white">{u.name}</div><div className="text-[10px] text-muted-foreground font-mono">UID: {u.uid || '--------'}</div></div>
                              </div>
                            </td>
                            <td className="py-4 px-6"><div className="text-white">{u.email}</div><div className="text-xs text-muted-foreground">{u.phone || 'N/A'}</div></td>
                            <td className="py-4 px-6"><Badge variant="outline" className="border-primary/30 text-primary uppercase font-mono">{u.referralCode || 'NONE'}</Badge></td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <Button variant="ghost" size="sm" className="hover:bg-blue-500/10" onClick={() => { setSelectedUser(u); setPhaseForm({ ...phaseForm, newPhase: u.currentPhase || 'evaluation' }); setIsPhaseModalOpen(true); }} title="Manage Phase"><ShieldEllipsis className="w-4 h-4 text-blue-500" /></Button>
                              <Button variant="ghost" size="sm" className="hover:bg-amber-500/10" onClick={() => { setSelectedUser(u); setIsGiftModalOpen(true); }} title="Gift Account"><Gift className="w-4 h-4 text-amber-500" /></Button>
                              <Button variant="ghost" size="sm" className="hover:bg-destructive/10" onClick={() => { setSelectedUser(u); setIsBreachModalOpen(true); }} title="Breach Account"><Skull className="w-4 h-4 text-destructive" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setPreviewUserId(u.id)}><Eye className="w-4 h-4" /></Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'breaches' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <Card className="bg-destructive/5 border-destructive/20 h-fit">
                  <CardHeader><CardTitle className="text-destructive flex items-center gap-2">🔴 HARD BREACH - Account Terminated</CardTitle></CardHeader>
                  <CardContent className="p-0">
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-destructive/10 text-destructive uppercase text-[10px] font-black"><tr><th className="py-3 px-4">Trader</th><th className="py-3 px-4">Reason</th><th className="py-3 px-4 text-right">Date</th></tr></thead>
                           <tbody className="divide-y divide-white/5">
                              {adminData.breaches.filter((b: any) => b.breachType === 'hard').map((b: any) => (
                                 <tr key={b.id} className="hover:bg-destructive/5">
                                    <td className="py-3 px-4 font-bold text-white">{b.userName || b.userEmail}</td>
                                    <td className="py-3 px-4 text-xs text-muted-foreground">{b.breachReason}</td>
                                    <td className="py-3 px-4 text-right text-[10px] text-muted-foreground">{b.breachedAt?.seconds ? new Date(b.breachedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                        {adminData.breaches.filter((b: any) => b.breachType === 'hard').length === 0 && <div className="p-10 text-center text-muted-foreground italic text-xs">No hard breaches logged.</div>}
                     </div>
                  </CardContent>
               </Card>

               <Card className="bg-amber-500/5 border-amber-500/20 h-fit">
                  <CardHeader><CardTitle className="text-amber-500 flex items-center gap-2">🟡 SOFT BREACH - Performance Warning</CardTitle></CardHeader>
                  <CardContent className="p-0">
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-amber-500/10 text-amber-500 uppercase text-[10px] font-black"><tr><th className="py-3 px-4">Trader</th><th className="py-3 px-4">Reason</th><th className="py-3 px-4 text-right">Date</th></tr></thead>
                           <tbody className="divide-y divide-white/5">
                              {adminData.breaches.filter((b: any) => b.breachType === 'soft').map((b: any) => (
                                 <tr key={b.id} className="hover:bg-amber-500/5">
                                    <td className="py-3 px-4 font-bold text-white">{b.userName || b.userEmail}</td>
                                    <td className="py-3 px-4 text-xs text-muted-foreground">{b.breachReason}</td>
                                    <td className="py-3 px-4 text-right text-[10px] text-muted-foreground">{b.breachedAt?.seconds ? new Date(b.breachedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                        {adminData.breaches.filter((b: any) => b.breachType === 'soft').length === 0 && <div className="p-10 text-center text-muted-foreground italic text-xs">No soft warnings issued.</div>}
                     </div>
                  </CardContent>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* Phase Advancement Modal */}
      <Dialog open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
        <DialogContent className="bg-card border-blue-500/20">
          <DialogHeader>
            <DialogTitle className="text-blue-500 flex items-center gap-2">
              <Trophy className="w-5 h-5" /> Manage {selectedUser?.name}'s Phase
            </DialogTitle>
            <DialogDescription>Advance or regression of evaluation stages.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-xl border border-border">
              <div><Label className="text-[10px] uppercase text-muted-foreground">Current Plan</Label><p className="text-sm font-bold text-white">{selectedUser?.accountPlan || 'N/A'}</p></div>
              <div><Label className="text-[10px] uppercase text-muted-foreground">Current Phase</Label><p className="text-sm font-bold text-white uppercase">{selectedUser?.currentPhase || 'evaluation'}</p></div>
            </div>

            <div className="space-y-2">
              <Label>Move to Phase</Label>
              <Select value={phaseForm.newPhase} onValueChange={v => setPhaseForm({...phaseForm, newPhase: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {getAvailablePhases(selectedUser?.accountPlan).map(p => (
                    <SelectItem key={p} value={p} className="uppercase">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Checkbox 
                id="assignNew" 
                checked={phaseForm.assignNewAccount} 
                onCheckedChange={(checked) => setPhaseForm({...phaseForm, assignNewAccount: !!checked})} 
              />
              <Label htmlFor="assignNew" className="text-xs">Assign new MT5 account for this phase</Label>
            </div>

            {phaseForm.assignNewAccount && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>New Login</Label><Input value={phaseForm.login} onChange={e => setPhaseForm({...phaseForm, login: e.target.value})} /></div>
                  <div className="space-y-2"><Label>New Password</Label><Input value={phaseForm.password} onChange={e => setPhaseForm({...phaseForm, password: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>Server</Label><Input value={phaseForm.server} onChange={e => setPhaseForm({...phaseForm, server: e.target.value})} /></div>
              </motion.div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setIsPhaseModalOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleAdvancePhase} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Account Phase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Modal */}
      <Dialog open={isGiftModalOpen} onOpenChange={setIsGiftModalOpen}>
        <DialogContent className="bg-card border-amber-500/20">
          <DialogHeader><DialogTitle className="text-amber-500">🎁 Gift Account: {selectedUser?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Plan</Label><Select value={giftForm.plan} onValueChange={v => setGiftForm({...giftForm, plan: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1-Step Pro">1-Step Pro</SelectItem><SelectItem value="2-Step Classic">2-Step Classic</SelectItem><SelectItem value="3-Step Classic">3-Step Classic</SelectItem><SelectItem value="Instant Funding">Instant Funding</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Size</Label><Select value={giftForm.size} onValueChange={v => setGiftForm({...giftForm, size: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['$5,000', '$10,000', '$25,000', '$50,000', '$100,000', '$200,000', '$300,000'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>MT5 Login</Label><Input value={giftForm.login} onChange={e => setGiftForm({...giftForm, login: e.target.value})} /></div>
                <div className="space-y-2"><Label>Password</Label><Input value={giftForm.password} onChange={e => setGiftForm({...giftForm, password: e.target.value})} /></div>
             </div>
             <div className="space-y-2"><Label>MT5 Server</Label><Input value={giftForm.server} onChange={e => setGiftForm({...giftForm, server: e.target.value})} /></div>
          </div>
          <DialogFooter className="mt-6"><Button variant="ghost" onClick={() => setIsGiftModalOpen(false)}>Cancel</Button><Button className="bg-amber-500 text-black font-bold" onClick={handleGiftAccount} disabled={actionLoading}>Gift Account</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Breach Modal */}
      <Dialog open={isBreachModalOpen} onOpenChange={setIsBreachModalOpen}>
        <DialogContent className="bg-card border-destructive/20">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Skull className="w-5 h-5" /> Manually breach {selectedUser?.name}'s account?
            </DialogTitle>
            <DialogDescription>This will immediately terminate the account and revoke MT5 credentials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Primary Reason</Label>
              <Select value={breachForm.reason} onValueChange={v => setBreachForm({...breachForm, reason: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily Drawdown Exceeded">Daily Drawdown Exceeded</SelectItem>
                  <SelectItem value="Max Drawdown Exceeded">Max Drawdown Exceeded</SelectItem>
                  <SelectItem value="Martingale Detected">Martingale Detected</SelectItem>
                  <SelectItem value="Rule Violation">Rule Violation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Custom Note / Evidence</Label>
              <Textarea 
                placeholder="Details of the violation..." 
                value={breachForm.note} 
                onChange={e => setBreachForm({...breachForm, note: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="ghost" onClick={() => setIsBreachModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="font-bold" onClick={handleManualBreach} disabled={actionLoading}>Confirm Hard Breach</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Login Modal */}
      <Dialog open={showAdminModal} onOpenChange={() => {}}>
        <DialogContent className="bg-[#0a0f1e] border-[#00d4ff] text-white sm:max-w-[400px]">
          <DialogHeader className="text-center"><DialogTitle className="text-2xl font-bold text-[#00d4ff]">🔐 Admin Login</DialogTitle></DialogHeader>
          <form onSubmit={handleAdminAuth} className="space-y-6 pt-4">
            <div className="space-y-2"><Label className="text-[10px] font-bold uppercase tracking-widest text-[#00d4ff]">Security Protocol</Label><Input type="password" value={adminPasswordInput} onChange={e => setAdminPasswordInput(e.target.value)} className="bg-background/50 border-white/10 text-center font-mono" autoFocus />{adminError && <p className="text-[10px] text-destructive text-center">{adminError}</p>}</div>
            <Button type="submit" className="w-full bg-[#00d4ff] text-[#0a0f1e] font-bold">Unlock Terminal</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
