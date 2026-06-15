
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
  Eye, Shield, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, Award, Search, RefreshCw, Copy, Loader2, Image as ImageIcon, Settings, Upload, Save, Instagram, Phone, SearchX, Megaphone, DollarSign, Lock, ChevronLeft, LayoutDashboard, XCircle, CheckCircle2, Clock, ShieldCheck, AlertTriangle, Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import DashboardPage from '@/app/dashboard/page';
import { processKycAction, verifyOrderAction } from './actions';
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
          q = query(collRef, orderBy(orderByField, 'desc'), limit(100));
        } else {
          q = query(collRef, limit(100));
        }
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
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
      o.txHash?.toLowerCase().includes(queryStr) ||
      o.id?.toLowerCase().includes(queryStr) ||
      o.plan?.toLowerCase().includes(queryStr) ||
      o.size?.toLowerCase().includes(queryStr)
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
    setIsUploadDone(false);

    try {
      const base64 = await uploadImageAsBase64(logoFile);
      const brandRef = doc(db, 'settings', 'branding');
      await setDoc(brandRef, { 
        logoUrl: base64,
        updatedAt: new Date().toISOString() 
      }, { merge: true });
      
      toast({ title: "Logo Updated!", description: "✅ The platform branding has been updated successfully!" });
      setUploadingLogo(false);
      setIsUploadDone(true);
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('[Admin] Firestore save error:', err);
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: err.message || "❌ Failed to save branding to database." 
      });
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

  // Gift Account Handler
  const handleGiftAccount = async () => {
    if (!selectedUser || !giftForm.login || !giftForm.password) {
      toast({ variant: "destructive", title: "Missing Credentials", description: "MT5 Login and Password are required." });
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
      
      toast({ title: "🎁 Account Gifted!", description: `Success! ${selectedUser.name} has been provisioned with ${giftForm.size} capital.` });
      setIsGiftModalOpen(false);
      setGiftForm({ plan: '1-Step Pro', size: '$100,000', login: '', password: '', server: 'PrimeFunded-Live', note: '' });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gifting Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // High-Privilege Actions Handlers
  const handleBreachAccount = async () => {
    if (!previewUserId || !breachReasonInput) {
      toast({ variant: "destructive", title: "Reason Required", description: "Please provide a reason for the breach." });
      return;
    }
    setActionLoading(true);
    try {
      const accRef = collection(db, 'users', previewUserId, 'accounts');
      const q = query(accRef, where('status', '==', 'active'));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "No Active Account", description: "No active account was found to breach." });
      } else {
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
          batch.update(d.ref, {
            status: 'terminated',
            balance: 0,
            accountActive: false,
            breachType: 'hard',
            breachedAt: serverTimestamp(),
            breachReason: breachReasonInput,
            updatedAt: serverTimestamp()
          });
        });
        await batch.commit();
        toast({ title: "Account Terminated", description: "The trading account has been marked as breached." });
        setIsBreachModalOpen(false);
        setBreachReasonInput('');
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetAccount = async () => {
    if (!previewUserId) return;
    setActionLoading(true);
    try {
      const accRef = collection(db, 'users', previewUserId, 'accounts');
      const q = query(accRef, orderBy('createdAt', 'desc'), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Error", description: "No account found for this user." });
      } else {
        const accDoc = snap.docs[0];
        const data = accDoc.data();
        await updateDoc(accDoc.ref, {
          status: 'active',
          balance: data.startingBalance || 100000,
          equity: data.startingBalance || 100000,
          accountActive: true,
          breachType: null,
          breachedAt: null,
          breachReason: null,
          updatedAt: serverTimestamp()
        });
        toast({ title: "Account Restored", description: "The account has been reset to active status." });
        setIsResetModalOpen(false);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAccount = async () => {
    if (!previewUserId || !assignForm.login || !assignForm.password) {
      toast({ variant: "destructive", title: "Missing Fields", description: "MT5 Login and Password are required." });
      return;
    }
    setActionLoading(true);
    try {
      const accRef = collection(db, 'users', previewUserId, 'accounts');
      const startBalance = parseFloat(assignForm.size.replace('$', '').replace(',', '').replace('k', '000')) || 100000;
      
      await addDoc(accRef, {
        plan: assignForm.plan,
        size: assignForm.size,
        mt5Login: assignForm.login,
        mt5Password: assignForm.password,
        mt5Server: assignForm.server,
        status: 'active',
        accountActive: true,
        balance: startBalance,
        startingBalance: startBalance,
        equity: startBalance,
        userId: previewUserId,
        createdAt: serverTimestamp(),
        startDate: new Date().toISOString()
      });
      toast({ title: "Account Assigned", description: "New trading credentials linked successfully." });
      setIsAssignModalOpen(false);
      setAssignForm({ plan: '1-Step Pro', size: '$100k', login: '', password: '', server: 'PrimeFunded-Live' });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (previewUserId) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed top-0 left-0 w-full z-[100] bg-primary h-14 flex items-center justify-between px-6 shadow-xl">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
              <span className="text-xs font-black uppercase tracking-widest text-primary-foreground">Previewing Auth UID: {previewUserId}</span>
            </div>
            
            <div className="h-8 w-px bg-primary-foreground/20" />
            
            {/* Quick Actions Control Bar */}
            <div className="flex items-center gap-3">
               <Button size="sm" variant="destructive" className="h-9 text-[10px] font-black uppercase tracking-widest border border-white/20" onClick={() => setIsBreachModalOpen(true)}>
                 <XCircle className="w-3.5 h-3.5 mr-1.5" /> Breach Account
               </Button>
               <Button size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest bg-orange-600 hover:bg-orange-700 text-white border border-white/20" onClick={() => setIsResetModalOpen(true)}>
                 <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset Account
               </Button>
               <Button size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white border border-white/20" onClick={() => setIsAssignModalOpen(true)}>
                 <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Assign Account
               </Button>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="h-9 px-6 text-xs font-bold cursor-pointer" onClick={() => setPreviewUserId(null)}>
            <ChevronLeft className="w-3 h-3 mr-1" /> Exit Preview
          </Button>
        </div>
        <div className="pt-14">
          <DashboardPage adminViewMode={true} targetUid={previewUserId} />
        </div>

        {/* Action Modal: Breach */}
        <Dialog open={isBreachModalOpen} onOpenChange={setIsBreachModalOpen}>
          <DialogContent className="bg-card border-destructive/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Confirm Hard Breach</DialogTitle>
              <DialogDescription className="text-muted-foreground">This will terminate the user's active challenge and set balance to zero. This action is irreversible without a manual reset.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Reason for Termination</Label>
                <Textarea 
                  placeholder="e.g. Max Daily Drawdown hit (5.2%)" 
                  className="bg-secondary/30 min-h-[100px]"
                  value={breachReasonInput}
                  onChange={e => setBreachReasonInput(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsBreachModalOpen(false)} disabled={actionLoading}>Cancel</Button>
              <Button variant="destructive" onClick={handleBreachAccount} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />} Terminate Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Modal: Reset */}
        <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
          <DialogContent className="bg-card border-orange-500/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-orange-500">Restore Account Status</DialogTitle>
              <DialogDescription>Reset this account to "Active" and restore the original starting balance? Any breach records will be cleared.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button variant="ghost" onClick={() => setIsResetModalOpen(false)} disabled={actionLoading}>Cancel</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold" onClick={handleResetAccount} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />} Yes, Reset Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Action Modal: Assign */}
        <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
          <DialogContent className="bg-card border-emerald-500/20 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-emerald-500">Assign Institutional Capital</DialogTitle>
              <DialogDescription>Provision a new trading account for this trader.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Type</Label>
                  <Select value={assignForm.plan} onValueChange={v => setAssignForm({...assignForm, plan: v})}>
                    <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-Step Pro">1-Step Pro</SelectItem>
                      <SelectItem value="2-Step Classic">2-Step Classic</SelectItem>
                      <SelectItem value="Instant Funding">Instant Funding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Account Size</Label>
                  <Select value={assignForm.size} onValueChange={v => setAssignForm({...assignForm, size: v})}>
                    <SelectTrigger className="bg-secondary/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$5k">$5,000</SelectItem>
                      <SelectItem value="$10k">$10,000</SelectItem>
                      <SelectItem value="$25k">$25,000</SelectItem>
                      <SelectItem value="$50k">$50,000</SelectItem>
                      <SelectItem value="$100k">$100,000</SelectItem>
                      <SelectItem value="$200k">$200,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>MT5 Login ID</Label>
                <Input placeholder="Enter login number" className="bg-secondary/30" value={assignForm.login} onChange={e => setAssignForm({...assignForm, login: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>MT5 Master Password</Label>
                <Input placeholder="Enter password" type="text" className="bg-secondary/30" value={assignForm.password} onChange={e => setAssignForm({...assignForm, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>MT5 Trading Server</Label>
                <Input placeholder="PrimeFunded-Live" className="bg-secondary/30" value={assignForm.server} onChange={e => setAssignForm({...assignForm, server: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)} disabled={actionLoading}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handleAssignAccount} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />} Assign Credentials
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden relative">
      <Navigation />
      
      {!isAuthenticated && (
        <div className="absolute inset-0 z-40 bg-background/60 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center space-y-4 animate-pulse">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
            <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Admin Terminal Restricted</p>
            <p className="text-[10px] text-muted-foreground/60">Tap branding to authenticate</p>
          </div>
        </div>
      )}

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
                   placeholder="Quick search user/order/UID..." 
                   className="pl-10 h-10 bg-secondary/50 text-white border-border/50" 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)} 
                 />
               </div>
               <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading || !isAuthenticated} className="bg-secondary/50 border-border/50">
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
          {isAuthenticated ? (
            <>
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
                                    <p className="text-[10px] text-muted-foreground">UID: {u.uid || u.traderId || '--------'}</p>
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
                                  <div className="text-[10px] text-muted-foreground font-mono" title={u.uid || u.traderId}>UID: {u.uid || u.traderId || '--------'}</div>
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
                                  <div className="flex items-center justify-end gap-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10" onClick={() => { setSelectedUser(u); setIsGiftModalOpen(true); }}>
                                            <Gift className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Gift Capital Account</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
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
                    )}
                  </CardContent>
                </Card>
              </div>

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
                                     <button className="text-muted-foreground hover:text-primary transition-colors" onClick={() => { navigator.clipboard.writeText(o.txHash); toast({ title: "Copied" }); }}>
                                        <Copy className="w-3 h-3" />
                                     </button>
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

              <div className={cn("space-y-8", activeTab === 'settings' ? "block" : "hidden")}>
                <div className="max-w-3xl grid gap-8">
                  <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" /> Brand Identity
                      </CardTitle>
                      <CardDescription>Update the platform logo via direct storage in Firestore (Base64).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-background/50 rounded-2xl border border-white/5">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-full border-2 border-primary/20 bg-secondary/50 flex items-center justify-center overflow-hidden shadow-2xl">
                            {(logoPreview || branding.logoUrl) ? (
                              <Image src={logoPreview || branding.logoUrl || ''} alt="Platform Logo" width={96} height={96} className="object-cover" />
                            ) : (
                              <ImageIcon className="w-10 h-10 text-muted-foreground opacity-20" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 space-y-4 text-center md:text-left">
                          <div>
                            <h4 className="font-bold text-white">{logoFile ? 'Review Selected Logo' : 'Current Logo'}</h4>
                            <p className="text-xs text-muted-foreground">Displayed in navbar, auth screens, and loading sequence.</p>
                          </div>
                          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="font-bold cursor-pointer"
                              onClick={() => { fileInputRef.current?.click(); setIsUploadDone(false); }}
                              disabled={uploadingLogo}
                            >
                              <Upload className="w-4 h-4 mr-2" /> {logoFile ? 'Change Selection' : 'Select New Logo'}
                            </Button>
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept=".png,.jpg,.jpeg,.svg" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setLogoFile(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => setLogoPreview(reader.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            {logoFile && (
                              <Button 
                                className="font-bold cyan-box-glow cursor-pointer" 
                                size="sm"
                                onClick={handleLogoUpload}
                                disabled={uploadingLogo}
                              >
                                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Apply Logo (Database)
                              </Button>
                            )}
                          </div>
                          
                          {uploadingLogo && (
                            <div className="w-full mt-4 space-y-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Syncing with database...</p>
                              <Progress value={undefined} className="h-1.5 bg-secondary" />
                            </div>
                          )}

                          {isUploadDone && !uploadingLogo && (
                            <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-accent text-[10px] font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-1">
                              <CheckCircle2 className="w-4 h-4" /> Branding Synchronized
                            </div>
                          )}
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
                             Discord Invite
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
                            Instagram Profile
                          </Label>
                          <Input 
                            placeholder="https://instagram.com/..." 
                            value={socialLinks.instagram}
                            onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})}
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
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
               <div className="text-center space-y-6 max-sm">
                  <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto border border-border">
                    <Shield className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-white">Direct Access Denied</h2>
                  <p className="text-muted-foreground text-sm">You must authenticate via the stealth terminal to access administrative metrics.</p>
                  <Button variant="outline" className="font-bold" onClick={() => setShowAdminModal(true)}>Enter Access Key</Button>
               </div>
            </div>
          )}
        </div>
      </main>

      <Dialog open={showAdminModal} onOpenChange={(open) => { if (!isAuthenticated) return; setShowAdminModal(open); }}>
        <DialogContent className="bg-[#0a0f1e] border-[#00d4ff] text-white sm:max-w-[400px] p-8 shadow-[0_0_50px_rgba(0,212,255,0.2)]">
          <DialogHeader className="text-center mb-6">
            <DialogTitle className="text-2xl font-headline font-bold text-[#00d4ff] tracking-tight">🔐 Admin Access</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs uppercase tracking-widest font-black">Authorized Personnel Only</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminAuth} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-[0.2em]">Security Protocol</Label>
              <Input 
                type="password" 
                placeholder="Enter admin password" 
                value={adminPasswordInput} 
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                className="bg-[#0a0f1e]/50 border-white/10 text-white focus:border-[#00d4ff] h-12 text-center font-mono"
                autoFocus
              />
              {adminError && (
                <p className="text-[10px] font-bold text-destructive uppercase tracking-widest text-center mt-2 animate-pulse">
                  {adminError}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full h-12 font-bold bg-[#00d4ff] text-[#0a0f1e] hover:bg-[#00d4ff]/90 shadow-[0_0_20px_rgba(0,212,255,0.4)]">
                Unlock Terminal
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdminModal(false)} className="w-full text-muted-foreground hover:text-white font-bold text-xs uppercase tracking-widest">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

      {/* Gift Account Modal */}
      <Dialog open={isGiftModalOpen} onOpenChange={setIsGiftModalOpen}>
        <DialogContent className="bg-card border-amber-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-500 flex items-center gap-2">
              <Gift className="w-5 h-5" /> Gift Account to {selectedUser?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Directly provision institutional capital credentials to this trader's profile.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Type</Label>
                <Select value={giftForm.plan} onValueChange={v => setGiftForm({...giftForm, plan: v})}>
                  <SelectTrigger className="bg-secondary/30 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-Step Pro">1-Step Pro</SelectItem>
                    <SelectItem value="2-Step Classic">2-Step Classic</SelectItem>
                    <SelectItem value="Instant Funding">Instant Funding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Size</Label>
                <Select value={giftForm.size} onValueChange={v => setGiftForm({...giftForm, size: v})}>
                  <SelectTrigger className="bg-secondary/30 h-10"><SelectValue /></SelectTrigger>
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
              <Label>MT5 Login ID</Label>
              <Input placeholder="Enter MT5 account number" className="bg-secondary/30" value={giftForm.login} onChange={e => setGiftForm({...giftForm, login: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>MT5 Master Password</Label>
              <Input placeholder="Enter password" type="text" className="bg-secondary/30" value={giftForm.password} onChange={e => setAssignForm({...assignForm, password: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>MT5 Trading Server</Label>
              <Input placeholder="PrimeFunded-Live" className="bg-secondary/30" value={giftForm.server} onChange={e => setGiftForm({...giftForm, server: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Note to Trader (Optional)</Label>
              <Textarea placeholder="Congratulations on your free account!" className="bg-secondary/30 min-h-[80px]" value={giftForm.note} onChange={e => setGiftForm({...giftForm, note: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsGiftModalOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold" onClick={handleGiftAccount} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gift className="w-4 h-4 mr-2" />} Gift Account
            </Button>
          </DialogFooter>
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

function LoadingTable() {
  return (
    <div className="space-y-4 p-8">
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
    </div>
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
