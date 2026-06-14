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
  Eye, Shield, Users, ShoppingCart, Wallet, Activity, Fingerprint, TrendingUp, MoreVertical, Gift, Ban, CheckCircle2, XCircle, Clock, LayoutDashboard, ChevronLeft, Bell, Send, User, History, Award, BarChart3, Search, ExternalLink, RefreshCw, Copy, Loader2, Image as ImageIcon, Settings, Upload, Save, Instagram, MessageCircle, Phone
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
  const branding = useBrandSettings();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isKycReviewOpen, setIsKycReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [socialLinks, setSocialLinks] = useState({
    discord: '',
    instagram: '',
    telegram: '',
    whatsapp: ''
  });
  const [savingLinks, setSavingLinks] = useState(false);

  useEffect(() => {
    if (branding && !branding.loading) {
      setSocialLinks({
        discord: branding.discordUrl || '',
        instagram: branding.instagramUrl || '',
        telegram: branding.telegramUrl || '',
        whatsapp: branding.whatsappUrl || ''
      });
    }
  }, [branding]);

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

  const handleSaveSocialLinks = async () => {
    setSavingLinks(true);
    try {
      const brandRef = doc(db, 'settings', 'brand');
      await setDoc(brandRef, {
        discordUrl: socialLinks.discord,
        instagramUrl: socialLinks.instagram,
        telegramUrl: socialLinks.telegram,
        whatsappUrl: socialLinks.whatsapp
      }, { merge: true });
      toast({ title: "Links Saved", description: "Community links have been updated across the site." });
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSavingLinks(false);
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

          <div className={cn("space-y-8 pb-20", activeTab === 'settings' ? "block" : "hidden")}>
            <div className="max-w-3xl grid gap-8">
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
                        {branding.logoUrl ? (
                          <Image src={branding.logoUrl} alt="Platform Logo" width={96} height={96} className="object-cover" />
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
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" /> Community Links
                  </CardTitle>
                  <CardDescription>Configure external social and community destinations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <DiscordIcon className="w-3.5 h-3.5" /> Discord Invite
                      </Label>
                      <Input 
                        placeholder="https://discord.gg/..." 
                        value={socialLinks.discord}
                        onChange={e => setSocialLinks({...socialLinks, discord: e.target.value})}
                        className="bg-secondary/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <Instagram className="w-3.5 h-3.5" /> Instagram Profile
                      </Label>
                      <Input 
                        placeholder="https://instagram.com/..." 
                        value={socialLinks.instagram}
                        onChange={e => setSocialLinks({...socialLinks, instagram: e.target.value})}
                        className="bg-secondary/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <Send className="w-3.5 h-3.5" /> Telegram Channel
                      </Label>
                      <Input 
                        placeholder="https://t.me/..." 
                        value={socialLinks.telegram}
                        onChange={e => setSocialLinks({...socialLinks, telegram: e.target.value})}
                        className="bg-secondary/30 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" /> WhatsApp Group
                      </Label>
                      <Input 
                        placeholder="https://chat.whatsapp.com/..." 
                        value={socialLinks.whatsapp}
                        onChange={e => setSocialLinks({...socialLinks, whatsapp: e.target.value})}
                        className="bg-secondary/30 text-white"
                      />
                    </div>
                  </div>
                  <Button 
                    className="font-bold cursor-pointer" 
                    onClick={handleSaveSocialLinks}
                    disabled={savingLinks}
                  >
                    {savingLinks ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Community Links
                  </Button>
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

function DiscordIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993.023.03.07.039.084.028a19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
    </svg>
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
