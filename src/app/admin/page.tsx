
"use client";

import { useState, useMemo, useEffect, memo, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, Shield, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, Award, Search, RefreshCw, Copy, Loader2, Image as ImageIcon, Settings, Upload, Save, Instagram, Phone, SearchX, Megaphone, DollarSign, Lock, ChevronLeft, LayoutDashboard, XCircle, CheckCircle2, Clock, ShieldCheck, AlertTriangle, Gift, FileImage, ExternalLink, Skull, Flame, Mail, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import DashboardPage from '@/app/dashboard/page';
import Image from 'next/image';
import { doc, setDoc, collection, getDocs, query, orderBy, limit, where, updateDoc, writeBatch, serverTimestamp, addDoc, deleteDoc, getDoc } from 'firebase/firestore';
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
    red: 'text-destructive bg-destructive/10 border-destructive/20'
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
  const { user, loading: authLoading } = useAuth();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  
  const [adminData, setAdminData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { toast } = useToast();
  const branding = useBrandSettings();

  // Dialog States
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyForm, setVerifyVerifyForm] = useState({
    login: '',
    password: '',
    server: 'PrimeFunded-Live',
    note: ''
  });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isKycReviewOpen, setIsKycReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftForm, setGiftForm] = useState({
    plan: '1-Step Pro',
    size: '$100,000',
    login: '',
    password: '',
    server: 'PrimeFunded-Live',
    note: ''
  });

  const [isBreachModalOpen, setIsBreachModalOpen] = useState(false);
  const [breachReasonInput, setBreachReasonInput] = useState('');

  // Branding States
  const [brandingForm, setBrandingForm] = useState({
    siteName: '',
    logoUrl: '',
    supportEmail: '',
    discordUrl: '',
    instagramUrl: '',
    telegramUrl: '',
    whatsappUrl: ''
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Broadcast States
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    message: '',
    target: 'all',
    type: 'info'
  });

  useEffect(() => {
    const isVerified = localStorage.getItem('adminVerified') === 'true';
    if (isVerified) {
      setIsAuthenticated(true);
    } else {
      setShowAdminModal(true);
    }
    
    const savedTab = localStorage.getItem('admin_active_tab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    if (branding) {
      setBrandingForm({
        siteName: branding.siteName || '',
        logoUrl: branding.logoUrl || '',
        supportEmail: (branding as any).supportEmail || '',
        discordUrl: branding.discordUrl || '',
        instagramUrl: branding.instagramUrl || '',
        telegramUrl: branding.telegramUrl || '',
        whatsappUrl: branding.whatsappUrl || ''
      });
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
      toast({ variant: "destructive", title: "Access Denied" });
    }
  };

  const loadData = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const fetchCollectionData = async (collName: string, orderByField?: string) => {
        const collRef = collection(db, collName);
        let q;
        if (orderByField) {
          q = query(collRef, orderBy(orderByField, 'desc'), limit(150));
        } else {
          q = query(collRef, limit(150));
        }
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          submittedAt: doc.data().submittedAt?.toDate?.()?.toISOString() || doc.data().submittedAt,
          sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
          date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
          kycSubmittedAt: doc.data().kycSubmittedAt?.toDate?.()?.toISOString() || doc.data().kycSubmittedAt,
          lastCodeChange: doc.data().lastCodeChange?.toDate?.()?.toISOString() || doc.data().lastCodeChange,
          breachedAt: doc.data().breachedAt?.toDate?.()?.toISOString() || doc.data().breachedAt,
        }));
      };

      const [users, orders, payouts, referrals, broadcasts, breaches] = await Promise.all([
        fetchCollectionData('users'),
        fetchCollectionData('orders', 'submittedAt'),
        fetchCollectionData('payouts', 'date'),
        fetchCollectionData('referrals', 'createdAt'),
        fetchCollectionData('broadcasts', 'sentAt'),
        fetchCollectionData('breaches', 'breachedAt'),
      ]);

      setAdminData({
        users,
        orders,
        payouts,
        referrals,
        broadcasts,
        breaches,
        success: true
      });
    } catch (error: any) {
      console.error('[Admin-Sync] Failed:', error);
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    localStorage.setItem('admin_active_tab', val);
  };

  const filteredUsers = useMemo(() => {
    if (!adminData?.users) return [];
    const queryStr = searchTerm.toLowerCase();
    return adminData.users.filter((u: any) => 
      u.name?.toLowerCase().includes(queryStr) ||
      u.email?.toLowerCase().includes(queryStr) ||
      u.uid?.toString().includes(searchTerm)
    );
  }, [adminData?.users, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!adminData?.orders) return [];
    const queryStr = searchTerm.toLowerCase();
    return adminData.orders.filter((o: any) => 
      o.userName?.toLowerCase().includes(queryStr) ||
      o.email?.toLowerCase().includes(queryStr) ||
      o.txHash?.toLowerCase().includes(queryStr)
    );
  }, [adminData?.orders, searchTerm]);

  const stats = useMemo(() => {
    if (!adminData) return null;
    const verifiedOrders = adminData.orders.filter((o: any) => o.status === 'verified');
    const totalRevenue = verifiedOrders.reduce((acc: number, o: any) => acc + (parseFloat(o.amountPaid) || 0), 0);
    const pendingOrders = adminData.orders.filter((o: any) => o.status === 'pending').length;
    const pendingKyc = adminData.users.filter((u: any) => u.kycStatus === 'pending').length;
    const pendingPayouts = adminData.payouts.filter((p: any) => p.status === 'pending').length;

    return { totalRevenue, totalTraders: adminData.users.length, pendingOrders, pendingKyc, pendingPayouts };
  }, [adminData]);

  // ACTION HANDLERS
  const handleVerifyOrder = async () => {
    if (!selectedOrder || !verifyForm.login || !verifyForm.password) return;
    setActionLoading(true);
    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      await updateDoc(orderRef, { status: 'verified', verifiedAt: serverTimestamp() });

      const userRef = doc(db, 'users', selectedOrder.userId);
      await updateDoc(userRef, {
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
        message: `Your ${selectedOrder.accountSize} ${selectedOrder.plan} account is ready! Credentials sent to your terminal.`,
        type: 'challenge_passed',
        isRead: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Order Verified", description: "MT5 credentials assigned." });
      setIsVerifyModalOpen(false);
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Verification Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleKycAction = async (action: 'verified' | 'rejected') => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        kycStatus: action,
        kycVerified: action === 'verified',
        kycRejectionReason: action === 'rejected' ? rejectionReason : null
      });

      await addDoc(collection(db, 'users', selectedUser.id, 'notifications'), {
        title: action === 'verified' ? "🛡️ KYC Approved" : "❌ KYC Rejected",
        message: action === 'verified' ? "Identity verified. Withdrawals unlocked." : `KYC rejected: ${rejectionReason}`,
        type: action === 'verified' ? 'kyc_approved' : 'kyc_rejected',
        isRead: false,
        createdAt: serverTimestamp()
      });

      toast({ title: `KYC ${action}` });
      setIsKycReviewOpen(false);
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (payoutId: string) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'payouts', payoutId), { status: 'paid', paidAt: serverTimestamp() });
      toast({ title: "Payout Processed" });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    setActionLoading(true);
    try {
      const brandingRef = doc(db, 'settings', 'branding');
      await setDoc(brandingRef, brandingForm, { merge: true });
      toast({ title: "Settings Saved", description: "Global branding updated." });
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await uploadImageAsBase64(file);
        setLogoPreview(base64);
        setBrandingForm({ ...brandingForm, logoUrl: base64 });
        toast({ title: "Logo Uploaded", description: "Preview generated." });
      } catch (err: any) {
        toast({ variant: "destructive", title: "Upload Failed", description: err.message });
      }
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastForm.title || !broadcastForm.message) return;
    setActionLoading(true);
    try {
      const broadcastData = {
        ...broadcastForm,
        sentAt: serverTimestamp(),
        sender: user?.email
      };
      await addDoc(collection(db, 'broadcasts'), broadcastData);

      // Simple client-side loop for broadcast
      const userSnap = await getDocs(collection(db, 'users'));
      const batch = writeBatch(db);
      userSnap.docs.forEach((uDoc) => {
        const notifRef = doc(collection(db, 'users', uDoc.id, 'notifications'));
        batch.set(notifRef, {
          title: broadcastForm.title,
          message: broadcastForm.message,
          type: broadcastForm.type === 'info' ? 'system_msg' : broadcastForm.type === 'warning' ? 'soft_breach_warning' : 'referral_earned',
          isRead: false,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();

      toast({ title: "Broadcast Sent", description: "All users notified." });
      setBroadcastForm({ title: '', message: '', target: 'all', type: 'info' });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Broadcast Failed" });
    } finally {
      setActionLoading(false);
    }
  };

  if (previewUserId) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed top-0 left-0 w-full z-[100] bg-primary h-14 flex items-center justify-between px-6 shadow-xl">
          <div className="flex items-center gap-6">
            <span className="text-xs font-black uppercase tracking-widest text-primary-foreground">Previewing Trader: {previewUserId}</span>
          </div>
          <Button variant="secondary" size="sm" className="h-9 px-6 text-xs font-bold" onClick={() => setPreviewUserId(null)}>
            <ChevronLeft className="w-3 h-3 mr-1" /> Exit Preview
          </Button>
        </div>
        <div className="pt-14">
          <DashboardPage adminViewMode={true} targetUid={previewUserId} />
        </div>
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
              <p className="text-muted-foreground text-sm">Institutional control node for Capital Management.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input 
                   placeholder="Quick search user/order..." 
                   className="pl-10 h-10 bg-secondary/50 text-white" 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)} 
                 />
               </div>
               <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading}>
                 <RefreshCw className={cn("w-4 h-4 text-white", isLoading && "animate-spin")} />
               </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-secondary/50 p-1 h-12 w-full justify-start rounded-xl border border-border/50 shrink-0 overflow-x-auto no-scrollbar">
              <TabsTrigger value="overview" className="px-6 font-bold cursor-pointer"><Activity className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
              <TabsTrigger value="users" className="px-6 font-bold cursor-pointer"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
              <TabsTrigger value="orders" className="px-6 font-bold cursor-pointer"><ShoppingCart className="w-4 h-4 mr-2" /> Orders</TabsTrigger>
              <TabsTrigger value="kyc" className="px-6 font-bold cursor-pointer"><Fingerprint className="w-4 h-4 mr-2" /> KYC Hub</TabsTrigger>
              <TabsTrigger value="payouts" className="px-6 font-bold cursor-pointer"><Wallet className="w-4 h-4 mr-2" /> Payouts</TabsTrigger>
              <TabsTrigger value="referrals" className="px-6 font-bold cursor-pointer"><TrendingUp className="w-4 h-4 mr-2" /> Referrals</TabsTrigger>
              <TabsTrigger value="branding" className="px-6 font-bold cursor-pointer"><Settings className="w-4 h-4 mr-2" /> Branding</TabsTrigger>
              <TabsTrigger value="broadcast" className="px-6 font-bold cursor-pointer"><Megaphone className="w-4 h-4 mr-2" /> Broadcast</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign />} color="blue" />
              <StatCard title="Total Traders" value={stats.totalTraders} icon={<Users />} color="purple" />
              <StatCard title="Pending Orders" value={stats.pendingOrders} icon={<ShoppingCart />} color="amber" />
              <StatCard title="Pending KYC" value={stats.pendingKyc} icon={<Fingerprint />} color="red" />
            </div>
          )}

          {activeTab === 'users' && (
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                      <tr>
                        <th className="py-4 px-6">Trader</th>
                        <th className="py-4 px-6">UID</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredUsers.map((u: any) => (
                        <tr key={u.id} className="hover:bg-primary/5 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="py-4 px-6 font-mono text-[10px] text-muted-foreground">{u.uid || 'N/A'}</td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className={cn(
                              "text-[9px] uppercase",
                              u.accountStatus === 'active' ? "border-emerald-500/50 text-emerald-500" : "border-destructive text-destructive"
                            )}>{u.accountStatus || 'INACTIVE'}</Badge>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setSelectedUser(u); setIsGiftModalOpen(true); }}><Gift className="w-4 h-4 text-amber-500" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPreviewUserId(u.id)}><Eye className="w-4 h-4" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && <div className="p-20 text-center text-muted-foreground">No users found.</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'orders' && (
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black">
                      <tr>
                        <th className="py-4 px-6">Trader</th>
                        <th className="py-4 px-6">Plan / Size</th>
                        <th className="py-4 px-6">Amount / Net</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredOrders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-bold text-white">{o.userName}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{o.txHash?.slice(0, 15)}...</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-white font-medium">{o.plan}</div>
                            <div className="text-[10px] text-muted-foreground">{o.accountSize}</div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-white font-bold">${o.amountPaid}</div>
                            <Badge variant="outline" className="text-[8px] py-0">{o.network}</Badge>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={cn(
                              "text-[9px] uppercase",
                              o.status === 'verified' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                              o.status === 'pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                            )}>{o.status}</Badge>
                          </td>
                          <td className="py-4 px-6 text-right flex justify-end gap-2">
                             {o.paymentScreenshot && (
                               <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => { setSelectedOrder(o); setIsProofModalOpen(true); }}>Proof</Button>
                             )}
                             {o.status === 'pending' && (
                               <Button size="sm" className="h-8 text-[10px] bg-emerald-600 hover:bg-emerald-700" onClick={() => { setSelectedOrder(o); setIsVerifyModalOpen(true); }}>Verify</Button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredOrders.length === 0 && <div className="p-20 text-center text-muted-foreground">No orders yet.</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'kyc' && (
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black">
                      <tr>
                        <th className="py-4 px-6">Trader</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6">Submitted</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {adminData?.users?.filter((u: any) => u.kycStatus && u.kycStatus !== 'none').map((u: any) => (
                        <tr key={u.id} className="hover:bg-primary/5 transition-colors">
                          <td className="py-4 px-6 font-bold text-white">{u.name}</td>
                          <td className="py-4 px-6">
                            <Badge className={cn(
                              "text-[9px] uppercase",
                              u.kycStatus === 'verified' ? "bg-emerald-500/10 text-emerald-500" : 
                              u.kycStatus === 'pending' ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive"
                            )}>{u.kycStatus}</Badge>
                          </td>
                          <td className="py-4 px-6 text-[10px] text-muted-foreground">{u.kycSubmittedAt ? new Date(u.kycSubmittedAt).toLocaleString() : 'N/A'}</td>
                          <td className="py-4 px-6 text-right">
                             <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => { setSelectedUser(u); setIsKycReviewOpen(true); }}>Review Docs</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {adminData?.users?.filter((u: any) => u.kycStatus && u.kycStatus !== 'none').length === 0 && <div className="p-20 text-center text-muted-foreground">No KYC submissions found.</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payouts' && (
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black">
                      <tr>
                        <th className="py-4 px-6">Trader</th>
                        <th className="py-4 px-6">Amount</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {adminData?.payouts?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-primary/5 transition-colors">
                          <td className="py-4 px-6 font-bold text-white">{p.email || p.userId}</td>
                          <td className="py-4 px-6 text-emerald-500 font-bold">${p.amount}</td>
                          <td className="py-4 px-6">
                            <Badge variant="outline" className="text-[9px] uppercase">{p.status}</Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                             {p.status === 'pending' && (
                               <Button size="sm" className="h-8 text-[10px] bg-emerald-600" onClick={() => handleMarkPaid(p.id)}>Mark Paid</Button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {adminData?.payouts?.length === 0 && <div className="p-20 text-center text-muted-foreground">No payout requests.</div>}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'referrals' && (
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black">
                      <tr>
                        <th className="py-4 px-6">Trader / Code</th>
                        <th className="py-4 px-6">Total Conversions</th>
                        <th className="py-4 px-6">Earnings ($30/ea)</th>
                        <th className="py-4 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {adminData?.users?.filter((u: any) => u.referralCode).map((u: any) => {
                        const conversions = adminData.referrals.filter((r: any) => r.referrerId === u.id && r.status === 'paid').length;
                        return (
                          <tr key={u.id} className="hover:bg-primary/5 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-white">{u.name}</div>
                              <div className="text-[10px] font-mono text-primary">{u.referralCode}</div>
                            </td>
                            <td className="py-4 px-6 font-bold text-white">{conversions}</td>
                            <td className="py-4 px-6 text-emerald-500 font-bold">${conversions * 30}</td>
                            <td className="py-4 px-6 text-right">
                              <Badge variant="outline" className="text-[9px]">ACTIVE</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'branding' && (
            <div className="max-w-3xl space-y-8">
              <Card className="border-border/50 bg-card/30">
                <CardHeader><CardTitle>Visual Identity</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-background overflow-hidden">
                       {logoPreview ? (
                         <Image src={logoPreview} alt="Logo Preview" width={96} height={96} className="object-cover" />
                       ) : <ImageIcon className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase">Platform Logo (Base64)</Label>
                       <Input type="file" accept="image/*" onChange={handleLogoUpload} className="bg-secondary/50" />
                       <p className="text-[10px] text-muted-foreground">Recommended: 400x400 PNG/JPG. Max 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Site Name</Label>
                      <Input value={brandingForm.siteName} onChange={e => setBrandingForm({...brandingForm, siteName: e.target.value})} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Support Email</Label>
                      <Input value={brandingForm.supportEmail} onChange={e => setBrandingForm({...brandingForm, supportEmail: e.target.value})} className="bg-secondary/50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Discord URL</Label>
                      <Input value={brandingForm.discordUrl} onChange={e => setBrandingForm({...brandingForm, discordUrl: e.target.value})} className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Instagram URL</Label>
                      <Input value={brandingForm.instagramUrl} onChange={e => setBrandingForm({...brandingForm, instagramUrl: e.target.value})} className="bg-secondary/50" />
                    </div>
                  </div>

                  <Button className="w-full font-bold cyan-box-glow h-12" onClick={handleSaveBranding} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Branding Configuration
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="max-w-4xl space-y-8">
               <Card className="border-border/50 bg-card/30">
                 <CardHeader><CardTitle>Institutional Broadcast</CardTitle><CardDescription>Send real-time alerts to all traders.</CardDescription></CardHeader>
                 <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <Label className="text-xs font-bold">Message Title</Label>
                         <Input value={broadcastForm.title} onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} placeholder="e.g. Server Maintenance" />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-xs font-bold">Alert Type</Label>
                         <Select value={broadcastForm.type} onValueChange={v => setBroadcastForm({...broadcastForm, type: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="info">Information (Blue)</SelectItem>
                               <SelectItem value="warning">Warning (Yellow)</SelectItem>
                               <SelectItem value="success">System Alert (Green)</SelectItem>
                            </SelectContent>
                         </Select>
                       </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold">Message Body</Label>
                      <Textarea value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} rows={4} placeholder="Type your broadcast message here..." />
                    </div>
                    <Button className="w-full font-bold h-12" onClick={handleSendBroadcast} disabled={actionLoading}>
                      <Send className="w-4 h-4 mr-2" /> Dispatch Global Broadcast
                    </Button>
                 </CardContent>
               </Card>

               <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Broadcast History</h3>
                  {adminData?.broadcasts?.map((b: any) => (
                    <Card key={b.id} className="border-border/50 bg-secondary/10">
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-white">{b.title}</p>
                          <p className="text-xs text-muted-foreground">{b.message.slice(0, 80)}...</p>
                        </div>
                        <div className="text-right">
                           <Badge variant="outline" className="text-[8px]">{b.type}</Badge>
                           <p className="text-[8px] text-muted-foreground mt-1">{new Date(b.sentAt).toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/50">
          <DialogHeader><DialogTitle>Payment Verification Proof</DialogTitle></DialogHeader>
          <div className="space-y-4">
             {selectedOrder?.paymentScreenshot ? (
               <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-border">
                  <Image src={selectedOrder.paymentScreenshot} alt="Payment Proof" fill className="object-contain" />
               </div>
             ) : <div className="p-20 text-center text-muted-foreground">No screenshot provided.</div>}
             <div className="p-4 bg-secondary/50 rounded-xl space-y-2">
                <Label className="text-[10px] font-bold uppercase text-primary">Transaction Hash (TXID)</Label>
                <div className="font-mono text-xs text-white break-all">{selectedOrder?.txHash}</div>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
        <DialogContent className="bg-card border-emerald-500/20">
          <DialogHeader>
             <DialogTitle className="text-emerald-500">Verify Order & Assign MT5</DialogTitle>
             <DialogDescription>Assign credentials for {selectedOrder?.userName} ({selectedOrder?.accountSize} {selectedOrder?.plan})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label className="text-xs font-bold">MT5 Login ID</Label>
                   <Input value={verifyForm.login} onChange={e => setVerifyVerifyForm({...verifyForm, login: e.target.value})} placeholder="e.g. 7829443" />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs font-bold">Master Password</Label>
                   <Input value={verifyForm.password} onChange={e => setVerifyVerifyForm({...verifyForm, password: e.target.value})} placeholder="Master key" />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold">MT5 Server</Label>
                <Input value={verifyForm.server} onChange={e => setVerifyVerifyForm({...verifyForm, server: e.target.value})} />
             </div>
          </div>
          <DialogFooter className="mt-6">
             <Button variant="ghost" onClick={() => setIsVerifyModalOpen(false)}>Cancel</Button>
             <Button className="bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={handleVerifyOrder} disabled={actionLoading}>Activate Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isKycReviewOpen} onOpenChange={setIsKycReviewOpen}>
        <DialogContent className="max-w-4xl bg-card border-border/50">
          <DialogHeader><DialogTitle>KYC Application Review: {selectedUser?.name}</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 pt-4">
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-primary">Proof of Identity</Label>
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-background border border-border">
                   {selectedUser?.idProofUrl && <Image src={selectedUser.idProofUrl} alt="ID Proof" fill className="object-contain" />}
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-primary">Proof of Address</Label>
                <div className="relative aspect-[3/2] rounded-xl overflow-hidden bg-background border border-border">
                   {selectedUser?.addressProofUrl && <Image src={selectedUser.addressProofUrl} alt="Address Proof" fill className="object-contain" />}
                </div>
             </div>
          </div>
          <div className="pt-6 space-y-4">
             <Label className="text-xs font-bold">Rejection Reason (if applicable)</Label>
             <Input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="e.g. Document expired or blurry" />
          </div>
          <DialogFooter className="mt-8 flex gap-4">
             <Button variant="destructive" className="flex-1 font-bold" onClick={() => handleKycAction('rejected')} disabled={actionLoading}>Reject KYC</Button>
             <Button className="flex-1 font-bold bg-emerald-600 hover:bg-emerald-700" onClick={() => handleKycAction('verified')} disabled={actionLoading}>Approve & Verify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Login Modal */}
      <Dialog open={showAdminModal} onOpenChange={setIsAuthenticated ? setShowAdminModal : () => {}}>
        <DialogContent className="bg-[#0a0f1e] border-[#00d4ff] text-white sm:max-w-[400px]">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-headline font-bold text-[#00d4ff]">🔐 Admin Login</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdminAuth} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest">Security Protocol</Label>
              <Input type="password" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} className="bg-[#0a0f1e]/50 border-white/10 text-white text-center font-mono" autoFocus />
              {adminError && <p className="text-[10px] text-destructive text-center">{adminError}</p>}
            </div>
            <Button type="submit" className="w-full bg-[#00d4ff] text-[#0a0f1e] font-bold">Unlock Terminal</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
