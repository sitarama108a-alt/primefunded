
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye, Shield, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, MoreVertical, Gift, Ban, CheckCircle2, XCircle, Clock, LayoutDashboard, ChevronLeft, Bell, Send, User, History, Award, BarChart3, Search, ExternalLink, RefreshCw, Copy, Loader2, Image as ImageIcon
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { sendKycApprovalEmail, sendKycRejectionEmail, sendPayoutProcessedEmail } from '@/lib/email';
import { Textarea } from '@/components/ui/textarea';
import DashboardPage from '@/app/dashboard/page';
import { fetchAdminTerminalData, processKycAction, verifyOrderAction } from './actions';
import Image from 'next/image';

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

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isFreeAccountOpen, setIsFreeAccountOpen] = useState(false);
  const [isKycReviewOpen, setIsKycReviewOpen] = useState(false);
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [provisionPlan, setProvisionPlan] = useState('1-Step Pro');
  const [provisionSize, setProvisionSize] = useState('$100,000');

  const loadData = async () => {
    setIsLoading(true);
    const result = await fetchAdminTerminalData();
    if (result.success) {
      setAdminData(result);
    } else {
      toast({ variant: "destructive", title: "Sync Failed", description: result.error });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('admin_active_tab');
    if (saved) setActiveTab(saved);
    
    const savedPass = sessionStorage.getItem('admin_master_key');
    if (savedPass && savedPass === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "93463962569392846256")) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    localStorage.setItem('admin_active_tab', val);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Value copied to clipboard." });
  };

  const getExplorerLink = (hash: string, network: string) => {
    if (!hash) return "#";
    const net = network?.toLowerCase() || "";
    if (net.includes("ethereum")) return `https://etherscan.io/tx/${hash}`;
    if (net.includes("tron")) return `https://tronscan.org/#/transaction/${hash}`;
    if (net.includes("bnb") || net.includes("bsc")) return `https://bscscan.com/tx/${hash}`;
    if (net.includes("polygon")) return `https://polygonscan.com/tx/${hash}`;
    return `https://etherscan.io/tx/${hash}`;
  };

  const orders = adminData?.orders || [];
  const traders = adminData?.users || [];
  const payouts = adminData?.payouts || [];
  const referrals = adminData?.referrals || [];
  const broadcasts = adminData?.broadcasts || [];

  const stats = useMemo(() => {
    if (!adminData) return null;
    const totalRevenue = orders.filter((o: any) => o.status === 'verified').reduce((acc: number, o: any) => acc + parseFloat(o.price?.replace('$', '') || 0), 0) || 0;
    const pendingKyc = traders.filter((t: any) => t.kycStatus === 'pending').length || 0;
    const pendingPayouts = payouts.filter((p: any) => p.status === 'pending').length || 0;
    const activeChallenges = orders.filter((o: any) => o.status === 'verified').length || 0;

    return { totalUsers: traders.length, totalOrders: orders.length, revenue: totalRevenue, pendingKyc, pendingPayouts, activeChallenges };
  }, [adminData]);

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

  const handleVerifyOrder = async (order: any) => {
    setActionLoading(true);
    const result = await verifyOrderAction(order.id);
    if (result.success) {
      toast({ title: "Order Verified", description: "Account provisioned successfully." });
      loadData();
    } else {
      toast({ variant: "destructive", title: "Verification Failed", description: result.error });
    }
    setActionLoading(false);
  };

  const handleKycAction = async (user: any, action: 'verified' | 'rejected') => {
    if (action === 'rejected' && !rejectionReason) {
      toast({ variant: "destructive", title: "Reason Required", description: "Please explain why the documents were rejected." });
      return;
    }

    setActionLoading(true);
    const result = await processKycAction(user.id, action, rejectionReason);
    
    if (result.success) {
      if (action === 'verified') sendKycApprovalEmail(user.email);
      else sendKycRejectionEmail(user.email, rejectionReason);

      toast({ title: `KYC ${action.toUpperCase()} successfully` });
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
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-headline font-bold mb-1 text-white">Administrative Terminal</h1>
              <p className="text-muted-foreground">Monitor performance and manage institutional capital deployment.</p>
            </div>
            <div className="flex gap-4">
               <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                 <Input placeholder="Search trader..." className="pl-10 w-64 h-10 bg-secondary/50 text-white" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <Button variant="outline" size="icon" onClick={loadData} disabled={isLoading} className="bg-secondary/50">
                 <RefreshCw className={cn("w-4 h-4 text-white", isLoading && "animate-spin")} />
               </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-secondary/50 p-1 h-12 w-full justify-start rounded-xl border border-border/50 shrink-0">
              <TabsTrigger value="overview" className="px-6 font-bold cursor-pointer"><Activity className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
              <TabsTrigger value="orders" className="px-6 font-bold cursor-pointer"><ShoppingCart className="w-4 h-4 mr-2" /> Orders</TabsTrigger>
              <TabsTrigger value="users" className="px-6 font-bold cursor-pointer"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
              <TabsTrigger value="kyc" className="px-6 font-bold cursor-pointer"><Fingerprint className="w-4 h-4 mr-2" /> KYC Hub</TabsTrigger>
              <TabsTrigger value="payouts" className="px-6 font-bold cursor-pointer"><Wallet className="w-4 h-4 mr-2" /> Payouts</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-0 custom-scrollbar">
          
          <div className={cn("space-y-8", activeTab === 'overview' ? "block" : "hidden")}>
            {isLoading && !adminData ? <LoadingGrid /> : !stats ? <div className="text-center py-20 text-muted-foreground">Sync required.</div> : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} icon={<Wallet />} color="blue" />
                  <StatCard title="Total Traders" value={stats.totalUsers} icon={<Users />} color="purple" />
                  <StatCard title="Active Challenges" value={stats.activeChallenges} icon={<Award />} color="green" />
                  <StatCard title="Pending KYC" value={stats.pendingKyc} icon={<Fingerprint />} color="amber" />
                </div>
              </>
            )}
          </div>

          <div className={cn(activeTab === 'orders' ? "block" : "hidden")}>
            <Card className="border-border/50 bg-card/30">
              <CardContent className="p-0">
                {isLoading && !adminData ? <LoadingTable /> : (
                  <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                        <tr>
                          <th className="py-4 px-6">User</th>
                          <th className="py-4 px-6">Challenge</th>
                          <th className="py-4 px-6">TX Hash</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {orders?.map((o: any) => (
                          <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                            <td className="py-4 px-6">
                              <span className="font-bold text-white block">{o.email}</span>
                              <span className="text-[10px] text-muted-foreground">ID: {o.userId?.slice(0, 8)}</span>
                            </td>
                            <td className="py-4 px-6">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-white">{o.plan} {o.size}</Badge>
                            </td>
                            <td className="py-4 px-6">
                               <div className="flex items-center gap-2 group">
                                 <TooltipProvider>
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <span className="font-mono text-[10px] truncate max-w-[100px] text-muted-foreground cursor-help">{o.txHash}</span>
                                     </TooltipTrigger>
                                     <TooltipContent className="bg-popover border-border max-w-xs break-all text-[10px] font-mono">
                                       {o.txHash}
                                     </TooltipContent>
                                   </Tooltip>
                                 </TooltipProvider>
                                 <div className="flex items-center gap-1">
                                   <button onClick={() => copyToClipboard(o.txHash)} className="p-1 hover:text-white"><Copy className="w-3 h-3" /></button>
                                   <a href={getExplorerLink(o.txHash, o.network)} target="_blank" rel="noopener noreferrer" className="p-1 hover:text-primary"><ExternalLink className="w-3 h-3" /></a>
                                 </div>
                               </div>
                            </td>
                            <td className="py-4 px-6">
                              <Badge className={o.status === 'verified' ? "bg-accent text-accent-foreground" : "bg-amber-500 text-white"}>{o.status}</Badge>
                            </td>
                            <td className="py-4 px-6 text-right">
                              {o.status === 'pending' && (
                                <Button size="sm" className="h-8 font-bold" onClick={() => handleVerifyOrder(o)} disabled={actionLoading}>
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

          <div className={cn(activeTab === 'kyc' ? "block" : "hidden")}>
             <Card className="border-border/50 bg-card/30">
               <CardHeader><CardTitle className="text-white">KYC Verification Queue</CardTitle></CardHeader>
               <CardContent className="p-0">
                 <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-secondary/30 text-muted-foreground uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
                       <tr>
                         <th className="py-4 px-6">Date</th>
                         <th className="py-4 px-6">Trader</th>
                         <th className="py-4 px-6">Email</th>
                         <th className="py-4 px-6">Status</th>
                         <th className="py-4 px-6 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border/30">
                       {traders?.filter((t: any) => t.kycStatus === 'pending').map((t: any) => (
                         <tr key={t.id} className="hover:bg-primary/5 transition-colors">
                           <td className="py-4 px-6 text-xs text-muted-foreground">{t.kycSubmittedAt ? new Date(t.kycSubmittedAt).toLocaleDateString() : 'N/A'}</td>
                           <td className="py-4 px-6 font-bold text-white">{t.name}</td>
                           <td className="py-4 px-6 text-xs text-muted-foreground">{t.email}</td>
                           <td className="py-4 px-6"><Badge className="bg-amber-500 text-white">PENDING</Badge></td>
                           <td className="py-4 px-6 text-right">
                             <Button size="sm" className="h-8 font-bold" onClick={() => { setSelectedUser(t); setIsKycReviewOpen(true); }}>Review Docs</Button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      </main>

      <Dialog open={isKycReviewOpen} onOpenChange={setIsKycReviewOpen}>
        <DialogContent className="bg-card border-primary/20 max-w-2xl text-white">
          <DialogHeader>
            <DialogTitle>Review KYC Application</DialogTitle>
            <DialogDescription>Verify documents for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-secondary/50 rounded-xl border border-border text-center flex flex-col gap-2">
                 <p className="text-[10px] font-black uppercase text-muted-foreground">Identity Proof</p>
                 <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center relative overflow-hidden border border-white/5">
                   {selectedUser?.idProofUrl ? (
                     <Image src={selectedUser.idProofUrl} alt="ID Proof" fill className="object-cover" unoptimized />
                   ) : (
                     <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="w-8 h-8 opacity-20" />
                        <span className="text-[10px] uppercase font-bold">No Image Found</span>
                     </div>
                   )}
                 </div>
                 {selectedUser?.idProofUrl && <a href={selectedUser.idProofUrl} target="_blank" className="text-[9px] text-primary hover:underline font-bold uppercase">Open Full Image</a>}
               </div>
               <div className="p-4 bg-secondary/50 rounded-xl border border-border text-center flex flex-col gap-2">
                 <p className="text-[10px] font-black uppercase text-muted-foreground">Address Proof</p>
                 <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center relative overflow-hidden border border-white/5">
                   {selectedUser?.addressProofUrl ? (
                     <Image src={selectedUser.addressProofUrl} alt="Address Proof" fill className="object-cover" unoptimized />
                   ) : (
                     <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="w-8 h-8 opacity-20" />
                        <span className="text-[10px] uppercase font-bold">No Image Found</span>
                     </div>
                   )}
                 </div>
                 {selectedUser?.addressProofUrl && <a href={selectedUser.addressProofUrl} target="_blank" className="text-[9px] text-primary hover:underline font-bold uppercase">Open Full Image</a>}
               </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold">Rejection Reason (Required for rejection)</Label>
              <Textarea placeholder="Explain what is missing..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} className="bg-background/50" />
            </div>
          </div>
          <DialogFooter className="gap-2">
             <Button variant="destructive" className="font-bold" onClick={() => handleKycAction(selectedUser, 'rejected')} disabled={actionLoading || !rejectionReason}>
               {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Reject Documents"}
             </Button>
             <Button className="bg-accent text-accent-foreground font-bold" onClick={() => handleKycAction(selectedUser, 'verified')} disabled={actionLoading}>
               {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve & Verify"}
             </Button>
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
