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
import { 
  Eye, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, Award, Search, Loader2, Image as ImageIcon, Settings, Save, Megaphone, DollarSign, ChevronLeft, Gift, ExternalLink, Send, Wrench
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import DashboardPage from '@/app/dashboard/page';
import Image from 'next/image';
import { doc, setDoc, collection, onSnapshot, query, orderBy, limit, updateDoc, writeBatch, serverTimestamp, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useBrandSettings } from '@/hooks/use-brand-settings';
import { uploadImageAsBase64 } from '@/lib/imageUpload';
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
  const [adminData, setAdminData] = useState<any>({ users: [], orders: [], payouts: [], referrals: [], broadcasts: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();
  const branding = useBrandSettings();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyForm, setVerifyVerifyForm] = useState({ login: '', password: '', server: 'PrimeFunded-Live' });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isKycReviewOpen, setIsKycReviewOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [giftForm, setGiftForm] = useState({ plan: '1-Step Pro', size: '$100,000', login: '', password: '', server: 'PrimeFunded-Live', note: '' });

  const [brandingForm, setBrandingForm] = useState({ siteName: '', logoUrl: '', supportEmail: '' });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', target: 'all', type: 'info' });

  useEffect(() => {
    const isVerified = localStorage.getItem('adminVerified') === 'true';
    if (isVerified) setIsAuthenticated(true);
    else setShowAdminModal(true);
    const savedTab = localStorage.getItem('admin_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    if (branding) {
      setBrandingForm({ siteName: branding.siteName || '', logoUrl: branding.logoUrl || '', supportEmail: (branding as any).supportEmail || '' });
      setLogoPreview(branding.logoUrl || null);
    }
  }, [branding]);

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
    return () => unsubscribers.forEach(unsub => unsub());
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    if (!adminData) return null;
    const verifiedOrders = adminData.orders.filter((o: any) => o.status === 'verified');
    const totalRevenue = verifiedOrders.reduce((acc: number, o: any) => acc + (parseFloat(o.amountPaid) || 0), 0);
    const totalTraders = adminData.users.length;
    const verifiedCount = verifiedOrders.length;
    const pendingOrders = adminData.orders.filter((o: any) => o.status === 'pending').length;
    return { totalRevenue, totalTraders, verifiedCount, pendingOrders };
  }, [adminData]);

  const newestTraders = useMemo(() => adminData.users.slice(0, 4), [adminData.users]);
  const latestOrders = useMemo(() => adminData.orders.slice(0, 4), [adminData.orders]);

  const filteredUsers = useMemo(() => {
    const queryStr = searchTerm.toLowerCase();
    return adminData.users.filter((u: any) => u.name?.toLowerCase().includes(queryStr) || u.email?.toLowerCase().includes(queryStr) || u.uid?.toString().includes(searchTerm));
  }, [adminData.users, searchTerm]);

  const handleFixUids = async () => {
    setActionLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const updates: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.uid || data.uid.length !== 8) {
          const newUid = Math.floor(10000000 + Math.random() * 90000000).toString();
          updates.push(updateDoc(doc(db, 'users', docSnap.id), { uid: newUid, traderId: newUid, updatedAt: serverTimestamp() }));
        }
      });
      if (updates.length > 0) await Promise.all(updates);
      toast({ title: "✅ UIDs Synchronized" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Maintenance Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOrder = async () => {
    if (!selectedOrder || !verifyForm.login || !verifyForm.password) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), { status: 'verified', verifiedAt: serverTimestamp() });
      await updateDoc(doc(db, 'users', selectedOrder.userId), {
        mt5Login: verifyForm.login,
        mt5Password: verifyForm.password,
        mt5Server: verifyForm.server,
        accountPlan: selectedOrder.plan,
        accountSize: selectedOrder.accountSize,
        accountStatus: "active",
        activatedAt: serverTimestamp()
      });
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
      await updateDoc(doc(db, 'users', selectedUser.id), {
        accountPlan: giftForm.plan,
        accountSize: giftForm.size,
        accountStatus: "active",
        mt5Login: giftForm.login,
        mt5Password: giftForm.password,
        mt5Server: giftForm.server,
        isGifted: true,
        activatedAt: serverTimestamp()
      });
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
                <StatCard title="Verified Challenges" value={stats.verifiedCount} icon={<Award />} color="green" />
                <StatCard title="Pending Payments" value={stats.pendingOrders} icon={<ShoppingCart />} color="amber" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-card/30 border-border/50">
                  <CardHeader><CardTitle className="text-lg">Newest Traders</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                      {newestTraders.map((u: any) => (
                        <div key={u.id} className="p-4 flex items-center justify-between hover:bg-primary/5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px]">{u.name?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                            <div><p className="text-sm font-bold text-white">{u.name}</p><p className="text-[10px] text-muted-foreground">UID: {u.uid}</p></div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setPreviewUserId(u.id)}><Eye className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/30 border-border/50">
                  <CardHeader><CardTitle className="text-lg">Latest Orders</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                      {latestOrders.map((o: any) => (
                        <div key={o.id} className="p-4 flex items-center justify-between hover:bg-primary/5">
                          <div><p className="text-sm font-bold text-white">{o.plan} - {o.accountSize}</p><p className="text-[10px] text-muted-foreground">{o.email}</p></div>
                          <Badge variant="outline" className={o.status === 'verified' ? "text-emerald-500 border-emerald-500/50" : "text-amber-500 border-amber-500/50"}>{o.status}</Badge>
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
              <div className="flex justify-between items-center"><h3 className="text-xl font-bold text-white">Trader Directory</h3><Button variant="outline" size="sm" onClick={handleFixUids} disabled={actionLoading}>{actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wrench className="w-4 h-4 mr-2" />} Fix UIDs</Button></div>
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
                              <Button variant="ghost" size="sm" className="hover:bg-amber-500/10" onClick={() => { setSelectedUser(u); setIsGiftModalOpen(true); }}><Gift className="w-4 h-4 text-amber-500" /></Button>
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

          {activeTab === 'order_journal' && (
            <Card className="bg-card/30 border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black">
                      <tr><th className="py-4 px-6">Trader</th><th className="py-4 px-6">Plan / Size</th><th className="py-4 px-6">Amount</th><th className="py-4 px-6">TX Hash</th><th className="py-4 px-6">Status</th><th className="py-4 px-6 text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {adminData.orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-primary/5">
                          <td className="py-4 px-6"><div className="font-bold text-white">{o.userName}</div><div className="text-[10px] text-muted-foreground">{o.email}</div></td>
                          <td className="py-4 px-6"><div className="text-white">{o.plan}</div><div className="text-[10px] text-muted-foreground">{o.accountSize}</div></td>
                          <td className="py-4 px-6"><div className="text-white font-bold">${o.amountPaid}</div><Badge variant="outline" className="text-[8px]">{o.network}</Badge></td>
                          <td className="py-4 px-6 font-mono text-[10px] text-muted-foreground max-w-[120px] truncate">{o.txHash}</td>
                          <td className="py-4 px-6"><Badge className={o.status === 'verified' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>{o.status}</Badge></td>
                          <td className="py-4 px-6 text-right flex justify-end gap-2">
                             {o.paymentScreenshot && <Button size="sm" variant="outline" onClick={() => { setSelectedOrder(o); setIsProofModalOpen(true); }}>Proof</Button>}
                             {o.status === 'pending' && <Button size="sm" className="bg-emerald-600" onClick={() => { setSelectedOrder(o); setIsVerifyModalOpen(true); }}>Verify</Button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other tabs follow same pattern... */}
        </div>
      </main>

      {/* Verification Modal */}
      <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
        <DialogContent className="bg-card border-emerald-500/20">
          <DialogHeader><DialogTitle className="text-emerald-500">Verify Order & Assign MT5</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>MT5 Login ID</Label><Input value={verifyForm.login} onChange={e => setVerifyVerifyForm({...verifyForm, login: e.target.value})} /></div>
                <div className="space-y-2"><Label>Password</Label><Input value={verifyForm.password} onChange={e => setVerifyVerifyForm({...verifyForm, password: e.target.value})} /></div>
             </div>
             <div className="space-y-2"><Label>MT5 Server</Label><Input value={verifyForm.server} onChange={e => setVerifyVerifyForm({...verifyForm, server: e.target.value})} /></div>
          </div>
          <DialogFooter className="mt-6"><Button variant="ghost" onClick={() => setIsVerifyModalOpen(false)}>Cancel</Button><Button className="bg-emerald-600" onClick={handleVerifyOrder} disabled={actionLoading}>Activate Account</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Modal */}
      <Dialog open={isGiftModalOpen} onOpenChange={setIsGiftModalOpen}>
        <DialogContent className="bg-card border-amber-500/20">
          <DialogHeader><DialogTitle className="text-amber-500">🎁 Gift Account: {selectedUser?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Plan</Label><Select value={giftForm.plan} onValueChange={v => setGiftForm({...giftForm, plan: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1-Step Pro">1-Step Pro</SelectItem><SelectItem value="2-Step Classic">2-Step Classic</SelectItem><SelectItem value="Instant Funding">Instant Funding</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Size</Label><Select value={giftForm.size} onValueChange={v => setGiftForm({...giftForm, size: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['$5,000', '$10,000', '$25,000', '$50,000', '$100,000', '$200,000'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>MT5 Login</Label><Input value={giftForm.login} onChange={e => setGiftForm({...giftForm, login: e.target.value})} /></div>
                <div className="space-y-2"><Label>Password</Label><Input value={giftForm.password} onChange={e => setGiftForm({...giftForm, password: e.target.value})} /></div>
             </div>
          </div>
          <DialogFooter className="mt-6"><Button variant="ghost" onClick={() => setIsGiftModalOpen(false)}>Cancel</Button><Button className="bg-amber-500 text-black font-bold" onClick={handleGiftAccount} disabled={actionLoading}>Gift Account</Button></DialogFooter>
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