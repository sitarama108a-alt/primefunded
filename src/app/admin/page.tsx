
"use client";

import { useState, useMemo, useEffect, memo } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, Shield, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, MoreVertical, Gift, Ban, CheckCircle2, XCircle, Clock, LayoutDashboard, ChevronLeft, Bell, Send, User, History, Award, BarChart3, Search, ExternalLink, Plus
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, setDoc, serverTimestamp, getDoc, addDoc, collection, writeBatch, limit, orderBy, query, collectionGroup } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { sendKycApprovalEmail, sendKycRejectionEmail, sendBroadcastEmail, sendFreeAccountGrantEmail, sendReferralCommissionEmail, sendPayoutProcessedEmail } from '@/lib/email';
import { Textarea } from '@/components/ui/textarea';
import DashboardPage from '@/app/dashboard/page';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const ADMIN_PASSWORD = "93463962569392846256";
const PAGE_SIZE = 20;

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
  
  const [ordersLimit, setOrdersLimit] = useState(PAGE_SIZE);
  const [usersLimit, setUsersLimit] = useState(PAGE_SIZE);
  const [payoutsLimit, setPayoutsLimit] = useState(PAGE_SIZE);
  
  const { toast } = useToast();
  const db = useFirestore();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);
  const [isFreeAccountOpen, setIsFreeAccountOpen] = useState(false);
  const [isKycReviewOpen, setIsKycReviewOpen] = useState(false);
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [provisionPlan, setProvisionPlan] = useState('1-Step Pro');
  const [provisionSize, setProvisionSize] = useState('$100,000');

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifPriority, setNotifPriority] = useState('normal');
  const [notifTarget, setNotifTarget] = useState('all');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_active_tab');
    if (saved) setActiveTab(saved);
  }, []);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    localStorage.setItem('admin_active_tab', val);
  };

  const ordersConstraints = useMemo(() => [orderBy('date', 'desc'), limit(ordersLimit)], [ordersLimit]);
  const usersConstraints = useMemo(() => [limit(usersLimit)], [usersLimit]);
  const payoutsConstraints = useMemo(() => [orderBy('date', 'desc'), limit(payoutsLimit)], [payoutsLimit]);
  const referralsConstraints = useMemo(() => [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)], []);
  const broadcastsConstraints = useMemo(() => [orderBy('sentAt', 'desc'), limit(10)], []);

  const { data: orders, loading: ordersLoading } = useCollection<any>('orders', ordersConstraints);
  const { data: traders, loading: tradersLoading } = useCollection<any>('users', usersConstraints);
  const { data: payouts, loading: payoutsLoading } = useCollection<any>('payouts', payoutsConstraints);
  const { data: referrals } = useCollection<any>('referrals', referralsConstraints);
  const { data: broadcasts } = useCollection<any>('broadcasts', broadcastsConstraints);

  const stats = useMemo(() => {
    if (!orders || !traders || !payouts) return null;
    
    const totalRevenue = orders.filter(o => o.status === 'verified').reduce((acc, o) => acc + parseFloat(o.price?.replace('$', '') || 0), 0) || 0;
    const pendingKyc = traders.filter(t => t.kycStatus === 'pending').length || 0;
    const pendingPayouts = payouts.filter(p => p.status === 'pending').length || 0;
    const activeChallenges = orders.filter(o => o.status === 'verified').length || 0;

    return {
      totalUsers: traders.length,
      totalOrders: orders.length,
      revenue: totalRevenue,
      pendingKyc,
      pendingPayouts,
      activeChallenges
    };
  }, [traders, orders, payouts]);

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
    const orderRef = doc(db, 'orders', order.id);
    const accountId = Math.random().toString(36).substring(7).toUpperCase();
    const login = Math.floor(1000000 + Math.random() * 9000000).toString();
    const pass = Math.random().toString(36).substring(2, 12);
    
    const accountData = {
      userId: order.userId,
      email: order.email,
      plan: order.plan,
      size: order.size,
      mt5Login: login,
      mt5Password: pass,
      mt5Server: "PrimeFunded-Live",
      balance: parseFloat(order.size?.replace('$', '').replace(',', '').replace('k', '000') || 0),
      status: "active",
      startDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };

    updateDoc(orderRef, { status: 'verified' })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: orderRef.path, operation: 'update', requestResourceData: { status: 'verified' } }));
      });
      
    // Provision to subcollection for scalability
    setDoc(doc(db, 'users', order.userId, 'accounts', accountId), accountData)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `users/${order.userId}/accounts/${accountId}`, operation: 'create', requestResourceData: accountData }));
      });

    try {
      const userSnap = await getDoc(doc(db, 'users', order.userId));
      const referredBy = userSnap.data()?.referredBy;
      if (referredBy) {
        const amount = Math.min(parseFloat(order.price?.replace('$', '') || 0) * 0.10, 50);
        const referralId = Math.random().toString(36).substring(7);
        setDoc(doc(db, 'referrals', referralId), {
          referrerId: referredBy,
          referredUserId: order.userId,
          referredUserEmail: order.email,
          orderId: order.id,
          plan: order.plan,
          amount: amount,
          status: 'pending',
          createdAt: serverTimestamp()
        });
        
        const referrerSnap = await getDoc(doc(db, 'users', referredBy));
        if (referrerSnap.exists()) {
          const rData = referrerSnap.data();
          const prefs = rData.notificationPreferences || { inApp: true, email: true, referral: true };
          if (prefs.inApp && prefs.referral) {
            addDoc(collection(db, 'users', referredBy, 'notifications'), {
              title: "👥 Referral Earned!",
              message: `Your referral just purchased a challenge. You earned $${amount.toFixed(2)} commission!`,
              type: 'referral_earned',
              isRead: false,
              createdAt: serverTimestamp()
            });
          }
          if (prefs.email && prefs.referral) {
            sendReferralCommissionEmail(rData.email, amount, order.email);
          }
        }
      }
    } catch (err) {}

    toast({ title: "Order Verified", description: "Account created and user notified." });
  };

  const handleKycAction = (user: any, action: 'verified' | 'rejected') => {
    const userRef = doc(db, 'users', user.id);
    const updates: any = { 
      kycStatus: action,
      kycVerified: action === 'verified',
      kycRejectionReason: action === 'rejected' ? rejectionReason : null
    };

    updateDoc(userRef, updates)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: updates }));
      });

    const prefs = user.notificationPreferences || { inApp: true, email: true };
    if (prefs.inApp) {
      addDoc(collection(db, 'users', user.id, 'notifications'), {
        title: action === 'verified' ? "✅ KYC Approved" : "❌ KYC Rejected",
        message: action === 'verified' ? "Your documents were verified! Payouts unlocked." : `Your KYC was rejected. Reason: ${rejectionReason}`,
        type: action === 'verified' ? 'kyc_approved' : 'kyc_rejected',
        isRead: false,
        createdAt: serverTimestamp()
      });
    }

    if (action === 'verified') sendKycApprovalEmail(user.email);
    else sendKycRejectionEmail(user.email, rejectionReason);

    toast({ title: `KYC ${action.charAt(0).toUpperCase() + action.slice(1)}` });
    setIsKycReviewOpen(false);
    setRejectionReason('');
  };

  const handleGrantFreeAccount = () => {
    if (!selectedUser) return;
    const accountId = Math.random().toString(36).substring(7).toUpperCase();
    const login = Math.floor(1000000 + Math.random() * 9000000).toString();
    const pass = Math.random().toString(36).substring(2, 12);
    
    const accountData = {
      userId: selectedUser.id,
      email: selectedUser.email,
      plan: provisionPlan,
      size: provisionSize,
      mt5Login: login,
      mt5Password: pass,
      mt5Server: "PrimeFunded-Live",
      balance: parseFloat(provisionSize.replace('$', '').replace(',', '').replace('k', '000')),
      status: "active",
      startDate: new Date().toISOString(),
      paymentStatus: "free_grant",
      grantedBy: "admin",
      createdAt: serverTimestamp(),
    };

    setDoc(doc(db, 'users', selectedUser.id, 'accounts', accountId), accountData);
    
    addDoc(collection(db, 'users', selectedUser.id, 'notifications'), {
      title: "🎁 Free Account Granted",
      message: `An admin has granted you a free ${provisionSize} ${provisionPlan} account.`,
      type: 'admin_direct',
      isRead: false,
      createdAt: serverTimestamp()
    });

    sendFreeAccountGrantEmail(selectedUser.email, provisionPlan, provisionSize);
    toast({ title: "Account Granted Successfully" });
    setIsFreeAccountOpen(false);
  };

  const handleSendBroadcast = () => {
    if (!notifTitle || !notifMessage) return;
    setIsSendingNotif(true);
    
    let targetUsers = traders;
    if (notifTarget === 'kyc_pending') targetUsers = traders.filter(t => t.kycStatus === 'pending');
    if (notifTarget === 'funded') targetUsers = traders.filter(t => t.kycVerified === true);
    
    const batch = writeBatch(db);
    let sentCount = 0;

    // Firebase batch limit is 500. For 1M users, this should be handled in chunks via Cloud Functions.
    // For this MVP, we batch the first 500 for safety.
    targetUsers.slice(0, 500).forEach(u => {
      const prefs = u.notificationPreferences || { inApp: true, email: true, announcements: true };
      if (prefs.announcements) {
        if (prefs.inApp) {
          const notifRef = doc(collection(db, 'users', u.id, 'notifications'));
          batch.set(notifRef, {
            title: notifTitle,
            message: notifMessage,
            type: 'broadcast',
            priority: notifPriority,
            isRead: false,
            sentByAdmin: true,
            createdAt: serverTimestamp()
          });
        }
        if (prefs.email) {
          sendBroadcastEmail(u.email, notifTitle, notifMessage, u.name);
        }
        sentCount++;
      }
    });

    addDoc(collection(db, 'broadcasts'), {
      title: notifTitle,
      message: notifMessage,
      sentBy: "admin",
      targetGroup: notifTarget,
      sentAt: serverTimestamp(),
      totalRecipients: sentCount
    });

    batch.commit()
      .then(() => {
        toast({ title: "Broadcast Sent", description: `Delivered to ${sentCount} users.` });
        setNotifTitle('');
        setNotifMessage('');
        setIsSendingNotif(false);
      })
      .catch(() => {
        toast({ variant: "destructive", title: "Broadcast Failed" });
        setIsSendingNotif(false);
      });
  };

  if (previewUserId) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed top-0 left-0 w-full z-[100] bg-primary h-12 flex items-center justify-between px-6 shadow-lg">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            <span className="text-xs font-black uppercase tracking-widest text-primary-foreground">Admin View Mode: Previewing {previewUserId}</span>
          </div>
          <Button variant="secondary" size="sm" className="h-8 text-xs font-bold cursor-pointer" onClick={() => setPreviewUserId(null)}>
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
                <Label className="text-white">Master Key</Label>
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
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-headline font-bold mb-1 text-white">Administrative Terminal</h1>
              <p className="text-muted-foreground">Monitor performance, manage users, and process payouts.</p>
            </div>
            <div className="flex gap-4">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input 
                   placeholder="Quick search user/order..." 
                   className="pl-10 w-64 h-10 bg-secondary/50 text-white" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
               </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-secondary/50 p-1 h-12 w-full justify-start rounded-xl overflow-x-auto border border-border/50 shrink-0">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold px-6 rounded-lg cursor-pointer"><Activity className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold px-6 rounded-lg cursor-pointer"><ShoppingCart className="w-4 h-4 mr-2" /> Orders</TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold px-6 rounded-lg cursor-pointer"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
              <TabsTrigger value="kyc" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold px-6 rounded-lg cursor-pointer"><Fingerprint className="w-4 h-4 mr-2" /> KYC Hub</TabsTrigger>
              <TabsTrigger value="referrals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold px-6 rounded-lg cursor-pointer"><TrendingUp className="w-4 h-4 mr-2" /> Referrals</TabsTrigger>
              <TabsTrigger value="payouts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold px-6 rounded-lg cursor-pointer"><Wallet className="w-4 h-4 mr-2" /> Payouts</TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold px-6 rounded-lg cursor-pointer"><Bell className="w-4 h-4 mr-2" /> Broadcast</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          
          <div className={cn("space-y-8 animate-in fade-in duration-300", activeTab === 'overview' ? "block" : "hidden")}>
            {!stats ? <LoadingGrid /> : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<Wallet />} color="blue" />
                  <StatCard title="Total Traders" value={stats.totalUsers} icon={<Users />} color="purple" />
                  <StatCard title="Active Challenges" value={stats.activeChallenges} icon={<Award />} color="green" />
                  <StatCard title="Pending KYC" value={stats.pendingKyc} icon={<Fingerprint />} color="amber" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-2 border-border/50 bg-card/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white"><BarChart3 className="w-5 h-5 text-primary" /> Growth Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center border-t border-border/30">
                       <div className="text-center text-muted-foreground">
                         <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-10" />
                         <p className="text-sm font-medium">Platform growth tracking is visualizing...</p>
                       </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-border/50 bg-card/30">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2 text-white"><History className="w-5 h-5 text-primary" /> Activity Feed</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="divide-y divide-border/30">
                         {orders?.slice(0, 5).map((o: any) => (
                           <div key={o.id} className="p-4 flex items-center gap-3">
                             <div className="p-2 bg-primary/10 rounded-lg">
                               <ShoppingCart className="w-4 h-4 text-primary" />
                             </div>
                             <div>
                               <p className="text-xs font-bold text-white">{o.email.split('@')[0]} purchased {o.size}</p>
                               <p className="text-[10px] text-muted-foreground">{new Date(o.date).toLocaleString()}</p>
                             </div>
                           </div>
                         ))}
                         {orders?.length === 0 && <p className="p-10 text-center text-xs text-muted-foreground italic">No recent activity</p>}
                       </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>

          <div className={cn("animate-in fade-in duration-300", activeTab === 'orders' ? "block" : "hidden")}>
            <Card className="border-border/50 bg-card/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Challenge Purchases</CardTitle>
                  <CardDescription>Verify and provision new trading accounts.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {ordersLoading && orders?.length === 0 ? <LoadingTable /> : (
                  <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                          <th className="py-4 px-6">Order ID</th>
                          <th className="py-4 px-6">User / UID</th>
                          <th className="py-4 px-6">Challenge</th>
                          <th className="py-4 px-6">Price</th>
                          <th className="py-4 px-6">TX Hash</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {orders?.map((o: any) => (
                          <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                            <td className="py-4 px-6 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}</td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-white">{o.email}</span>
                                <span className="text-[10px] text-muted-foreground">UID: {o.userId?.slice(0, 8)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant="outline" className="text-[10px] uppercase font-bold border-white/10 text-white">{o.plan} {o.size}</Badge>
                            </td>
                            <td className="py-4 px-6 font-bold text-primary">{o.price}</td>
                            <td className="py-4 px-6">
                               <div className="flex items-center gap-1 group">
                                 <span className="font-mono text-[10px] truncate max-w-[80px] text-muted-foreground">{o.txHash}</span>
                                 <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white" />
                               </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge className={o.status === 'verified' ? "bg-accent text-accent-foreground" : "bg-amber-500 text-white"}>{o.status}</Badge>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {o.status === 'pending' && (
                                <Button size="sm" className="h-8 font-bold cursor-pointer" onClick={() => handleVerifyOrder(o)}>Verify Payment</Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-4 border-t border-border/30 text-center">
                      <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-white cursor-pointer" onClick={() => setOrdersLimit(l => l + PAGE_SIZE)}>
                        <Plus className="w-3 h-3 mr-2" /> Load More Orders
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className={cn("animate-in fade-in duration-300", activeTab === 'users' ? "block" : "hidden")}>
            <Card className="border-border/50 bg-card/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">User Directory</CardTitle>
                  <CardDescription>Manage trader profiles and access levels.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {tradersLoading && traders?.length === 0 ? <LoadingTable /> : (
                  <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                          <th className="py-4 px-6">UID / ID</th>
                          <th className="py-4 px-6">Name</th>
                          <th className="py-4 px-6">Contact</th>
                          <th className="py-4 px-6">KYC</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Code</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {traders?.filter(t => !searchTerm || t.email?.toLowerCase().includes(searchTerm.toLowerCase())).map((t: any) => (
                          <tr key={t.id} className="hover:bg-primary/5 transition-colors">
                            <td className="py-4 px-6 font-mono text-xs text-muted-foreground">
                              {t.traderId || 'N/A'}
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-bold text-white">{t.name}</span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-xs text-white">{t.email}</span>
                                <span className="text-[10px] text-muted-foreground">{t.phone || 'No phone'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <KycBadge status={t.kycStatus} />
                            </td>
                            <td className="py-4 px-6">
                              <Badge variant={t.status === 'suspended' ? 'destructive' : 'outline'} className="text-[10px] font-black">{t.status || 'active'}</Badge>
                            </td>
                            <td className="py-4 px-6 font-mono text-xs font-bold text-primary">{t.referralCode}</td>
                            <td className="py-4 px-6 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-white"><MoreVertical className="w-4 h-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-card border-border/50">
                                  <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => setPreviewUserId(t.id)}><Eye className="w-4 h-4 mr-2" /> View Dashboard</DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => { setSelectedUser(t); setIsFreeAccountOpen(true); }}><Gift className="w-4 h-4 mr-2" /> Give Free Account</DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => { setSelectedUser(t); setIsManageAccountOpen(true); }}><User className="w-4 h-4 mr-2" /> Manage Profile</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-destructive cursor-pointer"><Ban className="w-4 h-4 mr-2" /> Suspend Account</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-4 border-t border-border/30 text-center">
                      <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-white cursor-pointer" onClick={() => setUsersLimit(l => l + PAGE_SIZE)}>
                        <Plus className="w-3 h-3 mr-2" /> Load More Users
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className={cn("animate-in fade-in duration-300 space-y-8", activeTab === 'kyc' ? "block" : "hidden")}>
            <div className="grid grid-cols-3 gap-6">
              <StatCard title="Pending Review" value={traders?.filter(t => t.kycStatus === 'pending').length || 0} icon={<Fingerprint />} color="amber" />
              <StatCard title="Verified Traders" value={traders?.filter(t => t.kycVerified).length || 0} icon={<CheckCircle2 />} color="green" />
              <StatCard title="Rejected Requests" value={traders?.filter(t => t.kycStatus === 'rejected').length || 0} icon={<XCircle />} color="red" />
            </div>

            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="text-white">KYC Verification Queue</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                      <tr>
                        <th className="py-4 px-6">Submission Date</th>
                        <th className="py-4 px-6">User</th>
                        <th className="py-4 px-6">Email</th>
                        <th className="py-4 px-6">Documents</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {traders?.filter(t => t.kycStatus === 'pending').map((t: any) => (
                        <tr key={t.id} className="hover:bg-primary/5 transition-colors">
                          <td className="py-4 px-6 text-xs text-muted-foreground">{t.kycSubmittedAt ? new Date(t.kycSubmittedAt).toLocaleDateString() : 'Unknown'}</td>
                          <td className="py-4 px-6 font-bold text-white">{t.name}</td>
                          <td className="py-4 px-6 text-xs text-muted-foreground">{t.email}</td>
                          <td className="py-4 px-6">
                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-black cursor-pointer border-white/10 text-white" onClick={() => { setSelectedUser(t); setIsKycReviewOpen(true); }}>VIEW DOCUMENTS</Button>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <Button size="sm" className="h-8 bg-accent text-accent-foreground font-bold cursor-pointer" onClick={() => handleKycAction(t, 'verified')}>Approve</Button>
                            <Button size="sm" variant="destructive" className="h-8 font-bold cursor-pointer" onClick={() => { setSelectedUser(t); setIsKycReviewOpen(true); }}>Reject</Button>
                          </td>
                        </tr>
                      ))}
                      {traders?.filter(t => t.kycStatus === 'pending').length === 0 && (
                        <tr><td colSpan={5} className="py-12 text-center text-muted-foreground italic">No pending KYC applications</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className={cn("animate-in fade-in duration-300 space-y-8", activeTab === 'referrals' ? "block" : "hidden")}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <StatCard title="Total Commissions" value={`$${referrals?.reduce((acc, r) => acc + (r.amount || 0), 0).toFixed(2)}`} icon={<TrendingUp />} color="blue" />
              <StatCard title="Paid Earnings" value={`$${referrals?.filter(r => r.status === 'paid').reduce((acc, r) => acc + (r.amount || 0), 0).toFixed(2)}`} icon={<CheckCircle2 />} color="green" />
              <StatCard title="Outstanding" value={`$${referrals?.filter(r => r.status === 'pending').reduce((acc, r) => acc + (r.amount || 0), 0).toFixed(2)}`} icon={<Clock />} color="amber" />
            </div>

            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="text-white">Commission Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                      <tr>
                        <th className="py-4 px-6">Referrer ID</th>
                        <th className="py-4 px-6">Referred User</th>
                        <th className="py-4 px-6">Challenge</th>
                        <th className="py-4 px-6">Commission</th>
                        <th className="py-4 px-6">Status</th>
                        <th className="py-4 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {referrals?.map((r: any) => (
                        <tr key={r.id} className="hover:bg-primary/5">
                          <td className="py-4 px-6 font-mono text-xs text-muted-foreground">{r.referrerId?.slice(0, 8)}</td>
                          <td className="py-4 px-6 font-bold text-white">{r.referredUserEmail}</td>
                          <td className="py-4 px-6 text-xs uppercase text-muted-foreground">{r.plan}</td>
                          <td className="py-4 px-6 font-bold text-accent">${r.amount?.toFixed(2)}</td>
                          <td className="py-4 px-6">
                            <Badge variant={r.status === 'paid' ? 'default' : 'outline'} className="text-white border-white/10">{r.status}</Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            {r.status === 'pending' && (
                              <Button size="sm" className="h-8 cursor-pointer font-bold" onClick={() => updateDoc(doc(db, 'referrals', r.id), { status: 'paid' })}>Mark Paid</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className={cn("animate-in fade-in duration-300", activeTab === 'payouts' ? "block" : "hidden")}>
            <Card className="border-border/50 bg-card/30">
              <CardHeader>
                <CardTitle className="text-white">Payout Management</CardTitle>
                <CardDescription>Review and approve profit split requests.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {payoutsLoading && payouts?.length === 0 ? <LoadingTable /> : (
                  <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Trader / UID</th>
                          <th className="py-4 px-6">Amount</th>
                          <th className="py-4 px-6">KYC Status</th>
                          <th className="py-4 px-6">Method</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {payouts?.map((p: any) => (
                          <tr key={p.id} className="hover:bg-primary/5 transition-colors">
                            <td className="py-4 px-6 text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()}</td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="font-bold text-white">{p.email}</span>
                                <span className="text-[10px] text-muted-foreground">UID: {p.userId?.slice(0, 8)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 font-bold text-accent">${p.amount}</td>
                            <td className="py-4 px-6">
                              <KycBadge status={traders?.find(t => t.id === p.userId)?.kycStatus} />
                            </td>
                            <td className="py-4 px-6 text-xs uppercase font-bold text-muted-foreground">{p.method}</td>
                            <td className="py-4 px-6">
                               <Badge variant={p.status === 'done' ? 'default' : 'outline'} className="text-white border-white/10">{p.status}</Badge>
                            </td>
                            <td className="py-4 px-6 text-right space-x-2">
                              {p.status === 'pending' && (
                                <>
                                  <Button size="sm" className="h-8 cursor-pointer font-bold" onClick={() => {
                                    updateDoc(doc(db, 'payouts', p.id), { status: 'approved' });
                                    toast({ title: "Payout Approved" });
                                  }}>Approve</Button>
                                  <Button size="sm" variant="destructive" className="h-8 cursor-pointer font-bold">Reject</Button>
                                </>
                              )}
                              {p.status === 'approved' && (
                                <Button size="sm" className="h-8 bg-accent text-accent-foreground cursor-pointer font-bold" onClick={() => {
                                  updateDoc(doc(db, 'payouts', p.id), { status: 'done' });
                                  sendPayoutProcessedEmail(p.email, p.amount);
                                  toast({ title: "Payout marked as Complete" });
                                }}>Mark as Sent</Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-4 border-t border-border/30 text-center">
                      <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-white cursor-pointer" onClick={() => setPayoutsLimit(l => l + PAGE_SIZE)}>
                        <Plus className="w-3 h-3 mr-2" /> Load More Payouts
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className={cn("animate-in fade-in duration-300 space-y-8", activeTab === 'notifications' ? "block" : "hidden")}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white"><Send className="w-5 h-5 text-primary" /> Send Global Message</CardTitle>
                    <CardDescription>Dispatch alerts to users who have "Announcements" enabled.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 text-white">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <Select value={notifTarget} onValueChange={setNotifTarget}>
                          <SelectTrigger className="bg-background/50 cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="kyc_pending">KYC Pending</SelectItem>
                            <SelectItem value="funded">Funded Traders</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={notifPriority} onValueChange={setNotifPriority}>
                          <SelectTrigger className="bg-background/50 cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="important">Important</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notification Title</Label>
                      <Input placeholder="e.g. System Update" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="bg-background/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Message Body</Label>
                      <Textarea placeholder="Type message..." className="min-h-[150px] bg-background/50" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} />
                    </div>
                    <Button className="w-full font-bold h-12 cyan-box-glow cursor-pointer" disabled={isSendingNotif || !notifTitle || !notifMessage} onClick={handleSendBroadcast}>
                      {isSendingNotif ? 'Sending Broadcast...' : 'Send Global Broadcast'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card className="border-border/50 bg-card/30">
                  <CardHeader><CardTitle className="text-lg text-white">Recent Broadcasts</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/30">
                      {broadcasts?.map((b: any) => (
                        <div key={b.id} className="p-4 space-y-1">
                          <p className="text-xs font-bold text-white">{b.title}</p>
                          <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                             <span>To: {b.targetGroup}</span>
                             <span>Recipients: {b.totalRecipients}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={isFreeAccountOpen} onOpenChange={setIsFreeAccountOpen}>
        <DialogContent className="bg-card border-primary/20 text-white">
          <DialogHeader>
            <DialogTitle>Grant Free Account Access</DialogTitle>
            <DialogDescription>Provision an MT5 account for {selectedUser?.email} without payment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Challenge Plan</Label>
              <Select value={provisionPlan} onValueChange={setProvisionPlan}>
                <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-Step Pro">1-Step Pro</SelectItem>
                  <SelectItem value="2-Step Classic">2-Step Classic</SelectItem>
                  <SelectItem value="3-Step Classic">3-Step Classic</SelectItem>
                  <SelectItem value="Instant Funding">Instant Funding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account Size</Label>
              <Select value={provisionSize} onValueChange={setProvisionSize}>
                <SelectTrigger className="cursor-pointer"><SelectValue /></SelectTrigger>
                <SelectContent>
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
            <Button variant="outline" className="cursor-pointer font-bold" onClick={() => setIsFreeAccountOpen(false)}>Cancel</Button>
            <Button className="cursor-pointer font-bold" onClick={handleGrantFreeAccount}>Confirm Grant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isKycReviewOpen} onOpenChange={setIsKycReviewOpen}>
        <DialogContent className="bg-card border-primary/20 max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle>Review KYC Application</DialogTitle>
            <DialogDescription>Reviewing documents for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-secondary/50 rounded-xl border border-border text-center">
                 <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">ID Proof</p>
                 <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center"><Fingerprint className="w-8 h-8 opacity-10" /></div>
               </div>
               <div className="p-4 bg-secondary/50 rounded-xl border border-border text-center">
                 <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Address Proof</p>
                 <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center"><Fingerprint className="w-8 h-8 opacity-10" /></div>
               </div>
            </div>
            <div className="space-y-2">
              <Label>Rejection Reason (Required only for Rejection)</Label>
              <Textarea 
                placeholder="Explain why documents were rejected..." 
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
             <Button variant="destructive" className="font-bold cursor-pointer" onClick={() => handleKycAction(selectedUser, 'rejected')} disabled={!rejectionReason}>Reject Documents</Button>
             <Button className="bg-accent text-accent-foreground font-bold cursor-pointer" onClick={() => handleKycAction(selectedUser, 'verified')}>Approve & Verify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KycBadge({ status }: { status: string }) {
  switch (status) {
    case 'verified': return <Badge className="bg-accent text-accent-foreground font-black text-[10px] uppercase">VERIFIED ✅</Badge>;
    case 'pending': return <Badge className="bg-amber-500 text-white font-black text-[10px] uppercase">PENDING ⏳</Badge>;
    case 'rejected': return <Badge variant="destructive" className="font-black text-[10px] uppercase">REJECTED ❌</Badge>;
    default: return <Badge variant="outline" className="text-muted-foreground font-black text-[10px] uppercase border-white/10">NONE</Badge>;
  }
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <Card key={i} className="border-border/50 bg-card/30">
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-10 rounded-lg bg-secondary/50" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-secondary/30" />
              <Skeleton className="h-8 w-32 bg-secondary/50" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function LoadingTable() {
  return (
    <div className="space-y-4 p-8">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-4 items-center">
          <Skeleton className="h-12 w-full rounded-lg bg-secondary/30" />
        </div>
      ))}
    </div>
  );
}
