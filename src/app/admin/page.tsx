
"use client";

import { useState, useMemo, Suspense } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useFirestore, useCollection } from '@/firebase';
import { doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const ADMIN_PASSWORD = "93463962569392846256";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const db = useFirestore();

  // Selected user for account management
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);
  const [provisionPlan, setProvisionPlan] = useState('1-Step Pro');
  const [provisionSize, setProvisionSize] = useState('$100,000');
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Fetch data
  const emptyConstraints = useMemo(() => [], []);
  const { data: orders } = useCollection<any>('orders', emptyConstraints);
  const { data: traders } = useCollection<any>('users', emptyConstraints);
  const { data: accounts } = useCollection<any>('accounts', emptyConstraints);
  const { data: payouts } = useCollection<any>('payouts', emptyConstraints);

  const filteredTraders = useMemo(() => {
    if (!searchTerm) return traders;
    const lower = searchTerm.toLowerCase();
    return traders.filter(t => 
      t.name?.toLowerCase().includes(lower) || 
      t.email?.toLowerCase().includes(lower) ||
      t.phone?.includes(lower) ||
      t.uid?.toLowerCase().includes(lower) ||
      t.country?.toLowerCase().includes(lower)
    );
  }, [traders, searchTerm]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({ title: "Admin Access Granted", description: "Welcome back, Commander." });
    } else {
      toast({ variant: "destructive", title: "Access Denied", description: "Incorrect administrative password." });
    }
  };

  const handleActivateAccount = async () => {
    if (!selectedUser) return;
    setIsProvisioning(true);
    try {
      const accountId = Math.random().toString(36).substring(7).toUpperCase();
      const login = Math.floor(1000000 + Math.random() * 9000000).toString();
      const password = Math.random().toString(36).substring(2, 12);
      
      const accountData = {
        userId: selectedUser.uid,
        email: selectedUser.email,
        plan: provisionPlan,
        size: provisionSize,
        mt5Login: login,
        mt5Password: password,
        mt5Server: "PrimeFunded-Demo",
        balance: parseFloat(provisionSize.replace('$', '').replace(',', '').replace('k', '000')),
        status: "active",
        startDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'accounts', accountId), accountData);
      
      // Update user document too for quick metrics
      const userRef = doc(db, 'users', selectedUser.uid);
      await updateDoc(userRef, {
        plan: provisionPlan,
        accountSize: provisionSize,
        balance: accountData.balance
      });

      toast({ title: "Account Activated", description: `Funded account created for ${selectedUser.email}` });
      setIsManageAccountOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Activation Failed", description: err.message });
    } finally {
      setIsProvisioning(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-primary/20 bg-card/50 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/30 shadow-[0_0_30px_rgba(17,179,245,0.2)]">
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
                    className="pr-10 h-12 rounded-xl"
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
              <Button type="submit" className="w-full h-12 font-bold text-lg rounded-xl cyan-box-glow transition-all duration-200">
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
          <Badge variant="outline" className="px-4 py-1.5 border-primary/50 text-primary uppercase font-bold tracking-widest text-[10px]">ADMIN SESSION ACTIVE</Badge>
        </header>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-secondary/50 border border-border p-1 h-12 w-full justify-start overflow-x-auto overflow-y-hidden rounded-xl">
            <TabsTrigger value="overview" className="flex gap-2 transition-all duration-200 font-bold"><Activity className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="orders" className="flex gap-2 transition-all duration-200 font-bold">
              <ShoppingCart className="w-4 h-4" /> Orders
              {orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="bg-destructive text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center ml-1">
                  {orders.filter(o => o.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex gap-2 transition-all duration-200 font-bold"><Users className="w-4 h-4" /> Users</TabsTrigger>
            <TabsTrigger value="payouts" className="flex gap-2 transition-all duration-200 font-bold">
              <Wallet className="w-4 h-4" /> Payouts
              {payouts?.filter(p => p.status === 'pending').length > 0 && (
                <span className="bg-destructive text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center ml-1">
                  {payouts.filter(p => p.status === 'pending').length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-2 transition-all duration-200 font-bold"><SettingsIcon className="w-4 h-4" /> Settings</TabsTrigger>
          </TabsList>

          <Suspense fallback={<div className="flex justify-center p-20"><RefreshCw className="w-10 h-10 animate-spin text-primary" /></div>}>
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Traders" value={traders.length.toString()} icon={<Users />} color="blue" />
                <StatCard title="Total Orders" value={orders.length.toString()} icon={<ShoppingCart />} color="amber" />
                <StatCard title="Total Revenue" value={`$${orders.reduce((acc, o) => acc + (parseFloat(o.price?.replace('$', '').replace(',', '') || '0')), 0).toLocaleString()}`} icon={<DollarSign />} color="green" />
                <StatCard title="Payouts Sent" value={`$${payouts?.filter(p => p.status === 'done').reduce((acc, p) => acc + (parseFloat(p.amount || '0')), 0).toLocaleString() || '0'}`} icon={<Wallet />} color="purple" />
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                <Card className="border-border/50 bg-card/40">
                  <CardHeader>
                    <CardTitle className="text-lg font-headline">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {orders.slice(0, 4).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{order.email}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{order.plan} - {order.size}</span>
                        </div>
                        <Badge variant={order.status === 'verified' ? 'default' : 'outline'} className="uppercase text-[9px] font-black">{order.status}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/40">
                  <CardHeader>
                    <CardTitle className="text-lg font-headline">Recent Payouts</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {payouts?.slice(0, 4).length > 0 ? payouts.slice(0, 4).map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-white/5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{p.email}</span>
                          <span className="text-xs text-accent font-bold">${p.amount}</span>
                        </div>
                        <Badge variant="outline" className="uppercase text-[9px] font-black">{p.status}</Badge>
                      </div>
                    )) : <p className="text-sm text-muted-foreground text-center py-4 italic">No payout requests found.</p>}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="border-border/50 bg-card/40">
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
                            <td className="py-4 px-4 font-mono text-[10px]">{order.network || 'USDT'}</td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1 group cursor-help">
                                <span className="max-w-[80px] truncate text-[10px] text-muted-foreground font-mono">{order.txHash}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant={order.status === 'pending' ? 'outline' : 'default'} className={order.status === 'verified' ? 'bg-accent text-accent-foreground uppercase text-[9px] font-black' : 'uppercase text-[9px] font-black'}>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                {order.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="bg-accent hover:bg-accent/90 h-8 px-3 rounded-lg font-bold" onClick={() => handleVerifyOrder(order)}>
                                      <Check className="w-4 h-4 mr-1" /> Verify
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-destructive border-destructive/20 h-8 px-3 rounded-lg font-bold hover:bg-destructive/10" onClick={() => handleRejectOrder(order)}>
                                      <X className="w-4 h-4 mr-1" /> Reject
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

            <TabsContent value="users">
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    className="pl-10 h-12 rounded-xl" 
                    placeholder="Search by name, email, phone or UID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button className="h-12 px-6 font-bold rounded-xl" onClick={() => setSearchTerm('')}>Clear Search</Button>
              </div>

              <Card className="border-border/50 bg-card/40">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                          <th className="py-4 px-4">Name/Contact</th>
                          <th className="py-4 px-4">Location</th>
                          <th className="py-4 px-4">Signup Info</th>
                          <th className="py-4 px-4">Active Plan</th>
                          <th className="py-4 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {filteredTraders.map((trader) => (
                          <tr key={trader.id} className="hover:bg-secondary/10 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold">{trader.name}</span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {trader.email}</span>
                                  {trader.phone && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {trader.phone}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 text-xs">
                                <Globe className="w-3 h-3 text-muted-foreground" />
                                <span>{trader.country || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-mono text-muted-foreground">UID: {trader.uid?.substring(0, 8)}...</span>
                                <span className="text-[9px] text-muted-foreground uppercase">{new Date(trader.joinDate || trader.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {trader.plan ? (
                                <Badge className="bg-primary/20 text-primary border-primary/20 uppercase text-[9px] font-black">{trader.plan} - {trader.accountSize}</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">No active account</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-[10px] uppercase font-bold tracking-widest rounded-lg border-border/50 hover:bg-secondary"
                                onClick={() => {
                                  setSelectedUser(trader);
                                  setIsManageAccountOpen(true);
                                }}
                              >
                                Manage Account
                              </Button>
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
              <Card className="border-border/50 bg-card/40">
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
                              <div className="font-bold text-xs">{p.method}</div>
                              <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">{p.address}</div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge variant="outline" className="uppercase text-[9px] font-black">{p.status}</Badge>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex justify-end gap-2">
                                {p.status === 'pending' && (
                                  <>
                                    <Button size="sm" className="bg-primary/80 hover:bg-primary h-8 transition-all font-bold px-3 rounded-lg text-xs" onClick={() => handleUpdatePayout(p.id, 'approved')}>Approve</Button>
                                    <Button size="sm" variant="outline" className="text-destructive h-8 transition-all font-bold px-3 rounded-lg text-xs" onClick={() => handleUpdatePayout(p.id, 'rejected')}>Reject</Button>
                                  </>
                                )}
                                {p.status === 'approved' && (
                                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 h-8 transition-all font-bold px-3 rounded-lg text-xs" onClick={() => handleUpdatePayout(p.id, 'done')}>Mark Paid</Button>
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
                <Card className="border-border/50 bg-card/40">
                  <CardHeader>
                    <CardTitle className="font-headline">General Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Site Name</Label>
                      <Input defaultValue="PrimeFunded" className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Announcement Banner</Label>
                      <Input placeholder="E.g. New Instant Funding Models Available Now!" className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground"><Bell className="w-4 h-4" /> Notifications</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="n1" defaultChecked className="rounded border-border bg-secondary" />
                          <label htmlFor="n1" className="text-sm font-medium">Email me on new order</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="n2" defaultChecked className="rounded border-border bg-secondary" />
                          <label htmlFor="n2" className="text-sm font-medium">Email me on payout request</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="n3" className="rounded border-border bg-secondary" />
                          <label htmlFor="n3" className="text-sm font-medium">Email me on new signup</label>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full h-12 font-bold rounded-xl cyan-box-glow transition-all">Save General Settings</Button>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/40">
                  <CardHeader>
                    <CardTitle className="font-headline">Crypto Payment Gateway</CardTitle>
                    <CardDescription>Update the wallet addresses shown on checkout.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ethereum (ERC20) Address</Label>
                      <Input defaultValue="0x3ab3ca43dc691f468bea91883f493cabf6da84d4" className="h-11 font-mono text-[10px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tron (TRC20) Address</Label>
                      <Input defaultValue="TMitDXKKnsHKgBVENHdorV4axBou6KC5JM" className="h-11 font-mono text-[10px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">BNB Smart Chain Address</Label>
                      <Input defaultValue="0x3ab3ca43dc691f468bea91883f493cabf6da84d4" className="h-11 font-mono text-[10px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Polygon (USDT) Address</Label>
                      <Input defaultValue="0x3ab3ca43dc691f468bea91883f493cabf6da84d4" className="h-11 font-mono text-[10px]" />
                    </div>
                    <div className="pt-4 border-t border-border/50 flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Support Email</p>
                        <p className="font-bold text-white text-sm">Supportprimefunded@gmail.com</p>
                      </div>
                    </div>
                    <Button className="w-full h-12 font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-all rounded-xl">Update Wallet Addresses</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Suspense>
        </Tabs>

        {/* Manage Account Dialog */}
        <Dialog open={isManageAccountOpen} onOpenChange={setIsManageAccountOpen}>
          <DialogContent className="sm:max-w-md bg-card border-primary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="text-primary w-5 h-5" /> Activate Funded Account
              </DialogTitle>
              <DialogDescription>
                Assign a trading account to {selectedUser?.name}. This will generate MT5 credentials instantly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Select Plan</Label>
                <Select value={provisionPlan} onValueChange={setProvisionPlan}>
                  <SelectTrigger className="rounded-xl h-11 bg-secondary/50 border-primary/10">
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-Step Pro">1-Step Pro</SelectItem>
                    <SelectItem value="2-Step Classic">2-Step Classic</SelectItem>
                    <SelectItem value="Instant Funding">Instant Funding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Size</Label>
                <Select value={provisionSize} onValueChange={setProvisionSize}>
                  <SelectTrigger className="rounded-xl h-11 bg-secondary/50 border-primary/10">
                    <SelectValue placeholder="Choose account size" />
                  </SelectTrigger>
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
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                <AlertTriangle className="text-primary w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Activating this account will overwrite any existing trial or pending metrics for this user. New MT5 credentials will be sent and displayed on their dashboard.
                </p>
              </div>
            </div>
            <DialogFooter className="sm:justify-start gap-2">
              <Button 
                onClick={handleActivateAccount} 
                className="font-bold cyan-box-glow h-11 flex-1"
                disabled={isProvisioning}
              >
                {isProvisioning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Activate Funded Account
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsManageAccountOpen(false)}
                className="h-11"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );

  // Helper functions
  async function handleVerifyOrder(order: any) {
    try {
      const orderRef = doc(db, 'orders', order.id);
      updateDoc(orderRef, { status: 'verified' });
      
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
      
      // Also update user profile with latest account info
      const userRef = doc(db, 'users', order.userId);
      await updateDoc(userRef, {
        plan: order.plan,
        accountSize: order.size,
        balance: accountData.balance
      });

      toast({ title: "Order Verified", description: `Account created for ${order.email}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: "Failed to provision account." });
    }
  }

  async function handleRejectOrder(order: any) {
    const orderRef = doc(db, 'orders', order.id);
    updateDoc(orderRef, { status: 'rejected' });
    toast({ title: "Order Rejected" });
  }

  async function handleDeleteOrder(id: string) {
    deleteDoc(doc(db, 'orders', id));
    toast({ title: "Order Deleted" });
  }

  async function handleUpdatePayout(id: string, status: string) {
    const payoutRef = doc(db, 'payouts', id);
    updateDoc(payoutRef, { status });
    toast({ title: `Payout ${status}` });
  }
}

function StatCard({ title, value, icon, color }: { title: string, value: string, icon: React.ReactNode, color: 'blue' | 'amber' | 'green' | 'purple' }) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
    green: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.1)]',
  };

  return (
    <Card className={`border shadow-lg transition-all duration-300 rounded-2xl group hover:scale-[1.02] ${colorClasses[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{title}</span>
          <div className="p-2 rounded-xl bg-current/10 border border-current/20">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-headline font-bold text-white tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}
