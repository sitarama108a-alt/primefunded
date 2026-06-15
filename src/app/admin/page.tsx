
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
  Eye, Shield, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, Award, Search, RefreshCw, Copy, Loader2, Image as ImageIcon, Settings, Upload, Save, Instagram, Phone, SearchX, Megaphone, DollarSign, Lock, ChevronLeft, LayoutDashboard, XCircle, CheckCircle2, Clock, ShieldCheck, AlertTriangle, Gift, FileImage, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import DashboardPage from '@/app/dashboard/page';
import { processKycAction } from './actions';
import Image from 'next/image';
import { doc, setDoc, collection, getDocs, query, orderBy, limit, where, updateDoc, writeBatch, serverTimestamp, addDoc } from 'firebase/firestore';
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

  // Verification State
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

  // Gift Modal States
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftForm, setGiftForm] = useState({
    plan: '1-Step Pro',
    size: '$100,000',
    login: '',
    password: '',
    server: 'PrimeFunded-Live',
    note: ''
  });

  // Action States for User Preview
  const [isBreachModalOpen, setIsBreachModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [breachReasonInput, setBreachReasonInput] = useState('');
  const [assignForm, setAssignForm] = useState({
    plan: '1-Step Pro',
    size: '$100k',
    login: '',
    password: '',
    server: 'PrimeFunded-Live'
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isUploadDone, setIsUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [socialLinks, setSocialLinks] = useState({
    discord: '',
    instagram: '',
    telegram: '',
    whatsapp: ''
  });
  const [savingLinks, setSavingLinks] = useState(false);

  // Secret Admin Access State for logo clicks
  const [adminClickCount, setAdminClickCount] = useState(0);
  const adminClickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for existing session on mount
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
        }));
      };

      const [users, orders, payouts, referrals, broadcasts] = await Promise.all([
        fetchCollectionData('users'),
        fetchCollectionData('orders', 'submittedAt'),
        fetchCollectionData('payouts', 'date'),
        fetchCollectionData('referrals', 'createdAt'),
        fetchCollectionData('broadcasts', 'sentAt'),
      ]);

      setAdminData({
        users,
        orders,
        payouts,
        referrals,
        broadcasts,
        success: true
      });
    } catch (error: any) {
      console.error('[Admin-Client-Sync] Failed:', error);
      toast({ 
        variant: "destructive", 
        title: "Sync Failed", 
        description: "Firestore read error. Ensure security rules allow reads." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(loadData, 60000);
      return () => clearInterval(interval);
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
      u.phone?.includes(searchTerm) ||
      u.id?.toLowerCase().includes(queryStr) ||
      u.uid?.toString().includes(searchTerm) ||
      u.traderId?.toString().includes(searchTerm) ||
      u.referralCode?.toLowerCase().includes(queryStr)
    );
  }, [adminData?.users, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!adminData?.orders) return [];
    const queryStr = searchTerm.toLowerCase();
    return adminData.orders.filter((o: any) => 
      o.email?.toLowerCase().includes(queryStr) ||
      o.userName?.toLowerCase().includes(queryStr) ||
      o.txHash?.toLowerCase().includes(queryStr) ||
      o.id?.toLowerCase().includes(queryStr) ||
      o.plan?.toLowerCase().includes(queryStr) ||
      o.accountSize?.toLowerCase().includes(queryStr)
    );
  }, [adminData?.orders, searchTerm]);

  const stats = useMemo(() => {
    if (!adminData) return null;
    const verifiedOrders = adminData.orders.filter((o: any) => o.status === 'verified');
    const totalRevenue = verifiedOrders.reduce((acc: number, o: any) => acc + (parseFloat(o.amountPaid) || 0), 0) || 0;
    const pendingKyc = adminData.users.filter((t: any) => t.kycStatus === 'pending').length || 0;
    const pendingPayouts = adminData.payouts.filter((p: any) => p.status === 'pending').length || 0;
    const activeChallenges = verifiedOrders.length || 0;
    const pendingOrders = adminData.orders.filter((o: any) => o.status === 'pending').length || 0;

    return { 
      totalUsers: adminData.users.length, 
      revenue: totalRevenue, 
      pendingKyc, 
      pendingPayouts, 
      activeChallenges,
      pendingOrders
    };
  }, [adminData]);

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    setIsUploadDone(false);

    try {
      const base64 = await uploadImageAsBase64(logoFile);
      const brandRef = doc(db, 'settings', 'branding');
      await setDoc(brandRef, { 
        logoUrl: base64,
        updatedAt: new Date().toISOString() 
      }, { merge: true });
      
      toast({ title: "Logo Updated!", description: "✅ Branding synchronized." });
      setUploadingLogo(false);
      setIsUploadDone(true);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
      setUploadingLogo(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    setSavingLinks(true);
    try {
      const brandRef = doc(db, 'settings', 'branding');
      await setDoc(brandRef, {
        discordUrl: socialLinks.discord,
        instagramUrl: socialLinks.instagram,
        telegramUrl: socialLinks.telegram,
        whatsappUrl: socialLinks.whatsapp
      }, { merge: true });
      toast({ title: "Links Saved" });
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSavingLinks(false);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'rejected' });
      toast({ title: "Order Rejected" });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalVerifyOrder = async () => {
    if (!selectedOrder || !verifyForm.login || !verifyForm.password) {
      toast({ variant: "destructive", title: "Missing Details" });
      return;
    }
    setActionLoading(true);
    try {
      // 1. Update Order
      await updateDoc(doc(db, 'orders', selectedOrder.id), { status: 'verified' });

      // 2. Update User Profile with root-level credentials
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

      // 3. Optional: Add to accounts subcollection for history
      await addDoc(collection(db, 'users', selectedOrder.userId, 'accounts'), {
        mt5Login: verifyForm.login,
        mt5Password: verifyForm.password,
        mt5Server: verifyForm.server,
        plan: selectedOrder.plan,
        size: selectedOrder.accountSize,
        status: "active",
        createdAt: serverTimestamp()
      });

      toast({ title: "✅ Account Activated", description: "MT5 credentials sent to trader's dashboard." });
      setIsVerifyModalOpen(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Activation Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleKycAction = async (userId: string, action: 'verified' | 'rejected') => {
    setActionLoading(true);
    const result = await processKycAction(userId, action, action === 'rejected' ? rejectionReason : undefined);
    if (result.success) {
      toast({ title: `KYC ${action}` });
      setIsKycReviewOpen(false);
      setRejectionReason('');
      loadData();
    } else {
      toast({ variant: "destructive", title: "Action Failed", description: result.error });
    }
    setActionLoading(false);
  };

  const handleFixUids = async () => {
    setActionLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const updates: Promise<void>[] = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const currentUid = data.uid;
        const needsNewUid = !currentUid || String(currentUid).length !== 8 || isNaN(Number(currentUid));
        
        if (needsNewUid) {
          const newUid = Math.floor(10000000 + Math.random() * 90000000).toString();
          updates.push(updateDoc(doc(db, 'users', docSnap.id), { uid: newUid }));
        }
      });

      if (updates.length > 0) {
        await Promise.all(updates);
        toast({ title: "UID Fix Applied", description: `${updates.length} accounts repaired.` });
        loadData();
      } else {
        toast({ title: "All UIDs Healthy" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Operation Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGiftAccount = async () => {
    if (!selectedUser || !giftForm.login || !giftForm.password) {
      toast({ variant: "destructive", title: "Missing Credentials" });
      return;
    }
    setActionLoading(true);
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        accountPlan: giftForm.plan,
        accountSize: giftForm.size,
        accountStatus: "active",
        mt5Login: giftForm.login,
        mt5Password: giftForm.password,
        mt5Server: giftForm.server,
        giftedAt: serverTimestamp(),
        giftNote: giftForm.note,
        isGifted: true
      });
      
      toast({ title: "🎁 Account Gifted!" });
      setIsGiftModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gifting Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (previewUserId) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed top-0 left-0 w-full z-[100] bg-primary h-14 flex items-center justify-between px-6 shadow-xl">
          <div className="flex items-center gap-6">
            <span className="text-xs font-black uppercase tracking-widest text-primary-foreground">Previewing Auth UID: {previewUserId}</span>
            <div className="flex items-center gap-3">
               <Button size="sm" variant="destructive" className="h-9 text-[10px] font-black" onClick={() => setIsBreachModalOpen(true)}>
                 <XCircle className="w-3.5 h-3.5 mr-1.5" /> Breach Account
               </Button>
               <Button size="sm" className="h-9 text-[10px] font-black bg-orange-600" onClick={() => setIsResetModalOpen(true)}>
                 <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset Account
               </Button>
            </div>
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
              <p className="text-muted-foreground text-sm">Institutional dashboard for capital deployment.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search orders, UIDs, users..." 
                   className="pl-10 h-10 bg-secondary/50 text-white" 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)} 
                 />
               </div>
               <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading || !isAuthenticated}>
                 <RefreshCw className={cn("w-4 h-4 text-white", isLoading && "animate-spin")} />
               </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-secondary/50 p-1 h-12 w-full justify-start rounded-xl border border-border/50 shrink-0 overflow-x-auto no-scrollbar">
              <TabsTrigger value="overview" className="px-6 font-bold cursor-pointer whitespace-nowrap"><Activity className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
              <TabsTrigger value="users" className="px-6 font-bold cursor-pointer whitespace-nowrap"><Users className="w-4 h-4 mr-2" /> User Directory</TabsTrigger>
              <TabsTrigger value="orders" className="px-6 font-bold cursor-pointer whitespace-nowrap"><ShoppingCart className="w-4 h-4 mr-2" /> Order Journal</TabsTrigger>
              <TabsTrigger value="kyc" className="px-6 font-bold cursor-pointer whitespace-nowrap"><Fingerprint className="w-4 h-4 mr-2" /> KYC Hub</TabsTrigger>
              <TabsTrigger value="referrals" className="px-6 font-bold cursor-pointer whitespace-nowrap"><TrendingUp className="w-4 h-4 mr-2" /> Referrals</TabsTrigger>
              <TabsTrigger value="settings" className="px-6 font-bold cursor-pointer whitespace-nowrap"><Settings className="w-4 h-4 mr-2" /> Branding</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          {isAuthenticated ? (
            <>
              <div className={cn("space-y-8", activeTab === 'overview' ? "block" : "hidden")}>
                {isLoading && !adminData ? <LoadingGrid /> : !stats ? <div className="text-center py-20 text-muted-foreground">Syncing...</div> : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<Wallet />} color="blue" />
                      <StatCard title="Total Traders" value={stats.totalUsers} icon={<Users />} color="purple" />
                      <StatCard title="Pending Review" value={stats.pendingOrders} icon={<Clock />} color="amber" />
                      <StatCard title="Total Payouts" value={`$${adminData.payouts.length}`} icon={<DollarSign />} color="green" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <Card className="border-border/50 bg-card/30">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-white text-lg">Unverified Orders</CardTitle>
                          <Button variant="ghost" size="sm" className="text-primary font-bold" onClick={() => handleTabChange('orders')}>View Journal</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="divide-y divide-border/30">
                            {adminData.orders.filter((o:any) => o.status === 'pending').slice(0, 5).map((o: any) => (
                              <div key={o.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div>
                                  <p className="text-sm font-bold text-white">{o.userName || o.email}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase">{o.plan} - {o.accountSize}</p>
                                </div>
                                <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-amber-500/30 text-amber-500" onClick={() => { setSelectedOrder(o); setIsProofModalOpen(true); }}>
                                  Review Proof
                                </Button>
                              </div>
                            ))}
                            {adminData.orders.filter((o:any) => o.status === 'pending').length === 0 && <div className="p-10 text-center text-xs text-muted-foreground italic">No pending orders.</div>}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </div>

              <div className={cn("space-y-6", activeTab === 'users' ? "block" : "hidden")}>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Directory Hub</p>
                  <Button size="sm" variant="outline" className="h-8 text-[10px] font-black border-primary/30 text-primary" onClick={handleFixUids}>
                    🔧 Fix All UIDs
                  </Button>
                </div>
                <Card className="border-border/50 bg-card/30">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                          <tr>
                            <th className="py-4 px-6">Trader Name</th>
                            <th className="py-4 px-6">Email / Contact</th>
                            <th className="py-4 px-6">Account Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {filteredUsers.map((u: any) => (
                            <tr key={u.id} className="hover:bg-primary/5 transition-colors">
                              <td className="py-4 px-6">
                                <div className="font-bold text-white">{u.name}</div>
                                <div className="text-[10px] text-muted-foreground font-mono break-all" title={u.uid}>UID: {u.uid || '--------'}</div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="text-white font-medium">{u.email}</div>
                                <div className="text-[10px] text-muted-foreground">{u.phone || 'No phone'}</div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant="outline" className={cn(
                                  "text-[9px] font-black uppercase",
                                  u.accountStatus === 'active' ? "border-emerald-500/50 text-emerald-500" : "border-muted text-muted-foreground"
                                )}>
                                  {u.accountStatus || 'NO ACCOUNT'}
                                </Badge>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-500" onClick={() => { setSelectedUser(u); setIsGiftModalOpen(true); }}>
                                    <Gift className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPreviewUserId(u.id)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className={cn("space-y-6", activeTab === 'orders' ? "block" : "hidden")}>
                 <Card className="border-border/50 bg-card/30">
                   <CardHeader><CardTitle className="text-white text-xl">Order Journal</CardTitle></CardHeader>
                   <CardContent className="p-0">
                     <div className="overflow-x-auto">
                       <table className="w-full text-sm text-left">
                         <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                           <tr>
                             <th className="py-4 px-6">User</th>
                             <th className="py-4 px-6">Challenge Details</th>
                             <th className="py-4 px-6">Paid Amount</th>
                             <th className="py-4 px-6">Status</th>
                             <th className="py-4 px-6">Submitted</th>
                             <th className="py-4 px-6 text-right">Verification</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-border/30">
                           {filteredOrders.length === 0 ? <tr><td colSpan={6} className="py-20 text-center italic text-muted-foreground">No orders recorded.</td></tr> : filteredOrders.map((o: any) => (
                             <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                               <td className="py-4 px-6">
                                 <div className="font-bold text-white">{o.userName || 'Unknown'}</div>
                                 <div className="text-[10px] text-muted-foreground">{o.email}</div>
                               </td>
                               <td className="py-4 px-6">
                                 <div className="text-white font-bold">{o.accountSize} {o.plan}</div>
                                 <div className="text-[9px] text-primary/50 font-black uppercase">{o.network} Network</div>
                               </td>
                               <td className="py-4 px-6">
                                 <div className="text-emerald-500 font-bold font-mono">${parseFloat(o.amountPaid).toFixed(2)}</div>
                               </td>
                               <td className="py-4 px-6">
                                 <Badge className={cn(
                                   "text-[9px] font-black uppercase",
                                   o.status === 'verified' ? "bg-emerald-600 text-white" : 
                                   o.status === 'pending' ? "bg-amber-500 text-white" : "bg-destructive text-white"
                                 )}>
                                   {o.status}
                                 </Badge>
                               </td>
                               <td className="py-4 px-6 text-xs text-muted-foreground">
                                 {o.submittedAt ? new Date(o.submittedAt).toLocaleDateString() : 'N/A'}
                               </td>
                               <td className="py-4 px-6 text-right">
                                  {o.status === 'pending' && (
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="outline" className="h-8 font-bold border-primary/30" onClick={() => { setSelectedOrder(o); setIsProofModalOpen(true); }}>View Proof</Button>
                                      <Button size="sm" className="h-8 font-bold bg-emerald-600 hover:bg-emerald-700" onClick={() => { setSelectedOrder(o); setIsVerifyModalOpen(true); }}>Verify & Assign</Button>
                                    </div>
                                  )}
                                  {o.status === 'verified' && <div className="text-emerald-500 flex items-center justify-end gap-1 font-bold text-xs"><CheckCircle2 className="w-3 h-3" /> Activated</div>}
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </CardContent>
                 </Card>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
               <div className="text-center space-y-6">
                  <Shield className="w-16 h-16 text-muted-foreground mx-auto opacity-20" />
                  <h2 className="text-2xl font-headline font-bold text-white">Direct Access Denied</h2>
                  <Button variant="outline" className="font-bold" onClick={() => setShowAdminModal(true)}>Unlock Terminal</Button>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Proof Modal */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
        <DialogContent className="bg-card border-primary/20 max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Payment Verification Proof</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">User</p>
                  <p className="font-bold text-white">{selectedOrder.userName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-xs text-primary truncate max-w-[200px]" title={selectedOrder.txHash}>{selectedOrder.txHash}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Payment Screenshot</p>
                <div className="aspect-video relative bg-black/40 border border-border rounded-xl overflow-hidden flex items-center justify-center group">
                  {selectedOrder.paymentScreenshot ? (
                    <Image src={selectedOrder.paymentScreenshot} alt="Proof" fill className="object-contain" />
                  ) : <p className="text-muted-foreground italic text-xs">No image attached</p>}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="destructive" className="font-bold" onClick={() => { handleRejectOrder(selectedOrder.id); setIsProofModalOpen(false); }}>Reject Payment</Button>
            <Button className="bg-emerald-600 font-bold" onClick={() => { setIsProofModalOpen(false); setIsVerifyModalOpen(true); }}>Proceed to Verification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify & Assign Modal */}
      <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
        <DialogContent className="bg-card border-emerald-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-500 font-headline">Verify & Assign MT5</DialogTitle>
            <DialogDescription className="text-xs uppercase font-black text-muted-foreground">Provision Credentials for {selectedOrder?.userName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
               <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Approved Challenge</p>
               <p className="font-bold text-lg">{selectedOrder?.accountSize} {selectedOrder?.plan}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">MT5 Login ID</Label>
              <Input placeholder="Enter login number" className="bg-secondary/30 h-11" value={verifyForm.login} onChange={e => setVerifyVerifyForm({...verifyForm, login: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">MT5 Master Password</Label>
              <Input placeholder="Enter password" type="text" className="bg-secondary/30 h-11" value={verifyForm.password} onChange={e => setVerifyVerifyForm({...verifyForm, password: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">MT5 Trading Server</Label>
              <Input placeholder="PrimeFunded-Live" className="bg-secondary/30 h-11" value={verifyForm.server} onChange={e => setVerifyVerifyForm({...verifyForm, server: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsVerifyModalOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleFinalVerifyOrder} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />} Send to Trader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Account Modal */}
      <Dialog open={isGiftModalOpen} onOpenChange={setIsGiftModalOpen}>
        <DialogContent className="bg-card border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-500 flex items-center gap-2">
              <Gift className="w-5 h-5" /> Gift Account to {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Plan Type</Label>
                <Select value={giftForm.plan} onValueChange={v => setGiftForm({...giftForm, plan: v})}>
                  <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-Step Pro">1-Step Pro</SelectItem>
                    <SelectItem value="2-Step Classic">2-Step Classic</SelectItem>
                    <SelectItem value="Instant Funding">Instant Funding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Account Size</Label>
                <Select value={giftForm.size} onValueChange={v => setGiftForm({...giftForm, size: v})}>
                  <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$5,000">$5,000</SelectItem>
                    <SelectItem value="$10,000">$10,000</SelectItem>
                    <SelectItem value="$25,000">$25,000</SelectItem>
                    <SelectItem value="$50,000">$50,000</SelectItem>
                    <SelectItem value="$100,000">$100,000</SelectItem>
                    <SelectItem value="$200,000">$200,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">MT5 Login ID</Label>
              <Input placeholder="MT5 account number" className="bg-secondary/30" value={giftForm.login} onChange={e => setGiftForm({...giftForm, login: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">MT5 Master Password</Label>
              <Input placeholder="Enter password" type="text" className="bg-secondary/30" value={giftForm.password} onChange={e => setVerifyVerifyForm({...verifyForm, password: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsGiftModalOpen(false)}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold" onClick={handleGiftAccount} disabled={actionLoading}>
              Gift Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="border-border/50 bg-card/30"><div className="p-6 space-y-4"><Skeleton className="h-10 w-10" /><Skeleton className="h-8 w-32" /></div></Card>
      ))}
    </div>
  );
}
