
"use client";

import { useMemo, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Copy, 
  Share2, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Link as LinkIcon,
  Twitter,
  Send,
  MessageCircle
} from 'lucide-react';
import { useCollection } from '@/firebase';
import { where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function ReferralPage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralConstraints = useMemo(() => {
    if (!user?.uid) return [];
    return [where('referrerId', '==', user.uid)];
  }, [user?.uid]);

  const { data: referrals, loading: referralsLoading } = useCollection<any>('referrals', referralConstraints);

  const referralLink = `https://primefunded.com/signup?ref=${userData?.referralCode || ''}`;

  const stats = useMemo(() => {
    if (!referrals) return { total: 0, successful: 0, totalEarned: 0, pendingEarned: 0, paidEarned: 0 };
    return {
      total: referrals.length,
      successful: referrals.filter(r => r.amount > 0).length,
      totalEarned: referrals.reduce((acc, r) => acc + (r.amount || 0), 0),
      pendingEarned: referrals.filter(r => r.status === 'pending').reduce((acc, r) => acc + (r.amount || 0), 0),
      paidEarned: referrals.filter(r => r.status === 'paid').reduce((acc, r) => acc + (r.amount || 0), 0),
    };
  }, [referrals]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
  };

  const share = (platform: 'twitter' | 'telegram' | 'whatsapp') => {
    const text = `Join PrimeFunded and get funded up to $200k! Use my referral link: `;
    const url = referralLink;
    let shareUrl = '';

    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + url)}`;

    window.open(shareUrl, '_blank');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">Referral Program</h1>
          <p className="text-muted-foreground">Invite friends and earn 10% on every challenge purchase they make.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <Card className="lg:col-span-1 border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <CardTitle className="text-xl font-headline">My Referral Code</CardTitle>
              <CardDescription>Share your unique code or link to earn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-background/50 border border-primary/20 text-center">
                <span className="text-2xl font-mono font-bold tracking-widest text-primary uppercase">
                  {userData?.referralCode || 'PRIME-XXXXXX'}
                </span>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => copyToClipboard(referralLink)} 
                  className="w-full h-12 font-bold cyan-box-glow"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Copied Link!' : 'Copy Referral Link'}
                </Button>
                
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="icon" onClick={() => share('twitter')} className="h-12 w-full"><Twitter className="w-5 h-5" /></Button>
                  <Button variant="outline" size="icon" onClick={() => share('telegram')} className="h-12 w-full"><Send className="w-5 h-5" /></Button>
                  <Button variant="outline" size="icon" onClick={() => share('whatsapp')} className="h-12 w-full"><MessageCircle className="w-5 h-5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatSmall title="Total Referrals" value={stats.total} icon={<Users />} />
            <StatSmall title="Purchases" value={stats.successful} icon={<CheckCircle2 />} />
            <StatSmall title="Total Earned" value={`$${stats.totalEarned.toLocaleString()}`} icon={<TrendingUp />} />
            <StatSmall title="Pending" value={`$${stats.pendingEarned.toLocaleString()}`} icon={<Clock />} color="amber" />
            <StatSmall title="Paid" value={`$${stats.paidEarned.toLocaleString()}`} icon={<DollarSign />} color="green" />
            <Card className="bg-secondary/30 flex flex-col justify-center items-center p-4 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Min. Payout</p>
              <p className="text-xl font-bold">$50</p>
            </Card>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-headline font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary w-6 h-6" /> How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <StepItem step="1" icon={<LinkIcon />} title="Copy Link" desc="Copy your unique referral link from above." />
            <StepItem step="2" icon={<Users />} title="Share Link" desc="Share it with your trading community or friends." />
            <StepItem step="3" icon={<DollarSign />} title="Earn 10%" desc="Receive 10% commission on every purchase they make." />
          </div>
        </section>

        <Card className="border-border/50 bg-card/40">
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Trader</th>
                    <th className="py-4 px-6">Challenge</th>
                    <th className="py-4 px-6">Commission</th>
                    <th className="py-4 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {referrals?.length > 0 ? referrals.map((r: any) => (
                    <tr key={r.id} className="hover:bg-secondary/10">
                      <td className="py-4 px-6 text-xs text-muted-foreground">
                        {new Date(r.createdAt?.seconds * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 font-bold truncate max-w-[150px]">
                        {r.referredUserEmail.split('@')[0].slice(0, 3)}***@{r.referredUserEmail.split('@')[1]}
                      </td>
                      <td className="py-4 px-6 text-xs">{r.plan || 'N/A'}</td>
                      <td className="py-4 px-6 font-bold text-accent">${r.amount.toFixed(2)}</td>
                      <td className="py-4 px-6 text-right">
                        <Badge variant={r.status === 'paid' ? 'default' : 'outline'} className="uppercase text-[9px]">
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground italic">No referrals found yet. Start sharing to earn!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StatSmall({ title, value, icon, color = 'blue' }: { title: string, value: string | number, icon: any, color?: string }) {
  const colorMap: any = {
    blue: 'text-primary bg-primary/10 border-primary/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    green: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  };
  return (
    <Card className="bg-secondary/30 border-border/50 p-6">
      <div className={`p-2 rounded-lg w-fit mb-3 border ${colorMap[color]}`}>{icon}</div>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-bold font-headline">{value}</p>
    </Card>
  );
}

function StepItem({ step, icon, title, desc }: { step: string, icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-secondary/20 border border-border flex flex-col items-center text-center group hover:border-primary/50 transition-all">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 border border-primary/20 group-hover:scale-110 transition-transform relative">
        {icon}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center justify-center border-2 border-background">{step}</div>
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
