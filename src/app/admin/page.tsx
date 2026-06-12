"use client";

import { useState, useEffect, useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  Mail
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, deleteDoc, collection, setDoc, serverTimestamp } from 'firebase/firestore';

const ADMIN_PASSWORD = "93463962569392846256";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  // Fetch data
  const { data: orders } = useCollection<any>('orders');
  const { data: traders } = useCollection<any>('users');
  const { data: accounts } = useCollection<any>('accounts');
  const { data: payouts } = useCollection<any>('payouts');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Admin Access Granted", description: "Welcome back, Commander." });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Incorrect administrative password." });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30">
              <Lock className="text-primary w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-headline font-bold">Admin Access</CardTitle>
            <CardDescription>Please enter the master password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Master Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 font-bold text-lg cyan-box-glow">
                Verify Credentials
              </Button>
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
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1 flex items-center gap-3">
              <Shield className="text-primary" /> Admin Oversight
            </h1>
            <p className="text-muted-foreground">Global control and manual provisioning terminal.</p>
          </div>
          <Badge variant="outline" className="px-4 py-1.5 border-primary/50 text-primary">ADMIN SESSION ACTIVE</Badge>
        </header>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-secondary/50 border border-border p-1 h-12 w-full justify-start overflow-x-auto overflow-y-hidden">
            <TabsTrigger value="overview" className="flex gap-2"><Users className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="orders" className="flex gap-2">
              <ShoppingCart className="w-4 h-4" /> Orders
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="bg-destructive text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center ml-1">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="traders" className="flex gap-2"><Users className="w-4 h-4" /> Traders</TabsTrigger>
            <TabsTrigger value="payouts" className="flex gap-2">
              <Wallet className="w-4 h-4" /> Payouts
              {payouts?.filter(p => p.status === 'pending').length > 0 && (
                <span className="bg-destructive text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center ml-1">
                  {payouts.filter(p => p.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-2"><SettingsIcon className="w-4 h-4" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Traders" value={traders.length.toString()} icon={<Users />} color="blue" />
              <StatCard title="Total Orders" value={orders.length.toString()} icon={<ShoppingCart />} color="amber" />
              <StatCard title="Total Revenue" value={`$${orders.reduce((acc, o) => acc + (parseFloat(o.price?.replace('$', '') || '0')), 0).toLocaleString()}`} icon={<DollarSign />} color="green" />
              <StatCard title="Payouts Sent" value={`$${payouts?.filter(p => p.status === 'done').reduce((acc, p) => acc + (parseFloat(p.amount || '0')), 0).toLocaleString() || '0'}`} icon={<Wallet />} color="purple" />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orders.slice(0, 4).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{order.email}</span>
                        <span className="text-xs text-muted-foreground">{order.plan} - {order.size}</span>
                      </div>
                      <Badge variant={order.status === 'verified' ? 'default' : 'outline'}>{order.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Payouts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payouts?.slice(0, 4).length > 0 ? payouts.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{p.email}</span>
                        <span className="text-xs text-accent font-bold">${p.amount}</span>
                      </div>
                      <Badge variant="outline">{p.status}</Badge>
                    </div>
                  )) : <p className="text-sm text-muted-foreground text-center py-4">No payout requests found.</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-secondary/20">
                <CardContent className="pt-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Orders</p>
                  <p className="text-3xl font-bold">{orders.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/20">
                <CardContent className="pt-6">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/20">
                <CardContent className="pt-6">
                  <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">Verified Orders</p>
                  <p className="text-3xl font-bold">{orders.filter(o => o.status === 'verified').length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                        <th className="py-4 px-4">Customer</th>
                        <th className="py-4 px-4">Plan & Size</th>
                        <th className="py-4 px-4">Network</th>
                        <th className="py-4 px-4">TXID</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="py-4 px-4 font-bold">{order.email}</td>
                          <td className="py-4 px-4">{order.plan} - <span className="text-primary font-bold">{order.size}</span></td>
                          <td className="py-4 px-4 font-mono text-xs">{order.network || 'USDT'}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1 group cursor-help">
                              <span className="max-w-[80px] truncate text-xs text-muted-foreground font-mono">{order.txHash}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={order.status === 'pending' ? 'outline' : 'default'} className={order.status === 'verified' ? 'bg-accent text-accent-foreground' : ''}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {order.status === 'pending' && (
                                <>
                                  <Button size="sm" className="bg-accent hover:bg-accent/90 h-8 px-2" onClick={() => handleVerifyOrder(order)}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-destructive border-destructive/20 h-8 px-2" onClick={() => handleRejectOrder(order)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive h-8 px-2" onClick={() => handleDeleteOrder(order.id)}>
                                <Trash2 className="w-4 h-4" />
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
          </TabsContent>

          <TabsContent value="traders">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input className="pl-10 h-12" placeholder="Search by name or email..." />
              </div>
              <Button className="h-12 px-6 font-bold">Refresh List</Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                        <th className="py-4 px-4">Name/Email</th>
                        <th className="py-4 px-4">Plan</th>
                        <th className="py-4 px-4">Profit/Loss</th>
                        <th className="py-4 px-4">Tier</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {traders.map((trader) => (
                        <tr key={trader.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold">{trader.name}</div>
                            <div className="text-xs text-muted-foreground">{trader.email}</div>
                          </td>
                          <td className="py-4 px-4">{trader.plan || 'No Active Plan'}</td>
                          <td className={`py-4 px-4 font-mono font-bold ${trader.profit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                            {trader.profit >= 0 ? '+' : ''}{trader.profit || '$0'}
                          </td>
                          <td className="py-4 px-4">
                            <Badge className="bg-primary/20 text-primary border-primary/20">{trader.tier || 'Bronze'}</Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={trader.status === 'active' ? 'default' : 'secondary'}>{trader.status || 'inactive'}</Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-widest">View Full Stats</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-secondary/20 border-l-4 border-l-primary">
                <CardContent className="pt-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Pending Requests</p>
                  <p className="text-3xl font-bold">{payouts?.filter(p => p.status === 'pending').length || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/20 border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Approved Requests</p>
                  <p className="text-3xl font-bold">{payouts?.filter(p => p.status === 'approved').length || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-secondary/20 border-l-4 border-l-accent">
                <CardContent className="pt-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Paid Out Total</p>
                  <p className="text-3xl font-bold">{payouts?.filter(p => p.status === 'done').length || 0}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                        <th className="py-4 px-4">Email</th>
                        <th className="py-4 px-4">Amount</th>
                        <th className="py-4 px-4">Method & Address</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {payouts?.map((p) => (
                        <tr key={p.id} className="hover:bg-secondary/10 transition-colors">
                          <td className="py-4 px-4 font-bold">{p.email}</td>
                          <td className="py-4 px-4 text-accent font-bold text-lg">${p.amount}</td>
                          <td className="py-4 px-4">
                            <div className="font-bold">{p.method}</div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">{p.address}</div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline">{p.status}</Badge>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {p.status === 'pending' && (
                                <>
                                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8" onClick={() => handleUpdatePayout(p.id, 'approved')}>Approve</Button>
                                  <Button size="sm" variant="outline" className="text-destructive h-8" onClick={() => handleUpdatePayout(p.id, 'rejected')}>Reject</Button>
                                </>
                              )}
                              {p.status === 'approved' && (
                                <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 h-8" onClick={() => handleUpdatePayout(p.id, 'done')}>Mark as Done</Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>General Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input defaultValue="PrimeFunded" />
                  </div>
                  <div className="space-y-2">
                    <Label>Announcement Banner</Label>
                    <Input placeholder="E.g. New Instant Funding Models Available Now!" />
                  </div>
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-bold flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="n1" defaultChecked />
                        <label htmlFor="n1" className="text-sm">Email me on new order</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="n2" defaultChecked />
                        <label htmlFor="n2" className="text-sm">Email me on payout request</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="n3" />
                        <label htmlFor="n3" className="text-sm">Email me on new signup</label>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-12 font-bold cyan-box-glow">Save General Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Crypto Payment Gateway</CardTitle>
                  <CardDescription>Update the wallet addresses shown on the checkout page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Ethereum (ERC20) Address</Label>
                    <Input defaultValue="0x3ab3ca43dc691f468bea91883f493cabf6da84d4" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tron (TRC20) Address</Label>
                    <Input defaultValue="TMitDXKKnsHKgBVENHdorV4axBou6KC5JM" />
                  </div>
                  <div className="space-y-2">
                    <Label>BNB Smart Chain (BEP20) Address</Label>
                    <Input defaultValue="0x3ab3ca43dc691f468bea91883f493cabf6da84d4" />
                  </div>
                  <div className="space-y-2">
                    <Label>Polygon (USDT) Address</Label>
                    <Input defaultValue="0x3ab3ca43dc691f468bea91883f493cabf6da84d4" />
                  </div>
                  <div className="pt-4 border-t border-border flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Support Email</p>
                      <p className="font-bold text-white">Supportprimefunded@gmail.com</p>
                    </div>
                  </div>
                  <Button className="w-full h-12 font-bold bg-accent text-accent-foreground hover:bg-accent/90">Update Wallet Addresses</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );

  // Helper functions
  async function handleVerifyOrder(order: any) {
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { status: 'verified' });
      
      // Provision account
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
        balance: parseFloat(order.size.replace('$', '').replace('k', '000')),
        status: "active",
        startDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'accounts', accountId), accountData);
      toast({ title: "Order Verified", description: `Account created for ${order.email}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: err.message });
    }
  }

  async function handleRejectOrder(order: any) {
    const orderRef = doc(db, 'orders', order.id);
    await updateDoc(orderRef, { status: 'rejected' });
    toast({ title: "Order Rejected", description: `Status updated for ${order.email}` });
  }

  async function handleDeleteOrder(id: string) {
    await deleteDoc(doc(db, 'orders', id));
    toast({ title: "Order Deleted" });
  }

  async function handleUpdatePayout(id: string, status: string) {
    const payoutRef = doc(db, 'payouts', id);
    await updateDoc(payoutRef, { status });
    toast({ title: `Payout ${status}` });
  }
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: 'blue' | 'amber' | 'green' | 'purple' }) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    green: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  };

  return (
    <Card className={`border shadow-lg ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold uppercase tracking-widest opacity-80">{title}</span>
          <div className="p-2 rounded-lg bg-current/10">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-headline font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
