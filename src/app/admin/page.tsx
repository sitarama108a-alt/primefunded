
"use client";

import { useState, useMemo, useEffect } from 'react';
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
  Shield, 
  Users, 
  ShoppingCart, 
  Wallet, 
  Activity, 
  Fingerprint, 
  TrendingUp, 
  MoreVertical, 
  Gift, 
  Ban, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  LayoutDashboard, 
  ChevronLeft,
  Bell,
  Mail,
  Send,
  AlertTriangle,
  User,
  History,
  Trash2,
  Award,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp, getDoc, addDoc, collection, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DashboardPage from '@/app/dashboard/page';
import { cn } from '@/lib/utils';
import { sendKycApprovalEmail, sendKycRejectionEmail, sendBroadcastEmail, sendChallengePassEmail, sendChallengeFailEmail } from '@/lib/email';
import { Textarea } from '@/components/ui/textarea';

const ADMIN_PASSWORD = "93463962569392846256";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewUserId, setPreviewUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const db = useFirestore();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);
  const [isGrantFreeOpen, setIsGrantFreeOpen] = useState(false);
  const [isSendNotificationOpen, setIsSendNotificationOpen] = useState(false);
  
  const [provisionPlan, setProvisionPlan] = useState('1-Step Pro');
  const [provisionSize, setProvisionSize] = useState('$100,000');
  const [rejectionReason, setRejectionReason] = useState('');
  const [breachReason, setBreachReason] = useState('Daily Drawdown Exceeded');

  // Notification states
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifPriority, setNotifPriority] = useState('normal');
  const [notifTarget, setNotifTarget] = useState('all');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  const emptyConstraints = useMemo(() => [], []);
  const { data: orders } = useCollection<any>('orders', emptyConstraints);
  const { data: traders } = useCollection<any>('users', emptyConstraints);
  const { data: payouts } = useCollection<any>('payouts', emptyConstraints);
  const { data: referrals } = useCollection<any>('referrals', emptyConstraints);
  const { data: broadcasts } = useCollection<any>('broadcasts', emptyConstraints);

  // Fetch accounts for selected user when dialog is open
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  useEffect(() => {
    if (selectedUser && isManageAccountOpen) {
      const q = query(collection(db, 'accounts'), where('userId', '==', selectedUser.id));
      getDocs(q).then(snap => {
        setUserAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [selectedUser, isManageAccountOpen, db]);

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

      // Add Notification
      await addDoc(collection(db, 'users', order.userId, 'notifications'), {
        title: "🎯 Challenge Activated",
        message: `Your ${order.plan} - ${order.size} challenge is now live! Check your MT5 credentials.`,
        type: 'challenge_active',
        isRead: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Order Verified", description: `Account created for ${order.email}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed" });
    }
  };

  const handlePassChallenge = async (account: any) => {
    try {
      await updateDoc(doc(db, 'accounts', account.id), { status: 'passed' });
      
      await addDoc(collection(db, 'users', account.userId, 'notifications'), {
        title: "🎉 Challenge Passed!",
        message: `Congratulations! You have passed your ${account.plan} - ${account.size} challenge. Promotion initiated.`,
        type: 'challenge_passed',
        isRead: false,
        createdAt: serverTimestamp()
      });

      await sendChallengePassEmail(account.email, selectedUser.name, account.plan, account.size);
      
      toast({ title: "Challenge Marked as Passed", description: `Notification and email sent to ${account.email}` });
      setIsManageAccountOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const handleFailChallenge = async (account: any) => {
    try {
      await updateDoc(doc(db, 'accounts', account.id), { status: 'breached' });
      
      await addDoc(collection(db, 'users', account.userId, 'notifications'), {
        title: "❌ Challenge Terminated",
        message: `Your challenge has been terminated. Reason: ${breachReason}`,
        type: 'challenge_failed',
        isRead: false,
        createdAt: serverTimestamp()
      });

      await sendChallengeFailEmail(account.email, selectedUser.name, account.plan, account.size, breachReason);
      
      toast({ title: "Challenge Terminated", description: `Breach recorded for ${account.email}` });
      setIsManageAccountOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  const handleSendBroadcast = async () => {
    if (!notifTitle || !notifMessage) return;
    setIsSendingNotif(true);
    try {
      let targetUsers = traders;
      if (notifTarget === 'kyc_pending') targetUsers = traders.filter(t => t.kycStatus === 'pending');
      
      const batch = writeBatch(db);
      targetUsers.forEach(u => {
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
        sendBroadcastEmail(u.email, notifTitle, notifMessage, u.name);
      });

      await addDoc(collection(db, 'broadcasts'), {
        title: notifTitle,
        message: notifMessage,
        sentBy: "admin",
        targetGroup: notifTarget,
        sentAt: serverTimestamp(),
        totalRecipients: targetUsers.length
      });

      await batch.commit();
      toast({ title: "Broadcast Sent", description: `Message delivered to ${targetUsers.length} users.` });
      setNotifTitle('');
      setNotifMessage('');
    } catch (err) {
      toast({ variant: "destructive", title: "Broadcast Failed" });
    } finally {
      setIsSendingNotif(false);
    }
  };

  const handleSendIndividualNotif = async () => {
    if (!selectedUser || !notifTitle || !notifMessage) return;
    try {
      await addDoc(collection(db, 'users', selectedUser.id, 'notifications'), {
        title: notifTitle,
        message: notifMessage,
        type: 'admin_direct',
        isRead: false,
        sentByAdmin: true,
        createdAt: serverTimestamp()
      });
      toast({ title: "Notification Sent" });
      setIsSendNotificationOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to send" });
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

      await addDoc(collection(db, 'users', userId, 'notifications'), {
        title: status === 'verified' ? "✅ KYC Approved" : "❌ KYC Rejected",
        message: status === 'verified' 
          ? "Your identity verification is complete. Payouts are now unlocked!" 
          : `Your KYC documents were rejected. Reason: ${reason || "Invalid documents."}`,
        type: status === 'verified' ? 'kyc_approved' : 'kyc_rejected',
        isRead: false,
        createdAt: serverTimestamp()
      });

      if (status === 'verified') await sendKycApprovalEmail(email);
      else await sendKycRejectionEmail(email, reason || "Documents did not meet requirements.");

      toast({ title: `KYC ${status === 'verified' ? 'Approved' : 'Rejected'}` });
      setIsManageAccountOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  if (previewUserId) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="fixed top-0 left-0 w-full z-[100] bg-primary h-12 flex items-center justify-between px-6 shadow-lg">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
            <span className="text-xs font-black uppercase tracking-widest text-primary-foreground">Admin View Mode: Previewing {previewUserId}</span>
          </div>
          <Button variant="secondary" size="sm" className="h-8 text-xs font-bold" onClick={() => setPreviewUserId(null)}>
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
              <Input type="password" placeholder="Master Password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" /> Notifications</TabsTrigger>
            <TabsTrigger value="referrals"><TrendingUp className="w-4 h-4 mr-2" /> Referrals</TabsTrigger>
            <TabsTrigger value="payouts"><Wallet className="w-4 h-4 mr-2" /> Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Traders" value={traders.length} icon={<Users />} />
              <StatCard title="Pending KYC" value={kycStats.pending} icon={<Fingerprint className="text-amber-500" />} />
              <StatCard title="Pending Payouts" value={payouts?.filter(p => p.status === 'pending').length} icon={<Wallet />} />
              <StatCard title="Total Broadcasts" value={broadcasts.length} icon={<Bell />} />
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-primary" /> Send Broadcast Message
                    </CardTitle>
                    <CardDescription>Send a message and email to specific user segments.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <Select value={notifTarget} onValueChange={setNotifTarget}>
                          <SelectTrigger className="bg-background/50">
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
                          <SelectTrigger className="bg-background/50">
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
                      <Label>Title</Label>
                      <Input placeholder="e.g. System Maintenance" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Message Body</Label>
                      <Textarea placeholder="Type your message here..." className="min-h-[150px]" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} />
                    </div>
                    <Button className="w-full font-bold h-12" disabled={isSendingNotif} onClick={handleSendBroadcast}>
                      {isSendingNotif ? 'Sending Broadcast...' : 'Send Global Broadcast'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-card/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-widest font-black flex items-center gap-2">
                      <History className="w-4 h-4" /> Broadcast History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-secondary/30">
                          <th className="py-4 px-4 text-left uppercase text-[10px] font-bold text-muted-foreground">Sent At</th>
                          <th className="py-4 px-4 text-left uppercase text-[10px] font-bold text-muted-foreground">Title</th>
                          <th className="py-4 px-4 text-left uppercase text-[10px] font-bold text-muted-foreground">Target</th>
                          <th className="py-4 px-4 text-right uppercase text-[10px] font-bold text-muted-foreground">Recipients</th>
                        </tr>
                      </thead>
                      <tbody>
                        {broadcasts.map(b => (
                          <tr key={b.id} className="border-b hover:bg-secondary/10">
                            <td className="py-4 px-4 text-xs">{b.sentAt?.seconds ? new Date(b.sentAt.seconds * 1000).toLocaleString() : 'N/A'}</td>
                            <td className="py-4 px-4 font-bold">{b.title}</td>
                            <td className="py-4 px-4"><Badge variant="outline">{b.targetGroup}</Badge></td>
                            <td className="py-4 px-4 text-right font-mono font-bold text-primary">{b.totalRecipients}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                 <Card className="border-primary/20 bg-primary/5">
                   <CardHeader>
                     <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5" /> Quick Tips</CardTitle>
                   </CardHeader>
                   <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-4">
                     <p>• Broadcasts send an in-app notification to all matching users.</p>
                     <p>• Targeted emails are triggered automatically along with the broadcast.</p>
                     <p>• Priority "Urgent" will show the notification in red for users.</p>
                   </CardContent>
                 </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-card/40 border-border/50">
              <CardHeader>
                <div className="flex justify-between">
                  <Input placeholder="Search users by UID, Name or Email..." className="max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-secondary/30">
                        <th className="py-4 px-4 text-left uppercase text-[10px] font-bold text-muted-foreground">UID</th>
                        <th className="py-4 px-4 text-left uppercase text-[10px] font-bold text-muted-foreground">Trader</th>
                        <th className="py-4 px-4 text-left uppercase text-[10px] font-bold text-muted-foreground">KYC / Account</th>
                        <th className="py-4 px-4 text-right uppercase text-[10px] font-bold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTraders.map((t) => (
                        <tr key={t.id} className="border-b hover:bg-secondary/10">
                          <td className="py-4 px-4 font-mono font-bold text-primary">{t.traderId}</td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold">{t.name}</span>
                              <span className="text-xs text-muted-foreground">{t.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 flex gap-2">
                             <Badge variant={t.kycVerified ? 'default' : 'outline'}>{t.kycStatus || 'none'}</Badge>
                             <Badge variant={t.status === 'suspended' ? 'destructive' : 'outline'}>{t.status || 'active'}</Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card">
                                <DropdownMenuItem onClick={() => setPreviewUserId(t.id)}><Eye className="w-4 h-4 mr-2" /> View Dashboard</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedUser(t); setIsManageAccountOpen(true); }}><User className="w-4 h-4 mr-2" /> Manage Profile</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedUser(t); setIsSendNotificationOpen(true); }}><Bell className="w-4 h-4 mr-2" /> Send Notification</DropdownMenuItem>
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
          
          <TabsContent value="orders">
            <Card className="bg-card/40 border-border/50">
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
        </Tabs>

        {/* Send Individual Notification Dialog */}
        <Dialog open={isSendNotificationOpen} onOpenChange={setIsSendNotificationOpen}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Send Notification to {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2">
                 <Label>Notification Title</Label>
                 <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} placeholder="Alert Title" />
               </div>
               <div className="space-y-2">
                 <Label>Message</Label>
                 <Textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} placeholder="Detailed message..." />
               </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setIsSendNotificationOpen(false)}>Cancel</Button>
               <Button onClick={handleSendIndividualNotif} disabled={!notifTitle || !notifMessage}>Send Notification</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage User Dialog */}
        <Dialog open={isManageAccountOpen} onOpenChange={setIsManageAccountOpen}>
          <DialogContent className="max-w-3xl bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Manage Account: {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <DetailBox label="UID" value={selectedUser?.traderId} />
                <DetailBox label="KYC Status" value={selectedUser?.kycStatus} color={selectedUser?.kycVerified ? 'text-accent' : 'text-amber-500'} />
                <DetailBox label="Country" value={selectedUser?.country} />
                <DetailBox label="Email" value={selectedUser?.email} />
              </div>
              
              <div className="border-t border-white/5 pt-6">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                   <Terminal className="w-4 h-4 text-primary" /> Trading Accounts
                 </h4>
                 {userAccounts.length === 0 ? (
                   <p className="text-xs italic text-muted-foreground">No active accounts found.</p>
                 ) : (
                   <div className="space-y-4">
                     {userAccounts.map(acc => (
                       <Card key={acc.id} className="bg-secondary/30 border-border/50">
                         <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-sm">{acc.size} {acc.plan}</p>
                              <p className="text-xs font-mono text-muted-foreground">ID: PF-{acc.mt5Login} | Bal: ${acc.balance.toLocaleString()}</p>
                              <Badge className="mt-2 text-[10px]" variant={acc.status === 'active' ? 'default' : 'outline'}>{acc.status}</Badge>
                            </div>
                            <div className="flex gap-2">
                              {acc.status === 'active' && (
                                <>
                                  <Button size="sm" className="bg-accent text-accent-foreground font-bold text-xs" onClick={() => handlePassChallenge(acc)}>
                                    <Award className="w-3 h-3 mr-1" /> Pass Challenge
                                  </Button>
                                  <Button size="sm" variant="destructive" className="font-bold text-xs" onClick={() => handleFailChallenge(acc)}>
                                    <Ban className="w-3 h-3 mr-1" /> Terminate
                                  </Button>
                                </>
                              )}
                            </div>
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 )}
              </div>

              {selectedUser?.kycStatus === 'pending' && (
                <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-4">
                   <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">Verify Documents</p>
                   <Input placeholder="Rejection reason (if any)" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
                   <div className="flex gap-2">
                      <Button className="flex-1 bg-accent text-accent-foreground font-bold" onClick={() => handleUpdateKyc(selectedUser.id, 'verified')}>Approve KYC</Button>
                      <Button variant="destructive" className="flex-1 font-bold" onClick={() => handleUpdateKyc(selectedUser.id, 'rejected', rejectionReason)}>Reject KYC</Button>
                   </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-3">Breach Configuration</p>
                <div className="space-y-2">
                   <Label className="text-xs">Reason for account termination (if failing)</Label>
                   <Select value={breachReason} onValueChange={setBreachReason}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="Daily Drawdown Exceeded">Daily Drawdown Exceeded</SelectItem>
                         <SelectItem value="Max Drawdown Exceeded">Max Drawdown Exceeded</SelectItem>
                         <SelectItem value="Hard Breach: 1% Floating Loss">1% Max Floating Loss</SelectItem>
                         <SelectItem value="Rule Violation: News Trading">News Trading Restriction</SelectItem>
                         <SelectItem value="Inactivity Breach">Inactivity (30 Days)</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setIsManageAccountOpen(false)}>Close</Button>
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
