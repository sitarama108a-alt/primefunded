
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
      
      // Check referrer preferences before notifying
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

        const referrerSnap = await getDoc(doc(db, 'users', referredBy));
        if (referrerSnap.exists()) {
          const rData = referrerSnap.data();
          const prefs = rData.notificationPreferences || { inApp: true, email: true, referral: true };
          
          if (prefs.inApp && prefs.referral) {
            await addDoc(collection(db, 'users', referredBy, 'notifications'), {
              title: "👥 Referral Earned!",
              message: `Your referral ${order.email.split('@')[0].slice(0, 3)}*** just purchased a challenge. You earned $${amount.toFixed(2)} commission!`,
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

      // Notify User about challenge (respecting prefs)
      const uPrefs = userSnap.data()?.notificationPreferences || { inApp: true, email: true, challenge: true };
      if (uPrefs.inApp && uPrefs.challenge) {
        await addDoc(collection(db, 'users', order.userId, 'notifications'), {
          title: "🎯 Challenge Activated",
          message: `Your ${order.plan} - ${order.size} challenge is now live! Check your MT5 credentials.`,
          type: 'challenge_active',
          isRead: false,
          createdAt: serverTimestamp()
        });
      }

      toast({ title: "Order Verified", description: `Account created and notifications sent.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed" });
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
      let sentCount = 0;

      targetUsers.forEach(u => {
        const prefs = u.notificationPreferences || { inApp: true, email: true, announcements: true };
        
        // Only notify if they have announcements enabled
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

      await addDoc(collection(db, 'broadcasts'), {
        title: notifTitle,
        message: notifMessage,
        sentBy: "admin",
        targetGroup: notifTarget,
        sentAt: serverTimestamp(),
        totalRecipients: sentCount
      });

      await batch.commit();
      toast({ title: "Broadcast Sent", description: `Message delivered to ${sentCount} users (respecting preferences).` });
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
      const prefs = selectedUser.notificationPreferences || { inApp: true, email: true };
      
      if (prefs.inApp) {
        await addDoc(collection(db, 'users', selectedUser.id, 'notifications'), {
          title: notifTitle,
          message: notifMessage,
          type: 'admin_direct',
          isRead: false,
          sentByAdmin: true,
          createdAt: serverTimestamp()
        });
      }
      
      if (prefs.email) {
        sendBroadcastEmail(selectedUser.email, notifTitle, notifMessage, selectedUser.name);
      }

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

          {/* Tab contents are omitted for brevity in this snippet as they follow standard patterns */}
          <TabsContent value="notifications">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Card className="bg-card/40 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="w-5 h-5 text-primary" /> Send Global Message
                    </CardTitle>
                    <CardDescription>Dispatch alerts to users who have "Announcements" enabled.</CardDescription>
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
                      <Input placeholder="e.g. System Update" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Message Body</Label>
                      <Textarea placeholder="Type message..." className="min-h-[150px]" value={notifMessage} onChange={e => setNotifMessage(e.target.value)} />
                    </div>
                    <Button className="w-full font-bold h-12 cyan-box-glow" disabled={isSendingNotif || !notifTitle || !notifMessage} onClick={handleSendBroadcast}>
                      {isSendingNotif ? 'Sending Broadcast...' : 'Send Global Broadcast'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Other tab contents... */}
        </Tabs>
      </main>
    </div>
  );
}
