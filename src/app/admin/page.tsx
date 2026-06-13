
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
  Edit2
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp, getDoc, addDoc, collection } from 'firebase/firestore';

const ADMIN_PASSWORD = "93463962569392846256";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const db = useFirestore();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);
  const [provisionPlan, setProvisionPlan] = useState('1-Step Pro');
  const [provisionSize, setProvisionSize] = useState('$100,000');
  const [isProvisioning, setIsProvisioning] = useState(false);

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
        mt5Server: "PrimeFunded-Demo",
        balance: parseFloat(order.size.replace('$', '').replace(',', '').replace('k', '000')),
        status: "active",
        startDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'accounts', accountId), accountData);
      
      const userRef = doc(db, 'users', order.userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      await updateDoc(userRef, {
        plan: order.plan,
        accountSize: order.size,
        balance: accountData.balance
      });

      // Handle Referral Commission
      if (userData?.referredBy) {
        const priceNum = parseFloat(order.price.replace('$', '').replace(',', ''));
        // 10% commission capped at $50
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
        toast({ title: "Referral Commission Generated", description: `$${commission.toFixed(2)} added to referrer (Capped at $50).` });
      }

      toast({ title: "Order Verified", description: `Account created for ${order.email}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed" });
    }
  };

  const handleResetLimit = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { codeChangesCount: 0 });
      toast({ title: "Limit Reset", description: "Referral code change limit reset to 0." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to reset limit." });
    }
  };

  const handleUpdateReferral = async (id: string, status: string) => {
    const refDoc = doc(db, 'referrals', id);
    await updateDoc(refDoc, { status });
    toast({ title: `Referral marked as ${status}` });
  };

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
      <main className="flex-1 p-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-secondary/50 p-1 h-12 w-full justify-start rounded-xl">
            <TabsTrigger value="overview"><Activity className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
            <TabsTrigger value="orders"><ShoppingCart className="w-4 h-4 mr-2" /> Orders</TabsTrigger>
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
            <TabsTrigger value="referrals"><TrendingUp className="w-4 h-4 mr-2" /> Referrals</TabsTrigger>
            <TabsTrigger value="payouts"><Wallet className="w-4 h-4 mr-2" /> Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Traders" value={traders.length} icon={<Users />} />
              <StatCard title="Verified Orders" value={orders.filter(o => o.status === 'verified').length} icon={<ShoppingCart />} />
              <StatCard title="Pending Payouts" value={payouts?.filter(p => p.status === 'pending').length} icon={<Wallet />} />
              <StatCard title="Total Referral Owed" value={`$${referrals?.filter(r => r.status === 'pending').reduce((acc, r) => acc + (r.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={<TrendingUp />} />
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-secondary/20">
                <CardHeader>
                  <CardTitle className="text-lg">System Config</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Min. Payout (Profits)</span>
                    <span className="font-bold">$100.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Min. Payout (Referrals)</span>
                    <span className="font-bold">$100.00</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Referral Commission Cap</span>
                    <span className="font-bold text-accent">$50.00 / purchase</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="bg-card/40">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="py-4 px-4 text-left">Customer</th>
                      <th className="py-4 px-4 text-left">Plan</th>
                      <th className="py-4 px-4 text-left">Status</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b hover:bg-secondary/10">
                        <td className="py-4 px-4">{o.email}</td>
                        <td className="py-4 px-4">{o.plan} - {o.size}</td>
                        <td className="py-4 px-4"><Badge>{o.status}</Badge></td>
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

          <TabsContent value="referrals">
            <Card className="bg-card/40">
              <CardHeader>
                <CardTitle>Referral Commissions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="py-4 px-4 text-left">Referrer UID</th>
                      <th className="py-4 px-4 text-left">Referred User</th>
                      <th className="py-4 px-4 text-left">Commission</th>
                      <th className="py-4 px-4 text-left">Status</th>
                      <th className="py-4 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-secondary/10">
                        <td className="py-4 px-4 font-mono">{r.referrerId.substring(0, 8)}...</td>
                        <td className="py-4 px-4">{r.referredUserEmail}</td>
                        <td className="py-4 px-4 text-accent font-bold">${r.amount.toFixed(2)}</td>
                        <td className="py-4 px-4"><Badge variant="outline">{r.status}</Badge></td>
                        <td className="py-4 px-4 text-right">
                          {r.status === 'pending' && (
                            <Button size="sm" className="bg-accent" onClick={() => handleUpdateReferral(r.id, 'paid')}>Mark Paid</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-card/40">
              <CardHeader>
                <div className="flex justify-between">
                  <Input placeholder="Search users by Name, Email, UID or Referral Code..." className="max-w-md" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="py-4 px-4 text-left">ID / Code</th>
                      <th className="py-4 px-4 text-left">Name</th>
                      <th className="py-4 px-4 text-left">Email</th>
                      <th className="py-4 px-4 text-left">Changes</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTraders.map((t) => (
                      <tr key={t.id} className="border-b">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-bold">{t.traderId}</span>
                            <span className="text-[10px] text-primary font-bold">{t.referralCode}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold">{t.name}</td>
                        <td className="py-4 px-4">{t.email}</td>
                        <td className="py-4 px-4">
                          <Badge variant="secondary">{t.codeChangesCount || 0} / 3</Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleResetLimit(t.id)}
                            title="Reset Code Change Limit"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <Card className="bg-card/40">
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/30">
                      <th className="py-4 px-4 text-left">Trader</th>
                      <th className="py-4 px-4 text-left">Amount</th>
                      <th className="py-4 px-4 text-left">Status</th>
                      <th className="py-4 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts?.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="py-4 px-4">{p.email}</td>
                        <td className="py-4 px-4 font-bold">${p.amount}</td>
                        <td className="py-4 px-4"><Badge>{p.status}</Badge></td>
                        <td className="py-4 px-4 text-right">
                          {p.status === 'pending' && (
                            <Button size="sm" onClick={() => updateDoc(doc(db, 'payouts', p.id), { status: 'approved' })}>Approve</Button>
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
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: any, icon: any }) {
  return (
    <Card className="p-6 bg-secondary/30">
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        <div className="text-primary">{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </Card>
  );
}
