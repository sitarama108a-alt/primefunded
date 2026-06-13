
"use client";

import { useState, useMemo, Suspense, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Wallet, 
  Search, 
  Check, 
  X, 
  Trash2, 
  ExternalLink, 
  Settings as SettingsIcon,
  Bell,
  Mail,
  RefreshCw,
  Phone,
  Globe,
  User,
  Activity,
  UserCheck,
  AlertTriangle,
  Fingerprint,
  TrendingUp,
  Edit2,
  MoreVertical,
  Gift,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  ChevronLeft
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp, getDoc, addDoc, collection } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DashboardPage from '@/app/dashboard/page';
import { cn } from '@/lib/utils';
import { sendKycApprovalEmail, sendKycRejectionEmail } from '@/lib/email';

const ADMIN_PASSWORD = "93463962569392846256";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const db = useFirestore();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);
  const [isGrantFreeOpen, setIsGrantFreeOpen] = useState(false);
  
  const [provisionPlan, setProvisionPlan] = useState('1-Step Pro');
  const [provisionSize, setProvisionSize] = useState('$100,000');
  const [rejectionReason, setRejectionReason] = useState('');

  const emptyConstraints = useMemo(() => [], []);
  const { data: orders } = useCollection<any>('orders', emptyConstraints);
  const { data: traders } = useCollection<any>('users', emptyConstraints);
  const { data: accounts } = useCollection<any>('accounts', emptyConstraints);
  const { data: payouts } = useCollection<any>('payouts', emptyConstraints);
  const { data: referrals } = useCollection<any>('referrals', emptyConstraints);

  const filteredTraders = useMemo(() => {
    if (!searchTerm) return traders;
    const lower = searchTerm.toLowerCase();
    return traders.filter(t => 
      t.name?.toLowerCase().includes(lower) || 
      t.email?.toLowerCase().includes(lower) ||
      t.traderId?.toLowerCase().includes(lower) ||
      t.referralCode?.toLowerCase().includes(lower)
    );
  }, [traders, searchTerm]);

  const kycStats = useMemo(() => {
    const pending = traders.filter(t => t.kycStatus === 'pending').length;
    const verified = traders.filter(t => t.kycVerified === true).length;
    const rejected = traders.filter(t => t.kycStatus === 'rejected').length;
    return { pending, verified, rejected };
  }, [traders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Admin Access Granted" });
    } else {
      toast({ variant: "destructive", title: "Access Denied" });
    }
  };

  const handleVerifyOrder = async (order: any) => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { status: 'verified' });
      
      const accountId = Math.random().toString(36).substring(7).toUpperCase();
      const login = Math.floor(1000000 + Math.random() * 9000000).toString();
      const password = Math.random().toString(36).substring(2, 12);
      
      const accountData = {
        userId: order.userId,
        email: order.email,
        plan: order.plan,
        size: order.size,
        mt5Login: login,
        mt5Password: password,
        mt5Server: "PrimeFunded-Live",
        balance: parseFloat(order.size.replace('$', '').replace(',', '').replace('k', '000')),
        status: "active",
        startDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'accounts', accountId), accountData);
      
      const userRef = doc(db, 'users', order.userId);
      await updateDoc(userRef, {
        plan: order.plan,
        accountSize: order.size,
        balance: accountData.balance
      });

      // Handle Referral Commission
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      if (userData?.referredBy) {
        const priceNum = parseFloat(order.price.replace('$', '').replace(',', ''));
        const commission = Math.min(priceNum * 0.10, 50);
        
        await addDoc(collection(db, 'referrals'), {
          referrerId: userData.referredBy,
          referredUserId: order.userId,
          referredUserEmail: order.email,
          orderId: order.id,
          plan: order.plan,
          amount: commission,
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }

      toast({ title: "Order Verified", description: `Account created for ${order.email}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed" });
    }
  };

  const handleGrantFreeAccess = async () => {
    if (!selectedUser) return;
    try {
      const accountId = Math.random().toString(36).substring(7).toUpperCase();
      const login = Math.floor(1000000 + Math.random() * 9000000).toString();
      const password = Math.random().toString(36).substring(2, 12);
      
      const accountData = {
        userId: selectedUser.id,
        email: selectedUser.email,
        plan: provisionPlan,
        size: provisionSize,
        mt5Login: login,
        mt5Password: password,
        mt5Server: "PrimeFunded-Live",
        balance: parseFloat(provisionSize.replace('$', '').replace(',', '').replace('k', '000')),
        status: "active",
        startDate: new Date().toISOString(),
        paymentStatus: "free_grant",
        grantedBy: "admin",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'accounts', accountId), accountData);
      toast({ title: "Free Challenge Granted", description: `Account ${login} provisioned for ${selectedUser.email}` });
      setIsGrantFreeOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to grant access." });
    }
  };

  const handleUpdateKyc = async (userId: string, status: 'verified' | 'rejected', reason?: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        kycVerified: status === 'verified',
        kycStatus: status,
        kycRejectionReason: reason || null,
        kycVerifiedAt: status === 'verified' ? serverTimestamp() : null
      });

      const userSnap = await getDoc(userRef);
      const email = userSnap.data()?.email;

      if (status === 'verified') {
        await sendKycApprovalEmail(email);
      } else {
        await sendKycRejectionEmail(email, reason || "Documents did not meet our requirements.");
      }

      toast({ title: `KYC ${status === 'verified' ? 'Approved' : 'Rejected'}` });
      setIsManageAccountOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    await updateDoc(doc(db, 'users', userId), { status: newStatus });
    toast({ title: `User ${newStatus}` });
  };

  const handleUpdateReferral = async (id: string, status: string) => {
    const refDoc = doc(db, 'referrals', id);
    await updateDoc(refDoc, { status });
    toast({ title: `Referral marked as ${status}` });
  };

  if (previewUserId) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed top-0 left-0 w-full z-[100] bg-primary h-12 flex items-center justify-between px-6 shadow-lg">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            <span className="text-xs font-black uppercase tracking-widest text-primary-foreground">Admin View Mode: Previewing {previewUserId}</span>
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-8 text-xs font-bold" 
            onClick={() => setPreviewUserId(null)}
          >
            <ChevronLeft className="w-3 h-3 mr-1" /> Back to Admin
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
        <Card className="w-full max-w-md border-primary/20 bg-card/50">
          <CardHeader className="text-center">
            <Lock className="text-primary w-12 h-12 mx-auto mb-4" />
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="Master Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">Verify Credentials</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-secondary/50 p-1 h-12 w-full justify-start rounded-xl overflow-x-auto">
            <TabsTrigger value="overview"><Activity className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingCart className="w-4 h-4 mr-2" /> Orders</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
            <TabsTrigger value="kyc"><Fingerprint className="w-4 h-4 mr-2" /> KYC Hub</TabsTrigger>
            <TabsTrigger value="referrals"><TrendingUp className="w-4 h-4 mr-2" /> Referrals</TabsTrigger>
            <TabsTrigger value="payouts"><Wallet className="w-4 h-4 mr-2" /> Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Traders" value={traders.length} icon={<Users />} />
              <StatCard title="Pending KYC" value={kycStats.pending} icon={<Fingerprint className="text-amber-500" />} />
              <StatCard title="Pending Payouts" value={payouts?.filter(p => p.status === 'pending').length} icon={<Wallet />} />
              <StatCard title="Total Referral Owed" value={`$${referrals?.filter(r => r.status === 'pending').reduce((acc, r) => acc + (r.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={<TrendingUp />} />
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Customer</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Plan</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Status</th>
                      <th className="py-4 px-4 text-right uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b hover:bg-secondary/10 transition-colors">
                        <td className="py-4 px-4">{o.email}</td>
                        <td className="py-4 px-4 font-bold">{o.plan} - {o.size}</td>
                        <td className="py-4 px-4"><Badge variant={o.status === 'verified' ? 'default' : 'outline'}>{o.status}</Badge></td>
                        <td className="py-4 px-4 text-right">
                          {o.status === 'pending' && <Button size="sm" onClick={() => handleVerifyOrder(o)}>Verify</Button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex justify-between">
                  <Input placeholder="Search users by Name, Email, UID or Referral Code..." className="max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-secondary/30">
                        <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">ID / Code</th>
                        <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Name</th>
                        <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Email / Phone</th>
                        <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">KYC / Account</th>
                        <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Changes</th>
                        <th className="py-4 px-4 text-right uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTraders.map((t) => (
                        <tr key={t.id} className="border-b hover:bg-secondary/10 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-white">{t.traderId}</span>
                              <span className="text-[10px] text-primary font-bold">{t.referralCode}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-bold text-white">{t.name}</td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="text-white">{t.email}</span>
                              <span className="text-xs text-muted-foreground">{t.phone || 'No phone'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-1.5">
                              {t.kycVerified ? (
                                <Badge className="bg-accent text-[9px] h-5">KYC ✅</Badge>
                              ) : t.kycStatus === 'pending' ? (
                                <Badge variant="outline" className="border-amber-500 text-amber-500 text-[9px] h-5">KYC ⏳</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[9px] h-5">KYC ❌</Badge>
                              )}
                              <Badge variant={t.status === 'suspended' ? 'destructive' : 'outline'} className="text-[9px] h-5">
                                {t.status === 'suspended' ? 'SUSPENDED' : 'ACTIVE'}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="secondary" className="bg-secondary/50 text-white">{t.codeChangesCount || 0} / 3</Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="hover:bg-secondary"><MoreVertical className="w-4 h-4 text-white" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 bg-card border-border/50 shadow-2xl">
                                <DropdownMenuLabel className="text-white">User Actions</DropdownMenuLabel>
                                <DropdownMenuItem className="text-white hover:bg-secondary" onClick={() => { setSelectedUser(t); setIsManageAccountOpen(true); }}>
                                  <User className="w-4 h-4 mr-2" /> Manage Account
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-secondary" onClick={() => setPreviewUserId(t.id)}>
                                  <LayoutDashboard className="w-4 h-4 mr-2" /> View Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-secondary" onClick={() => { setSelectedUser(t); setIsGrantFreeOpen(true); }}>
                                  <Gift className="w-4 h-4 mr-2" /> Give Free Account
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border/50" />
                                <DropdownMenuItem className="text-destructive hover:bg-destructive/10" onClick={() => handleToggleUserStatus(t.id, t.status)}>
                                  <Ban className="w-4 h-4 mr-2" /> {t.status === 'suspended' ? 'Reactivate' : 'Suspend Account'}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard title="Pending Review" value={kycStats.pending} icon={<Clock className="text-amber-500" />} />
              <StatCard title="Verified Users" value={kycStats.verified} icon={<CheckCircle2 className="text-accent" />} />
              <StatCard title="Rejected" value={kycStats.rejected} icon={<XCircle className="text-destructive" />} />
            </div>

            <Card className="bg-card/40 border-border/50">
              <CardHeader>
                <CardTitle className="text-white">KYC Submissions</CardTitle>
                <CardDescription>Review and verify user identity documents.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">User</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Status</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Submitted</th>
                      <th className="py-4 px-4 text-right uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traders.filter(t => t.kycStatus === 'pending').map((t) => (
                      <tr key={t.id} className="border-b hover:bg-secondary/10 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{t.name}</span>
                            <span className="text-xs text-muted-foreground">{t.email}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4"><Badge variant="outline" className="border-amber-500 text-amber-500">PENDING</Badge></td>
                        <td className="py-4 px-4 text-xs text-muted-foreground">{t.kycSubmittedAt ? new Date(t.kycSubmittedAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-4 px-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedUser(t); setIsManageAccountOpen(true); }}>View & Verify</Button>
                        </td>
                      </tr>
                    ))}
                    {traders.filter(t => t.kycStatus === 'pending').length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-muted-foreground italic">No pending KYC submissions.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Trader</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Amount</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">KYC Status</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Request Status</th>
                      <th className="py-4 px-4 text-right uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts?.map((p) => {
                      const user = traders.find(t => t.id === p.userId);
                      return (
                        <tr key={p.id} className="border-b hover:bg-secondary/10 transition-colors text-white">
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold">{user?.name || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">{p.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-bold text-accent">${parseFloat(p.amount).toLocaleString('en-US')}</td>
                          <td className="py-4 px-4">
                            {user?.kycVerified ? (
                              <Badge className="bg-accent text-accent-foreground text-[9px] h-5">KYC ✅ VERIFIED</Badge>
                            ) : user?.kycStatus === 'pending' ? (
                              <Badge variant="outline" className="border-amber-500 text-amber-500 text-[9px] h-5">KYC ⏳ PENDING</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[9px] h-5">KYC ❌ UNVERIFIED</Badge>
                            )}
                          </td>
                          <td className="py-4 px-4"><Badge variant={p.status === 'done' ? 'default' : 'outline'}>{p.status}</Badge></td>
                          <td className="py-4 px-4 text-right">
                            {p.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  className="bg-accent text-accent-foreground font-bold"
                                  disabled={!user?.kycVerified}
                                  onClick={() => updateDoc(doc(db, 'payouts', p.id), { status: 'approved' })}
                                >
                                  Approve
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {payouts?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-muted-foreground italic">No payout requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ... Referrals tab content matching same styling ... */}
          <TabsContent value="referrals">
            <Card className="bg-card/40 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-white">Referral Commissions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Referrer UID</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Referred User</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Commission</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Status</th>
                      <th className="py-4 px-4 text-right uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-secondary/10 transition-colors text-white">
                        <td className="py-4 px-4 font-mono font-bold text-primary">{traders.find(t => t.id === r.referrerId)?.traderId || 'N/A'}</td>
                        <td className="py-4 px-4">{r.referredUserEmail}</td>
                        <td className="py-4 px-4 text-accent font-bold">${parseFloat(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 px-4"><Badge variant={r.status === 'paid' ? 'default' : 'outline'}>{r.status}</Badge></td>
                        <td className="py-4 px-4 text-right">
                          {r.status === 'pending' && (
                            <Button size="sm" className="bg-accent text-accent-foreground font-bold" onClick={() => handleUpdateReferral(r.id, 'paid')}>Mark Paid</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Manage Account Dialog */}
        <Dialog open={isManageAccountOpen} onOpenChange={setIsManageAccountOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-primary/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline flex items-center gap-2 text-white">
                <User className="w-6 h-6 text-primary" /> Manage User Account
              </DialogTitle>
              <DialogDescription>
                Detailed overview and administrative controls for {selectedUser?.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid md:grid-cols-2 gap-8 py-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Personal Info
                  </h4>
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/30 border border-white/5 shadow-inner">
                    <DetailBox label="Full Name" value={selectedUser?.name} />
                    <DetailBox label="Email" value={selectedUser?.email} />
                    <DetailBox label="Phone" value={selectedUser?.phone || 'N/A'} />
                    <DetailBox label="Country" value={selectedUser?.country || 'N/A'} />
                    <DetailBox label="UID" value={selectedUser?.traderId} />
                    <DetailBox label="Referral Code" value={selectedUser?.referralCode} />
                    <DetailBox label="Joined" value={selectedUser?.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString() : 'N/A'} />
                    <DetailBox label="Account Status" value={selectedUser?.status?.toUpperCase()} color={selectedUser?.status === 'suspended' ? 'text-destructive' : 'text-accent'} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Fingerprint className="w-3.5 h-3.5" /> KYC Status
                  </h4>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 space-y-4 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-white">Current Status:</span>
                      <Badge variant={selectedUser?.kycVerified ? 'default' : 'outline'} className={selectedUser?.kycVerified ? 'bg-accent text-accent-foreground' : 'text-amber-500 border-amber-500'}>
                        {selectedUser?.kycVerified ? 'VERIFIED' : selectedUser?.kycStatus?.toUpperCase() || 'NOT SUBMITTED'}
                      </Badge>
                    </div>
                    {selectedUser?.kycStatus === 'pending' && (
                      <div className="pt-4 border-t border-white/5 space-y-4">
                        <div className="space-y-2 text-center py-4 bg-background/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-4 italic">Verification documents should be reviewed against compliance standards.</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white">Rejection Reason (Optional)</Label>
                          <Input 
                            placeholder="e.g. ID blurry, wrong document type..." 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="bg-background/50 border-border"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1 bg-accent text-accent-foreground font-bold" onClick={() => handleUpdateKyc(selectedUser.id, 'verified')}>Approve KYC</Button>
                          <Button variant="destructive" className="flex-1 font-bold" onClick={() => handleUpdateKyc(selectedUser.id, 'rejected', rejectionReason)}>Reject KYC</Button>
                        </div>
                      </div>
                    )}
                    {selectedUser?.kycStatus === 'rejected' && (
                       <div className="p-2 bg-destructive/10 rounded-lg">
                         <p className="text-[10px] text-destructive font-bold uppercase mb-1">Last Rejection Reason:</p>
                         <p className="text-xs text-white">{selectedUser?.kycRejectionReason}</p>
                       </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Account Access & Trading
                  </h4>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 space-y-4 shadow-inner">
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="secondary" 
                        className="w-full justify-start font-bold bg-background/50 hover:bg-background" 
                        onClick={() => setPreviewUserId(selectedUser.id)}
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2 text-primary" /> View Dashboard (Admin View)
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start text-destructive hover:text-white hover:bg-destructive font-bold border-destructive/30"
                        onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.status)}
                      >
                        <Ban className="w-4 h-4 mr-2" /> {selectedUser?.status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start font-bold text-white border-primary/30 hover:bg-primary/10"
                        onClick={() => { setIsManageAccountOpen(false); setIsGrantFreeOpen(true); }}
                      >
                        <Gift className="w-4 h-4 mr-2 text-primary" /> Give Free Challenge Access
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" /> Referral Info
                  </h4>
                  <div className="p-4 rounded-xl bg-secondary/30 border border-white/5 grid grid-cols-2 gap-4 shadow-inner">
                    <DetailBox label="Referred By" value={selectedUser?.referredBy || 'Organic'} />
                    <DetailBox label="Referral Count" value={referrals?.filter(r => r.referrerId === selectedUser?.id).length || 0} />
                    <DetailBox label="Total Earnings" value={`$${referrals?.filter(r => r.referrerId === selectedUser?.id).reduce((acc, r) => acc + (r.amount || 0), 0).toFixed(2)}`} />
                    <DetailBox label="Code Changes" value={`${selectedUser?.codeChangesCount || 0} / 3`} />
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsManageAccountOpen(false)} className="font-bold border-border/50">Close Manager</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grant Free Account Dialog */}
        <Dialog open={isGrantFreeOpen} onOpenChange={setIsGrantFreeOpen}>
          <DialogContent className="bg-card border-primary/20 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Grant Free Challenge Access</DialogTitle>
              <DialogDescription>
                Provision a free trading challenge for {selectedUser?.name}. This will bypass payment verification.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-white">Challenge Plan</Label>
                <Select value={provisionPlan} onValueChange={setProvisionPlan}>
                  <SelectTrigger className="bg-background/50 border-border text-white">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="1-Step Pro">1-Step Pro</SelectItem>
                    <SelectItem value="2-Step Classic">2-Step Classic</SelectItem>
                    <SelectItem value="3-Step Classic">3-Step Classic</SelectItem>
                    <SelectItem value="Instant Funding">Instant Funding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white">Account Size</Label>
                <Select value={provisionSize} onValueChange={setProvisionSize}>
                  <SelectTrigger className="bg-background/50 border-border text-white">
                    <SelectValue placeholder="Select Size" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="$5,000">$5,000</SelectItem>
                    <SelectItem value="$10,000">$10,000</SelectItem>
                    <SelectItem value="$25,000">$25,000</SelectItem>
                    <SelectItem value="$50,000">$50,000</SelectItem>
                    <SelectItem value="$100,000">$100,000</SelectItem>
                    <SelectItem value="$200,000">$200,000</SelectItem>
                    <SelectItem value="$300,000">$300,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGrantFreeOpen(false)} className="border-border text-white hover:bg-secondary">Cancel</Button>
              <Button onClick={handleGrantFreeAccess} className="bg-accent text-accent-foreground font-bold">Grant Free Access</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: any, icon: any }) {
  return (
    <Card className="p-6 bg-card/40 border-border/50 group hover:border-primary/50 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</p>
        <div className="text-primary group-hover:scale-110 transition-transform">{icon}</div>
      </div>
      <p className="text-3xl font-bold font-headline tabular-nums text-white">{value}</p>
    </Card>
  );
}

function DetailBox({ label, value, color }: { label: string, value: any, color?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-bold truncate", color || "text-white")}>{value || 'N/A'}</p>
    </div>
  );
}
