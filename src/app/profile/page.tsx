
"use client";

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, CheckCircle2, Phone, Globe, Save, Copy } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    country: ''
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        country: userData.country || ''
      });
    }
  }, [userData]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    
    const userRef = doc(db, 'users', user.uid);
    const updates = {
      ...formData
    };

    try {
      await updateDoc(userRef, updates);
      toast({
        title: "Profile Updated",
        description: "Your personal details have been saved successfully.",
      });
    } catch (err: any) {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updates
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setLoading(false);
    }
  };

  const copyTraderId = () => {
    if (userData?.traderId) {
      navigator.clipboard.writeText(userData.traderId);
      toast({ title: "Copied!", description: "Trader UID copied to clipboard." });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1 text-white">Account Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and account security.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
              <CardContent className="pt-10 flex flex-col items-center text-center">
                <Avatar className="w-32 h-32 mb-6 border-4 border-primary/20 shadow-[0_0_30px_rgba(17,179,245,0.15)]">
                  <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200`} />
                  <AvatarFallback className="text-4xl bg-secondary">{userData?.name?.[0] || 'T'}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-headline font-bold mb-1 text-white">{userData?.name || 'Trader'}</h2>
                <p className="text-sm text-muted-foreground mb-4">{userData?.email}</p>
                
                <div 
                  className="flex items-center gap-2 px-3 py-1 bg-secondary border border-primary/20 rounded-lg cursor-pointer hover:border-primary/50 transition-colors mb-6 group" 
                  onClick={copyTraderId}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">UID:</span>
                  <span className="font-mono text-sm font-bold text-white">{userData?.traderId || '--------'}</span>
                  <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <div className="flex flex-col gap-2 w-full mb-8">
                  <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] font-bold tracking-widest px-3 py-1 justify-center">
                    {userData?.tier || 'Bronze'} Tier
                  </Badge>
                  {userData?.kycVerified ? (
                    <Badge className="bg-accent/20 text-accent border-accent/30 uppercase text-[10px] flex gap-1 font-bold tracking-widest px-3 py-1 justify-center">
                      <CheckCircle2 className="w-3 h-3" /> KYC Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest px-3 py-1 border-border/50 justify-center">
                      KYC Not Verified
                    </Badge>
                  )}
                </div>
                <Button variant="outline" className="w-full border-border/50 hover:bg-secondary">Update Photo</Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-primary" /> Security
                </CardTitle>
                <CardDescription>Protect your trading account access.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="secondary" className="w-full justify-start h-11 px-4 font-bold text-xs uppercase tracking-widest">
                  Change Password
                </Button>
                <Button variant="secondary" className="w-full justify-start h-11 px-4 font-bold text-xs uppercase tracking-widest">
                  Enable 2FA Authentication
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <Card className="border-border/50 bg-card/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-headline text-white">Personal Details</CardTitle>
                <CardDescription>Update your contact information and location details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <User className="w-3.5 h-3.5 text-primary" /> Full Name
                    </Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-secondary/30 h-11 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
                    </Label>
                    <Input value={userData?.email || ''} disabled className="bg-secondary/10 text-muted-foreground cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                    </Label>
                    <Input 
                      placeholder="+1 (555) 000-0000" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-secondary/30 h-11 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Globe className="w-3.5 h-3.5 text-primary" /> Country
                    </Label>
                    <Input 
                      placeholder="United Kingdom" 
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="bg-secondary/30 h-11 text-white"
                    />
                  </div>
                </div>

                <div className="pt-8 border-t border-border/50">
                  <Button 
                    className="font-bold px-10 h-12 rounded-xl cyan-box-glow hover:scale-[1.02] transition-all"
                    onClick={handleSave}
                    disabled={loading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving Changes...' : 'Save All Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
