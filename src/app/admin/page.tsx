
"use client";

import { useState, useMemo, useEffect, memo, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, Shield, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, MoreVertical, Gift, Ban, CheckCircle2, XCircle, Clock, LayoutDashboard, ChevronLeft, Bell, Send, User, History, Award, BarChart3, Search, ExternalLink, RefreshCw, Copy, Loader2, Image as ImageIcon, Settings, Upload, Save, Instagram, MessageCircle, Phone, SearchX, AlertTriangle, Megaphone, DollarSign
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { sendKycApprovalEmail, sendKycRejectionEmail, sendPayoutProcessedEmail } from '@/lib/email';
import { Textarea } from '@/components/ui/textarea';
import DashboardPage from '@/app/dashboard/page';
import { processKycAction, verifyOrderAction } from './actions';
import Image from 'next/image';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseApp } from '@/firebase';
import { useBrandSettings } from '@/hooks/use-brand-settings';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  
  const [adminData, setAdminData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { toast } = useToast();
  const app = useFirebaseApp();
  const storage = getStorage(app);
  const branding = useBrandSettings();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isKycReviewOpen, setIsKycReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [socialLinks, setSocialLinks] = useState({
    discord: '',
    instagram: '',
    telegram: '',
    whatsapp: ''
  });
  const [savingLinks, setSavingLinks] = useState(false);

  useEffect(() => {
    if (branding && !branding.loading) {
      setSocialLinks({
        discord: branding.discordUrl || '',
        instagram: branding.instagramUrl || '',
        telegram: branding.telegramUrl || '',
        whatsapp: branding.whatsappUrl || ''
      });
    }
  }, [branding]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchCollectionData = async (collName: string, orderByField?: string) => {
        const collRef = collection(db, collName);
        let q;
        if (orderByField) {
          q = query(collRef, orderBy(orderByField, 'desc'), limit(100));
        } else {
          q = query(collRef, limit(100));
        }
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Standardize dates from Timestamps to ISO strings for UI components
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
          sentAt: doc.data().sentAt?.toDate?.()?.toISOString() || doc.data().sentAt,
          date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date,
          kycSubmittedAt: doc.data().kycSubmittedAt?.toDate?.()?.toISOString() || doc.data().kycSubmittedAt,
          lastCodeChange: doc.data().lastCodeChange?.toDate?.()?.toISOString() || doc.data().lastCodeChange,
        }));
      };

      const [users, orders, payouts, referrals, broadcasts] = await Promise.all([
        fetchCollectionData('users'),
        fetchCollectionData('orders', 'date'),
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
    const saved = localStorage.getItem('admin_active_tab');
    if (saved) setActiveTab(saved);
    
    const savedPass = sessionStorage.getItem('admin_master_key');
    const masterKey = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "93463962569392846256";
    if (savedPass && savedPass === masterKey) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      // Pseudo-realtime: Refresh every 60 seconds
      const interval = setInterval(loadData, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    localStorage.setItem('admin_active_tab', val);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const masterKey = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "93463962569392846256";
    if (password === masterKey) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_master_key', password);
      toast({ title: "Admin Access Granted" });
    } else {
      toast({ variant: "destructive", title: "Access Denied" });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!adminData?.users) return [];
    const query = searchTerm.toLowerCase();
    return adminData.users.filter((u: any) => 
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone?.includes(searchTerm) ||
      u.id?.includes(searchTerm) ||
      u.traderId?.includes(searchTerm) ||
      u.referralCode?.toLowerCase().includes(query)
    );
  }, [adminData?.users, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!adminData?.orders) return [];
    const query = searchTerm.toLowerCase();
    return adminData.orders.filter((o: any) => 
      o.email?.toLowerCase().includes(query) ||
      o.txHash?.toLowerCase().includes(query) ||
      o.id?.toLowerCase().includes(query) ||
      o.plan?.toLowerCase().includes(query) ||
      o.size?.toLowerCase().includes(query)
    );
  }, [adminData?.orders, searchTerm]);

  const stats = useMemo(() => {
    if (!adminData) return null;
    const verifiedOrders = adminData.orders.filter((o: any) => o.status === 'verified');
    const totalRevenue = verifiedOrders.reduce((acc: number, o: any) => acc + parseFloat(o.price?.replace('$', '').replace(',', '') || 0), 0) || 0;
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

    try {
      const storageRef = ref(storage, 'brand/logo.png');
      const snapshot = await uploadBytes(storageRef, logoFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const brandRef = doc(db, 'settings', 'brand');
      await setDoc(brandRef, { logoUrl: downloadURL }, { merge: true });
      
      toast({ title: "Logo Updated!", description: "The platform branding has been updated." });
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('[Admin] Logo upload error:', err);
      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: err.message || "An unexpected error occurred during the logo upload." 
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveSocialLinks = async () => {
    setSavingLinks(true);
    try {
      const brandRef = doc(db, 'settings', 'brand');
      await setDoc(brandRef, {
        discordUrl: socialLinks.discord,
        instagramUrl: socialLinks.instagram,
        telegramUrl: socialLinks.telegram,
        whatsappUrl: socialLinks.whatsapp
      }, { merge: true });
      toast({ title: "Links Saved", description: "Community links have been updated across the site." });
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSavingLinks(false);
    }
  };

  const handleVerifyOrder = async (orderId: string) => {
    setActionLoading(true);
    const result = await verifyOrderAction(orderId);
    if (result.success) {
      toast({ title: "Order Verified", description: "MT5 account generated and sent." });
      loadData();
    } else {
      toast({ variant: "destructive", title: "Verification Failed", description: result.error });
    }
    setActionLoading(false);
  };

  const handleKycAction = async (userId: string, action: 'verified' | 'rejected') => {
    setActionLoading(true);
    const result = await processKycAction(userId, action, action === 'rejected' ? rejectionReason : undefined);
    if (result.success) {
      toast({ title: `KYC ${action}`, description: `User profile has been updated.` });
      setIsKycReviewOpen(false);
      setRejectionReason('');
      loadData();
    } else {
      toast({ variant: "destructive", title: "Action Failed", description: result.error });
    }
    setActionLoading(false);
  };

  if (previewUserId) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed top-0 left-0 w-full z-[100] bg-primary h-12 flex items-center justify-between px-6 shadow-lg">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            <span className="text-xs font-black uppercase tracking-widest text-primary-foreground">Previewing: {previewUserId}</span>
          </div>
          <Button variant="secondary" size="sm" className="h-8 text-xs font-bold cursor-pointer" onClick={() => setPreviewUserId(null)}>
            <ChevronLeft className="w-3 h-3 mr-1" /> Back to Terminal
          </Button>
        </div>
        <div className="pt-12">
          <DashboardPage adminViewMode={true} targetUid={previewUserId} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Shield className="text-primary w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold text-white">Admin Portal</CardTitle>
            <CardDescription>Enter master credentials to access the terminal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white text-xs uppercase font-black tracking-widest">Master Key</Label>
                <Input type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-secondary/30 text-white" />
              </div>
              <Button type="submit" className="w-full h-12 font-bold cyan-box-glow cursor-pointer">Access Terminal</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      <Navigation />
      <main className="flex-1 flex flex-col min-h-0">
        <div className="p-8 pb-4 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold mb-1 text-white">Administrative Terminal</h1>
              <p className="text-muted-foreground">Monitor performance and manage institutional capital deployment.</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input 
                   placeholder="Quick search user/order..." 
                   className="pl-10 h-10 bg-secondary/50 text-white border-border/50" 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)} 
                 />
               </div>
               <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading} className="bg-secondary/50 border-border/50">
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
              <TabsTrigger value="payouts" className="px-6 font-bold cursor-pointer whitespace-nowrap"><DollarSign className="w-4 h-4 mr-2" /> Payouts</TabsTrigger>
              <TabsTrigger value="broadcast" className="px-6 font-bold cursor-pointer whitespace-nowrap"><Megaphone className="w-4 h-4 mr-2" /> Broadcast</TabsTrigger>
              <TabsTrigger value="settings" className="px-6 font-bold cursor-pointer whitespace-nowrap"><Settings className="w-4 h-4 mr-2" /> Branding</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          
          {/* OVERVIEW TAB */}
          <div className={cn("space-y-8", activeTab === 'overview' ? "block" : "hidden")}>
            {isLoading && !adminData ? <LoadingGrid /> : !stats ? <div className="text-center py-20 text-muted-foreground">Sync required.</div> : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<Wallet />} color="blue" />
                  <StatCard title="Total Traders" value={stats.totalUsers} icon={<Users />} color="purple" />
                  <StatCard title="Verified Challenges" value={stats.activeChallenges} icon={<Award />} color="green" />
                  <StatCard title="Pending Payments" value={stats.pendingOrders} icon={<Clock />} color="amber" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Users */}
                  <Card className="border-border/50 bg-card/30">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">Newest Traders</CardTitle>
                        <CardDescription>Latest registrations in the last 24h.</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary font-bold" onClick={() => handleTabChange('users')}>View All</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/30">
                        {adminData.users.slice(0, 5).map((u: any) => (
                          <div key={u.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs border border-border group-hover:border-primary/20">
                                {u.name?.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{u.name}</p>
                                <p className="text-[10px] text-muted-foreground">{u.email}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => setPreviewUserId(u.id)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Orders */}
                  <Card className="border-border/50 bg-card/30">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">Latest Orders</CardTitle>
                        <CardDescription>Most recent challenge purchases.</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="text-primary font-bold" onClick={() => handleTabChange('orders')}>View All</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border/30">
                        {adminData.orders.slice(0, 5).map((o: any) => (
                          <div key={o.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <div>
                              <p className="text-sm font-bold text-white">{o.plan} ({o.size})</p>
                              <p className="text-[10px] text-muted-foreground">{o.email}</p>
                            </div>
                            <Badge className={o.status === 'verified' ? "bg-accent text-accent-foreground" : "bg-amber-500 text-white"}>
                              {o.status.toUpperCase()}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>

          {/* USERS TAB */}
          <div className={cn("space-y-6", activeTab === 'users' ? "block" : "hidden")}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Showing {filteredUsers.length} of {adminData?.users?.length || 0} users
              </p>
            </div>
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-0">
                {isLoading ? <LoadingTable /> : filteredUsers.length === 0 ? (
                  <EmptyState message="No users found matching your search." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="py-4 px-6">Trader Name</th>
                          <th className="py-4 px-6">Email / Phone</th>
                          <th className="py-4 px-6">Referral Code</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {filteredUsers.map((u: any) => (
                          <tr key={u.id} className="hover:bg-primary/5 transition-colors group">
                            <td className="py-4 px-6">
                              <div className="font-bold text-white">{u.name}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">{u.id}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-white">{u.email}</div>
                              <div className="text-xs text-muted-foreground">{u.phone || 'No Phone'}</div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant="outline" className="font-mono text-xs border-primary/20 text-primary">
                                {u.referralCode}
                              </Badge>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPreviewUserId(u.id)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ORDERS TAB */}
          <div className={cn("space-y-6", activeTab === 'orders' ? "block" : "hidden")}>
             <div className="flex justify-between items-center mb-4">
               <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                 Showing {filteredOrders.length} of {adminData?.orders?.length || 0} orders
               </p>
             </div>
             <Card className="border-border/50 bg-card/30">
               <CardContent className="p-0">
                 {isLoading ? <LoadingTable /> : filteredOrders.length === 0 ? (
                   <EmptyState message="No orders found matching your search." />
                 ) : (
                   <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                     <table className="w-full text-sm text-left">
                       <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                         <tr>
                           <th className="py-4 px-6">Trader</th>
                           <th className="py-4 px-6">Challenge</th>
                           <th className="py-4 px-6">TXID / Network</th>
                           <th className="py-4 px-6">Status</th>
                           <th className="py-4 px-6 text-right">Verification</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-border/30">
                         {filteredOrders.map((o: any) => (
                           <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                             <td className="py-4 px-6 font-bold text-white">{o.email}</td>
                             <td className="py-4 px-6 font-mono text-xs">
                               <div className="text-white">{o.plan}</div>
                               <div className="text-muted-foreground">{o.size} - {o.price}</div>
                             </td>
                             <td className="py-4 px-6">
                               <div className="flex items-center gap-2">
                                 <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">{o.txHash}</span>
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <button className="text-muted-foreground hover:text-primary transition-colors" onClick={() => { navigator.clipboard.writeText(o.txHash); toast({ title: "Copied" }); }}>
                                          <Copy className="w-3 h-3" />
                                       </button>
                                     </TooltipTrigger>
                                     <TooltipContent className="bg-card border-border"><p className="text-xs">{o.txHash}</p></TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                               </div>
                               <div className="text-[9px] uppercase font-black text-primary/50">{o.network || 'Unknown Network'}</div>
                             </td>
                             <td className="py-4 px-6">
                               <Badge className={o.status === 'verified' ? "bg-accent text-accent-foreground" : "bg-amber-500 text-white"}>
                                 {o.status.toUpperCase()}
                               </Badge>
                             </td>
                             <td className="py-4 px-6 text-right">
                               {o.status === 'pending' && (
                                 <Button 
                                   size="sm" 
                                   className="h-8 font-bold bg-accent hover:bg-accent/90" 
                                   onClick={() => handleVerifyOrder(o.id)}
                                   disabled={actionLoading}
                                 >
                                   {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify Payment"}
                                 </Button>
                               )}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </CardContent>
             </Card>
          </div>

          {/* KYC HUB TAB */}
          <div className={cn("space-y-8", activeTab === 'kyc' ? "block" : "hidden")}>
             <Card className="border-border/50 bg-card/30">
               <CardHeader>
                 <CardTitle className="text-white flex items-center gap-2">
                   <Fingerprint className="w-5 h-5 text-amber-500" /> Pending Verification
                 </CardTitle>
                 <CardDescription>Traders awaiting identity approval to unlock payouts.</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="py-4 px-6">User</th>
                          <th className="py-4 px-6">Submitted At</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {adminData?.users?.filter((u: any) => u.kycStatus === 'pending').length === 0 ? (
                          <tr><td colSpan={4} className="py-12 text-center text-muted-foreground italic">No pending KYC applications.</td></tr>
                        ) : adminData?.users?.filter((u: any) => u.kycStatus === 'pending').map((u: any) => (
                          <tr key={u.id} className="hover:bg-amber-500/5 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-bold text-white">{u.name}</div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </td>
                            <td className="py-4 px-6 text-muted-foreground text-xs">
                              {u.kycSubmittedAt ? new Date(u.kycSubmittedAt).toLocaleString() : 'N/A'}
                            </td>
                            <td className="py-4 px-6"><Badge className="bg-amber-500 text-white font-bold">PENDING</Badge></td>
                            <td className="py-4 px-6 text-right">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 font-bold border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white"
                                onClick={() => { setSelectedUser(u); setIsKycReviewOpen(true); }}
                              >
                                Review Documents
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </CardContent>
             </Card>
          </div>

          {/* REFERRALS TAB */}
          <div className={cn("space-y-6", activeTab === 'referrals' ? "block" : "hidden")}>
             <Card className="border-border/50 bg-card/30">
                <CardHeader><CardTitle className="text-white">Global Referrals</CardTitle></CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                       <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                         <tr>
                           <th className="py-4 px-6">Date</th>
                           <th className="py-4 px-6">Referrer ID</th>
                           <th className="py-4 px-6">Referred User</th>
                           <th className="py-4 px-6">Status</th>
                           <th className="py-4 px-6 text-right">Comm.</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-border/30">
                         {adminData?.referrals?.length === 0 ? (
                           <tr><td colSpan={5} className="py-12 text-center text-muted-foreground italic">No referral records found.</td></tr>
                         ) : adminData?.referrals?.map((r: any) => (
                           <tr key={r.id} className="hover:bg-white/5">
                             <td className="py-4 px-6 text-xs text-muted-foreground">
                               {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
                             </td>
                             <td className="py-4 px-6 font-mono text-[10px] text-white truncate max-w-[120px]">{r.referrerId}</td>
                             <td className="py-4 px-6 font-bold text-white truncate max-w-[150px]">{r.referredUserEmail}</td>
                             <td className="py-4 px-6"><Badge variant="outline" className="text-[10px]">{r.status?.toUpperCase()}</Badge></td>
                             <td className="py-4 px-6 text-right font-bold text-accent">${r.amount || 0}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </CardContent>
             </Card>
          </div>

          {/* PAYOUTS TAB */}
          <div className={cn("space-y-6", activeTab === 'payouts' ? "block" : "hidden")}>
             <Card className="border-border/50 bg-card/30">
                <CardHeader><CardTitle className="text-white">Payout Requests</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Trader</th>
                          <th className="py-4 px-6">Method</th>
                          <th className="py-4 px-6 text-right">Amount</th>
                          <th className="py-4 px-6 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {adminData?.payouts?.length === 0 ? (
                           <tr><td colSpan={5} className="py-12 text-center text-muted-foreground italic">No payout history.</td></tr>
                        ) : adminData?.payouts?.map((p: any) => (
                           <tr key={p.id} className="hover:bg-white/5">
                             <td className="py-4 px-6 text-xs text-muted-foreground">{p.date ? new Date(p.date).toLocaleDateString() : 'N/A'}</td>
                             <td className="py-4 px-6 font-bold text-white">{p.email}</td>
                             <td className="py-4 px-6 text-xs">{p.method}</td>
                             <td className="py-4 px-6 text-right font-bold text-accent">${p.amount}</td>
                             <td className="py-4 px-6 text-right">
                               <Badge className={p.status === 'done' ? "bg-accent text-accent-foreground" : "bg-amber-500 text-white"}>{p.status.toUpperCase()}</Badge>
                             </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
             </Card>
          </div>

          {/* BROADCAST TAB */}
          <div className={cn("space-y-8", activeTab === 'broadcast' ? "block" : "hidden")}>
            <div className="max-w-3xl space-y-8">
              <Card className="border-border/50 bg-card/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2"><Megaphone className="w-5 h-5 text-primary" /> Global Broadcast</CardTitle>
                  <CardDescription>Send an institutional announcement to all active traders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Announcement Title</Label Lane
                    <Input placeholder="e.g. Server Maintenance: Weekend Upgrade" className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Message Body</Label>
                    <Textarea placeholder="Type your announcement here..." className="bg-secondary/50 min-h-[150px]" />
                  </div>
                  <Button className="w-full font-bold cyan-box-glow cursor-not-allowed" disabled>
                    <Send className="w-4 h-4 mr-2" /> Send to 5,000+ Traders
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">Broadcasts are currently disabled for system stability.</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/30">
                 <CardHeader><CardTitle className="text-white text-lg">Sent Broadcasts</CardTitle></CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-border/20">
                       {adminData?.broadcasts?.length === 0 ? (
                          <div className="p-8 text-center text-xs text-muted-foreground italic">No message history.</div>
                       ) : adminData?.broadcasts?.map((b: any) => (
                          <div key={b.id} className="p-4 flex justify-between items-center">
                             <div>
                                <p className="font-bold text-white text-sm">{b.title}</p>
                                <p className="text-[10px] text-muted-foreground">{new Date(b.sentAt).toLocaleString()}</p>
                             </div>
                             <Badge variant="outline">DELIVERED</Badge>
                          </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>
            </div>
          </div>

          {/* SETTINGS TAB */}
          <div className={cn("space-y-8 pb-20", activeTab === 'settings' ? "block" : "hidden")}>
            <div className="max-w-3xl grid gap-8">
              <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" /> Brand Identity
                  </CardTitle>
                  <CardDescription>Update the platform logo and visual assets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-background/50 rounded-2xl border border-white/5">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full border-2 border-primary/20 bg-secondary/50 flex items-center justify-center overflow-hidden shadow-2xl">
                        {branding.logoUrl ? (
                          <Image src={branding.logoUrl} alt="Platform Logo" width={96} height={96} className="object-cover" />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-muted-foreground opacity-20" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div>
                        <h4 className="font-bold text-white">Current Logo</h4>
                        <p className="text-xs text-muted-foreground">Displayed in navbar, auth screens, and loading sequence.</p>
                      </div>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="font-bold cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="w-4 h-4 mr-2" /> {logoFile ? 'Change Selection' : 'Select New Logo'}
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept=".png,.jpg,.jpeg,.svg" 
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        />
                        {logoFile && (
                          <Button 
                            className="font-bold cyan-box-glow cursor-pointer" 
                            size="sm"
                            onClick={handleLogoUpload}
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Apply Logo
                          </Button>
                        )}
                      </div>
                      {logoFile && <p className="text-[10px] text-accent font-bold uppercase tracking-widest">Selected: {logoFile.name}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" /> Community Links
                  </CardTitle>
                  <CardDescription>Configure external social and community destinations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <DiscordIcon className="w-3.5 h-3.5" /> Discord Invite
                      </Label>
                      <Input 
                        placeholder="https://discord.gg/..." 
                        value={socialLinks.discord}
                        onChange={e => setSocialLinks({...socialLinks, discord: e.target.value})}
                        className="bg-secondary/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <Instagram className="w-3.5 h-3.5" /> Instagram Profile
                      </Label>
                      <Input 
                        placeholder="https://instagram.com/..." 
                        value={socialLinks.instagram}
                        onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})}
                        className="bg-secondary/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <Send className="w-3.5 h-3.5" /> Telegram Channel
                      </Label>
                      <Input 
                        placeholder="https://t.me/..." 
                        value={socialLinks.telegram}
                        onChange={e => setSocialLinks({...socialLinks, telegram: e.target.value})}
                        className="bg-secondary/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" /> WhatsApp Group
                      </Label>
                      <Input 
                        placeholder="https://chat.whatsapp.com/..." 
                        value={socialLinks.whatsapp}
                        onChange={e => setSocialLinks({...socialLinks, whatsapp: e.target.value})}
                        className="bg-secondary/30 text-white"
                      />
                    </div>
                  </div>
                  <Button 
                    className="font-bold cursor-pointer" 
                    onClick={handleSaveSocialLinks}
                    disabled={savingLinks}
                  >
                    {savingLinks ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Community Links
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* KYC REVIEW DIALOG */}
      <Dialog open={isKycReviewOpen} onOpenChange={setIsKycReviewOpen}>
        <DialogContent className="bg-card border-primary/20 max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-headline">Review Identity Verification</DialogTitle>
            <DialogDescription>Review documents for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-4">
             <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-xs uppercase font-bold text-muted-foreground">ID Proof</Label>
                   <div className="aspect-[4/3] rounded-xl border border-border overflow-hidden bg-background relative flex items-center justify-center">
                     {selectedUser?.idProofUrl ? (
                       <Image src={selectedUser.idProofUrl} alt="ID Proof" fill className="object-contain" />
                     ) : <p className="text-xs text-muted-foreground">No document uploaded</p>}
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-xs uppercase font-bold text-muted-foreground">Address Proof</Label>
                   <div className="aspect-[4/3] rounded-xl border border-border overflow-hidden bg-background relative flex items-center justify-center">
                     {selectedUser?.addressProofUrl ? (
                       <Image src={selectedUser.addressProofUrl} alt="Address Proof" fill className="object-contain" />
                     ) : <p className="text-xs text-muted-foreground">No document uploaded</p>}
                   </div>
                </div>
             </div>
             <div className="space-y-3">
               <Label className="text-white text-xs font-bold uppercase">Rejection Reason (Optional)</Label>
               <Textarea 
                 placeholder="State specifically why the documents were rejected..." 
                 className="bg-secondary/30 min-h-[100px]"
                 value={rejectionReason}
                 onChange={e => setRejectionReason(e.target.value)}
               />
             </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
             <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleKycAction(selectedUser?.id, 'rejected')} disabled={actionLoading}>
               {actionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />} Reject KYC
             </Button>
             <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => handleKycAction(selectedUser?.id, 'verified')} disabled={actionLoading}>
               {actionLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Approve & Verify
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiscordIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993.023.03.07.039.084.028a19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
    </svg>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border border-border">
        <SearchX className="w-8 h-8 text-muted-foreground opacity-30" />
      </div>
      <div>
        <h4 className="text-white font-bold">No results found</h4>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{message}</p>
      </div>
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

function LoadingTable() {
  return (
    <div className="space-y-4 p-8">
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
  );
}
