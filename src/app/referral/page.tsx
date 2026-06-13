
"use client";

import { useMemo, useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
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
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Edit2,
  Check,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { where, doc, updateDoc, query, collection, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ReferralPage() {
  const { user, userData } = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'validating' | 'available' | 'taken' | 'invalid' | 'too-short'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const MIN_WITHDRAWAL = 100;
  const MAX_CHANGES = 3;

  // Auto-generate numeric ID and initial referral code if missing
  useEffect(() => {
    if (userData && user && !userData.referralCode) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const userRef = doc(db, 'users', user.uid);
      updateDoc(userRef, { referralCode: result, codeChangesCount: 0 });
      
      const codeRegRef = doc(db, 'referralCodes', result);
      setDoc(codeRegRef, {
        code: result,
        userId: user.uid,
        active: true,
        createdAt: serverTimestamp()
      });
    }
  }, [userData, user, db]);

  // Real-time availability check
  useEffect(() => {
    if (!isEditing || !newCode) {
      setAvailabilityStatus('idle');
      return;
    }

    if (newCode.length < 4) {
      setAvailabilityStatus('too-short');
      return;
    }

    const alphanumericRegex = /^[A-Z0-9]+$/;
    if (!alphanumericRegex.test(newCode)) {
      setAvailabilityStatus('invalid');
      return;
    }

    if (newCode === userData?.referralCode) {
      setAvailabilityStatus('available');
      return;
    }

    const timeout = setTimeout(async () => {
      setAvailabilityStatus('validating');
      try {
        const codesRef = collection(db, 'referralCodes');
        const q = query(codesRef, where('code', '==', newCode), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setAvailabilityStatus('available');
        } else {
          setAvailabilityStatus('taken');
        }
      } catch (err) {
        setAvailabilityStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [newCode, isEditing, userData?.referralCode, db]);

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
      successful: referrals.filter((r: any) => r.amount > 0).length,
      totalEarned: referrals.reduce((acc: number, r: any) => acc + (r.amount || 0), 0),
      pendingEarned: referrals.filter((r: any) => r.status === 'pending').reduce((acc: number, r: any) => acc + (r.amount || 0), 0),
      paidEarned: referrals.filter((r: any) => r.status === 'paid').reduce((acc: number, r: any) => acc + (r.amount || 0), 0),
    };
  }, [referrals]);

  const canWithdraw = stats.pendingEarned >= MIN_WITHDRAWAL;
  const progressPercent = Math.min((stats.pendingEarned / MIN_WITHDRAWAL) * 100, 100);

  const handleSaveCode = async () => {
    if (!user || availabilityStatus !== 'available' || newCode === userData?.referralCode) return;
    setIsSaving(true);
    try {
      const oldCode = userData.referralCode;
      const userRef = doc(db, 'users', user.uid);
      
      // Update user doc
      await updateDoc(userRef, {
        referralCode: newCode,
        codeChangesCount: (userData.codeChangesCount || 0) + 1,
        lastCodeChange: serverTimestamp()
      });

      // Deactivate old code
      if (oldCode) {
        const oldCodeRef = doc(db, 'referralCodes', oldCode);
        await updateDoc(oldCodeRef, { active: false });
      }

      // Register new code
      const newCodeRef = doc(db, 'referralCodes', newCode);
      await setDoc(newCodeRef, {
        code: newCode,
        userId: user.uid,
        active: true,
        createdAt: serverTimestamp()
      });

      toast({ title: "Code Updated!", description: `Your referral code has been changed to ${newCode}` });
      setIsEditing(false);
      setShowConfirmDialog(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update referral code." });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!userData?.referralCode) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Link copied to clipboard." });
  };

  const share = (platform: 'twitter' | 'telegram' | 'whatsapp') => {
    if (!userData?.referralCode) return;
    const text = `Join PrimeFunded and get funded up to $300k! Use my referral link: `;
    const url = referralLink;
    let shareUrl = '';

    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === 'telegram') shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + url)}`;

    window.open(shareUrl, '_blank');
  };

  const changesRemaining = MAX_CHANGES - (userData?.codeChangesCount || 0);

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">Referral Program</h1>
          <p className="text-muted-foreground">Invite friends and earn up to $50.00 on every challenge purchase they make.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <Card className="lg:col-span-1 border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <CardHeader>
              <CardTitle className="text-xl font-headline">My Referral Code</CardTitle>
              <CardDescription>Customize your code to share with your audience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div 
                      key="editing"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <Input 
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                          placeholder="ENTER NEW CODE"
                          className={cn(
                            "text-2xl font-mono font-bold tracking-widest h-16 text-center uppercase border-2",
                            availabilityStatus === 'available' && "border-accent bg-accent/5",
                            availabilityStatus === 'taken' && "border-destructive bg-destructive/5",
                            availabilityStatus === 'invalid' && "border-amber-500 bg-amber-500/5",
                            availabilityStatus === 'too-short' && "border-muted bg-muted/5"
                          )}
                          maxLength={12}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {availabilityStatus === 'validating' && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                          {availabilityStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-accent" />}
                          {availabilityStatus === 'taken' && <XCircle className="w-5 h-5 text-destructive" />}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        {availabilityStatus === 'available' && <p className="text-[10px] text-accent font-bold uppercase tracking-widest flex items-center justify-center gap-1"><Check className="w-3 h-3" /> {newCode} is available!</p>}
                        {availabilityStatus === 'taken' && <p className="text-[10px] text-destructive font-bold uppercase tracking-widest flex items-center justify-center gap-1"><X className="w-3 h-3" /> Code already taken</p>}
                        {availabilityStatus === 'too-short' && <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Min. 4 characters</p>}
                        {availabilityStatus === 'invalid' && <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Letters & numbers only</p>}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1" 
                          onClick={() => { setIsEditing(false); setNewCode(''); }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="flex-1 font-bold bg-accent hover:bg-accent/90" 
                          disabled={availabilityStatus !== 'available' || newCode === userData?.referralCode}
                          onClick={() => setShowConfirmDialog(true)}
                        >
                          Save
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="display"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl bg-background/50 border border-primary/20 text-center min-h-[64px] flex items-center justify-center group relative"
                    >
                      {userData?.referralCode ? (
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-mono font-bold tracking-widest text-primary uppercase">
                            {userData.referralCode}
                          </span>
                          {changesRemaining > 0 && (
                            <button 
                              onClick={() => { setIsEditing(true); setNewCode(userData.referralCode); }}
                              className="p-2 hover:bg-primary/20 rounded-lg text-primary transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <RefreshCw className="w-6 h-6 animate-spin text-primary/50" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!isEditing && (
                <div className="space-y-4">
                  <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest">
                    {changesRemaining > 0 
                      ? `Changes remaining: ${changesRemaining}/${MAX_CHANGES}`
                      : "Maximum changes reached"
                    }
                  </p>
                  
                  <Button 
                    onClick={() => copyToClipboard(referralLink)} 
                    className="w-full h-12 font-bold cyan-box-glow"
                    disabled={!userData?.referralCode}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? 'Copied Link!' : 'Copy Referral Link'}
                  </Button>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="icon" onClick={() => share('twitter')} className="h-12 w-full" disabled={!userData?.referralCode}><Twitter className="w-5 h-5" /></Button>
                    <Button variant="outline" size="icon" onClick={() => share('telegram')} className="h-12 w-full" disabled={!userData?.referralCode}><Send className="w-5 h-5" /></Button>
                    <Button variant="outline" size="icon" onClick={() => share('whatsapp')} className="h-12 w-full" disabled={!userData?.referralCode}><MessageCircle className="w-5 h-5" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatSmall title="Total Referrals" value={stats.total} icon={<Users />} />
              <StatSmall title="Purchases" value={stats.successful} icon={<CheckCircle2 />} />
              <StatSmall title="Total Earned" value={`$${stats.totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={<TrendingUp />} />
              <StatSmall title="Pending" value={`$${stats.pendingEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={<Clock />} color="amber" />
              <StatSmall title="Paid" value={`$${stats.paidEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={<DollarSign />} color="green" />
              <Card className="bg-secondary/30 flex flex-col justify-center items-center p-4 text-center border-accent/20">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Min. Payout</p>
                <p className="text-xl font-bold text-accent">${MIN_WITHDRAWAL}</p>
              </Card>
            </div>

            <Card className="bg-secondary/20 border-border/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold flex items-center gap-2">
                    Withdrawal Progress
                    {!canWithdraw && <AlertCircle className="w-4 h-4 text-amber-500" />}
                  </span>
                  <span className="text-xs font-mono">${stats.pendingEarned.toFixed(2)} / ${MIN_WITHDRAWAL}.00</span>
                </div>
                <Progress value={progressPercent} className="h-2 mb-4" />
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-xs text-muted-foreground">
                    {canWithdraw 
                      ? "You have reached the minimum requirement for withdrawal." 
                      : `Minimum $${MIN_WITHDRAWAL} required to withdraw pending commissions.`
                    }
                  </p>
                  <Button disabled={!canWithdraw} size="sm" className="font-bold px-8">
                    Request Payout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-headline font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-primary w-6 h-6" /> How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <StepItem step="1" icon={<LinkIcon />} title="Customize Code" desc="Choose a custom referral code that represents your brand." />
            <StepItem step="2" icon={<Users />} title="Share Link" desc="Share your updated link with your trading community." />
            <StepItem step="3" icon={<DollarSign />} title="Earn Rewards" desc="Earn 10% commission (up to $50) on every purchase they make." />
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
                        {r.createdAt?.seconds ? new Date(r.createdAt.seconds * 1000).toLocaleDateString() : 'Processing...'}
                      </td>
                      <td className="py-4 px-6 font-bold truncate max-w-[150px]">
                        {r.referredUserEmail ? `${r.referredUserEmail.split('@')[0].slice(0, 3)}***@${r.referredUserEmail.split('@')[1]}` : 'Anonymous'}
                      </td>
                      <td className="py-4 px-6 text-xs">{r.plan || 'N/A'}</td>
                      <td className="py-4 px-6 font-bold text-accent">${(r.amount || 0).toFixed(2)}</td>
                      <td className="py-4 px-6 text-right">
                        <Badge variant={r.status === 'paid' ? 'default' : 'outline'} className="uppercase text-[9px]">
                          {r.status || 'pending'}
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

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-card border-primary/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500 w-5 h-5" /> Confirm Code Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Changing your referral code to <span className="text-white font-bold">{newCode}</span> will immediately invalidate all previously shared links. Users clicking your old links will no longer be linked to your account.
              <br /><br />
              Changes remaining: <span className="text-white font-bold">{changesRemaining}/{MAX_CHANGES}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSaveCode}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={isSaving}
            >
              {isSaving ? "Updating..." : "Yes, Change Code"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function XCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}
