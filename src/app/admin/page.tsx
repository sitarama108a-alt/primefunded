
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
  Lock, Eye, Shield, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, MoreVertical, Gift, Ban, CheckCircle2, XCircle, Clock, LayoutDashboard, ChevronLeft, Bell, Mail, Send, AlertTriangle, User, History, Trash2, Award, Terminal, ShieldAlert
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp, getDoc, addDoc, collection, writeBatch, query, where, getDocs, increment } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DashboardPage from '@/app/dashboard/page';
import { cn } from '@/lib/utils';
import { sendKycApprovalEmail, sendKycRejectionEmail, sendBroadcastEmail, sendChallengePassEmail, sendChallengeFailEmail, sendFreeAccountGrantEmail, sendReferralCommissionEmail, sendPayoutProcessedEmail } from '@/lib/email';
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
      
      // Handle Referral Commission
      const userSnap = await getDoc(doc(db, 'users', order.userId));
      const referredBy = userSnap.data()?.referredBy;
      if (referredBy) {
        const amount = Math.min(parseFloat(order.price.replace('$', '')) * 0.10, 50);
        const referralId = Math.random().toString(36).substring(7);
        await setDoc(doc(db, 'referrals', referralId), {
          referrerId: referredBy,
          referredUserId: order.userId,
          referredUserEmail: order.email,
          orderId: order.id,
          plan: order.plan,
          amount: amount,
          status: 'pending',
          createdAt: serverTimestamp()
        });

        // Notify Referrer
        const referrerSnap = await getDoc(doc(db, 'users', referredBy));
        if (referrerSnap.exists()) {
          const referrerData = referrerSnap.data();
          await addDoc(collection(db, 'users', referredBy, 'notifications'), {
            title: "👥 Referral Earned!",
            message: `Your referral ${order.email.split('@')[0].slice(0, 3)}*** just purchased a challenge. You earned $${amount.toFixed(2)} commission!`,
            type: 'referral_earned',
            isRead: false,
            createdAt: serverTimestamp()
          });
          sendReferralCommissionEmail(referrerData.email, amount, order.email);
        }
      }

      await addDoc(collection(db, 'users', order.userId, 'notifications'), {
        title: "🎯 Challenge Activated",
        message: `Your ${order.plan} - ${order.size} challenge is now live! Check your MT5 credentials.`,
        type: 'challenge_active',
        isRead: false,
        createdAt: serverTimestamp()
      });

      toast({ title: "Order Verified", description: `Account created and notifications sent.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed" });
    }
  };

  const handleGrantFreeAccount = async () => {
    if (!selectedUser) return;
    try {
      const accountId = Math.random().toString(36).substring(7).toUpperCase();
      const login = Math.floor(1000000 + Math.random() * 9000000).toString();
      const password = Math.random().toString(36).substring(2, 12);
      
      const balance = parseFloat(provisionSize.replace('$', '').replace(',', '').replace('k', '000'));
      
      const accountData = {
        userId: selectedUser.id,
        email: selectedUser.email,
        plan: provisionPlan,
        size: provisionSize,
        mt5Login: login,
        mt5Password: password,
        mt5Server: "PrimeFunded-Live",
        balance: balance,
        status: "active",
        paymentStatus: "free_grant",
        grantedBy: "admin",
        startDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'accounts', accountId), accountData);
      
      await addDoc(collection(db, 'users', selectedUser.id, 'notifications'), {
        title: "🎁 Free Account Granted",
        message: `Congratulations! A free ${provisionPlan} - ${provisionSize} challenge has been granted to your account.`,
        type: 'free_account',
        isRead: false,
        createdAt: serverTimestamp()
      });

      sendFreeAccountGrantEmail(selectedUser.email, provisionPlan, provisionSize);
      toast({ title: "Account Granted", description: `Free challenge created for ${selectedUser.email}` });
      setIsManageAccountOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Grant Failed" });
    }
  };

  const handleProcessPayout = async (payout: any) => {
    try {
      await updateDoc(doc(db, 'payouts', payout.id), { status: 'done' });
      await addDoc(collection(db, 'users', payout.userId, 'notifications'), {
        title: "✅ Payout Processed",
        message: `Your payout of ${payout.amount} has been processed successfully!`,
        type: 'payout_processed',
        isRead: false,
        createdAt: serverTimestamp()
      });
      sendPayoutProcessedEmail(payout.email, payout.amount);
      toast({ title: "Payout Processed" });
    } catch (err) {
      toast({ variant: "destructive", title: "Process Failed" });
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
      toast({ title: "Challenge Passed" });
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
      toast({ title: "Challenge Terminated" });
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
      if (notifTarget === 'funded') targetUsers = traders.filter(t => t.kycVerified === true);
      
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
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" /> Send Message</TabsTrigger>
            <TabsTrigger value="referrals"><TrendingUp className="w-4 h-4 mr-2" /> Referrals</TabsTrigger>
            <TabsTrigger value="payouts"><Wallet className="w-4 h-4 mr-2" /> Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="payouts">
            <Card className="bg-card/40 border-border/50">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">User</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Amount</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">KYC Status</th>
                      <th className="py-4 px-4 text-left uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Status</th>
                      <th className="py-4 px-4 text-right uppercase text-[10px] font-bold tracking-widest text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => {
                      const user = traders.find(t => t.id === p.userId);
                      return (
                        <tr key={p.id} className="border-b hover:bg-secondary/10 transition-colors">
                          <td className="py-4 px-4">{p.email}</td>
                          <td className="py-4 px-4 font-bold text-accent">${p.amount}</td>
                          <td className="py-4 px-4">
                            <Badge variant={user?.kycVerified ? 'default' : 'outline'}>
                              {user?.kycStatus || 'none'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className="uppercase text-[9px]">{p.status}</Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {p.status === 'pending' && (
                              <Button size="sm" onClick={() => handleProcessPayout(p)}>Process Payout</Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-primary" /> Send Global Message
                    </CardTitle>
                    <CardDescription>Dispatch an in-app notification and email to your selected target audience.</CardDescription>
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
                      <Label>Notification Title</Label>
                      <Input placeholder="e.g. System Update or Holiday Schedule" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Message Body</Label>
                      <Textarea placeholder="Type your broadcast message here..." className="min-h-[150px]" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} />
                    </div>
                    <Button className="w-full font-bold h-12 cyan-box-glow" disabled={isSendingNotif || !notifTitle || !notifMessage} onClick={handleSendBroadcast}>
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
                     <CardTitle className="text-lg flex items-center gap-2"><Bell className="w-5 h-5" /> Targeting Rules</CardTitle>
                   </CardHeader>
                   <CardContent className="text-xs text-muted-foreground leading-relaxed space-y-4">
                     <p>• <strong>All Users</strong>: Every registered trader.</p>
                     <p>• <strong>KYC Pending</strong>: Users awaiting document review.</p>
                     <p>• <strong>Funded Traders</strong>: Users with verified accounts.</p>
                   </CardContent>
                 </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-card/40 border-border/50">
              <CardHeader>
                <div className="flex justify-between">
                  <Input placeholder="Search users..." className="max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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

        {/* Manage User Dialog */}
        <Dialog open={isManageAccountOpen} onOpenChange={setIsManageAccountOpen}>
          <DialogContent className="max-w-3xl bg-card border-primary/20 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Manage Account: {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                 <p className="text-xs font-bold text-primary uppercase tracking-widest">Grant Free Access</p>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <Label className="text-[10px]">Challenge Type</Label>
                     <Select value={provisionPlan} onValueChange={setProvisionPlan}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="1-Step Pro">1-Step Pro</SelectItem>
                           <SelectItem value="2-Step Classic">2-Step Classic</SelectItem>
                           <SelectItem value="Instant Funding">Instant Funding</SelectItem>
                        </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-1">
                     <Label className="text-[10px]">Account Size</Label>
                     <Select value={provisionSize} onValueChange={setProvisionSize}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="$5,000">$5,000</SelectItem>
                           <SelectItem value="$10,000">$10,000</SelectItem>
                           <SelectItem value="$50,000">$50,000</SelectItem>
                           <SelectItem value="$100,000">$100,000</SelectItem>
                           <SelectItem value="$200,000">$200,000</SelectItem>
                        </SelectContent>
                     </Select>
                   </div>
                 </div>
                 <Button className="w-full bg-accent text-accent-foreground font-bold" onClick={handleGrantFreeAccount}>
                   <Gift className="w-4 h-4 mr-2" /> Grant Free Challenge
                 </Button>
              </div>

              <div className="border-t border-white/5 pt-6">
                 <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                   <Terminal className="w-4 h-4 text-primary" /> Active Trading Accounts
                 </h4>
                 {userAccounts.map(acc => (
                   <Card key={acc.id} className="bg-secondary/30 border-border/50 mb-4">
                     <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{acc.size} {acc.plan}</p>
                          <p className="text-xs font-mono text-muted-foreground">ID: PF-{acc.mt5Login}</p>
                          <Badge className="mt-2 text-[10px]">{acc.status}</Badge>
                        </div>
                        <div className="flex gap-2">
                          {acc.status === 'active' && (
                            <>
                              <Button size="sm" className="bg-accent text-accent-foreground font-bold text-xs" onClick={() => handlePassChallenge(acc)}>Pass</Button>
                              <Button size="sm" variant="destructive" className="font-bold text-xs" onClick={() => handleFailChallenge(acc)}>Terminate</Button>
                            </>
                          )}
                        </div>
                     </CardContent>
                   </Card>
                 ))}
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
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setIsManageAccountOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Individual Notification Dialog */}
        <Dialog open={isSendNotificationOpen} onOpenChange={setIsSendNotificationOpen}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Send Message to {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div className="space-y-2">
                 <Label>Title</Label>
                 <Input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
               </div>
               <div className="space-y-2">
                 <Label>Message</Label>
                 <Textarea value={notifMessage} onChange={e => setNotifMessage(e.target.value)} />
               </div>
            </div>
            <DialogFooter>
               <Button onClick={handleSendIndividualNotif} disabled={!notifTitle || !notifMessage}>Send Notification</Button>
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
