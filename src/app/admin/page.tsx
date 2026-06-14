
"use client";

import { useState, useMemo, useEffect, memo, useRef } from 'react';
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
  Eye, Shield, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, MoreVertical, Gift, Ban, CheckCircle2, XCircle, Clock, LayoutDashboard, ChevronLeft, Bell, Send, User, History, Award, BarChart3, Search, ExternalLink, RefreshCw, Copy, Loader2, Image as ImageIcon, Settings, Upload, Save
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { sendKycApprovalEmail, sendKycRejectionEmail, sendPayoutProcessedEmail } from '@/lib/email';
import { Textarea } from '@/components/ui/textarea';
import DashboardPage from '@/app/dashboard/page';
import { fetchAdminTerminalData, processKycAction, verifyOrderAction } from './actions';
import Image from 'next/image';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseApp } from '@/firebase';
import { useBrandSettings } from '@/hooks/use-brand-settings';

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
  const app = useFirebaseApp();
  const storage = getStorage(app);
  const { logoUrl } = useBrandSettings();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isKycReviewOpen, setIsKycReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);

    try {
      const storageRef = ref(storage, 'brand/logo.png');
      const uploadTask = uploadBytesResumable(storageRef, logoFile);

      uploadTask.on(
        'state_changed',
        null,
        (error) => {
          toast({ variant: "destructive", title: "Upload Failed", description: error.message });
          setUploadingLogo(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const brandRef = doc(db, 'settings', 'brand');
          await setDoc(brandRef, { logoUrl: downloadURL }, { merge: true });
          
          toast({ title: "Logo Updated!", description: "The platform branding has been updated." });
          setUploadingLogo(false);
          setLogoFile(null);
        }
      );
    } catch (err) {
      console.error(err);
      setUploadingLogo(false);
    }
  };

  const orders = adminData?.orders || [];
  const traders = adminData?.users || [];
  const payouts = adminData?.payouts || [];

  const stats = useMemo(() => {
    if (!adminData) return null;
    const totalRevenue = orders.filter((o: any) => o.status === 'verified').reduce((acc: number, o: any) => acc + parseFloat(o.price?.replace('$', '') || 0), 0) || 0;
    const pendingKyc = traders.filter((t: any) => t.kycStatus === 'pending').length || 0;
    const pendingPayouts = payouts.filter((p: any) => p.status === 'pending').length || 0;
    const activeChallenges = orders.filter((o: any) => o.status === 'verified').length || 0;

    return { totalUsers: traders.length, revenue: totalRevenue, pendingKyc, pendingPayouts, activeChallenges };
  }, [adminData]);

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
              <TabsTrigger value="settings" className="px-6 font-bold cursor-pointer"><Settings className="w-4 h-4 mr-2" /> Branding</TabsTrigger>
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

          <div className={cn(activeTab === 'settings' ? "block" : "hidden")}>
            <div className="max-w-2xl">
              <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" /> Brand Identity
                  </CardTitle>
                  <CardDescription>Update the platform logo and visual assets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-background/50 rounded-2xl border border-white/5">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full border-2 border-primary/20 bg-secondary/50 flex items-center justify-center overflow-hidden shadow-2xl">
                        {logoUrl ? (
                          <Image src={logoUrl} alt="Platform Logo" width={96} height={96} className="object-cover" />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-muted-foreground opacity-20" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-4 text-center md:text-left">
                      <div>
                        <h4 className="font-bold text-white">Current Logo</h4>
                        <p className="text-xs text-muted-foreground">Displayed in navbar, auth screens, and loading sequence.</p>
                      </div>
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="font-bold cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                        >
                          <Upload className="w-4 h-4 mr-2" /> {logoFile ? 'Change Selection' : 'Select New Logo'}
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept=".png,.jpg,.jpeg,.svg" 
                          onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                        />
                        {logoFile && (
                          <Button 
                            className="font-bold cyan-box-glow cursor-pointer" 
                            size="sm"
                            onClick={handleLogoUpload}
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Apply Logo
                          </Button>
                        )}
                      </div>
                      {logoFile && <p className="text-[10px] text-accent font-bold uppercase tracking-widest">Selected: {logoFile.name}</p>}
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Requirement:</strong> For best results, use a circular or square PNG with a transparent background. Max size: 2MB.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                           <th className="py-4 px-6">Status</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-border/30">
                         {orders?.map((o: any) => (
                           <tr key={o.id} className="hover:bg-primary/5 transition-colors">
                             <td className="py-4 px-6 font-bold text-white">{o.email}</td>
                             <td className="py-4 px-6 font-mono text-xs">{o.plan} {o.size}</td>
                             <td className="py-4 px-6"><Badge className={o.status === 'verified' ? "bg-accent text-accent-foreground" : "bg-amber-500 text-white"}>{o.status}</Badge></td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </CardContent>
             </Card>
          </div>
        </div>
      </main>
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
