"use client";

import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { userData } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">Account Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and KYC status.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardContent className="pt-10 flex flex-col items-center text-center">
              <Avatar className="w-32 h-32 mb-6 border-4 border-primary/20">
                <AvatarImage src="https://picsum.photos/seed/user/200" />
                <AvatarFallback className="text-4xl">{userData?.name?.[0] || 'T'}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-headline font-bold">{userData?.name || 'Trader'}</h2>
              <p className="text-sm text-muted-foreground mb-4">{userData?.email}</p>
              <div className="flex gap-2 mb-8">
                <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px]">{userData?.tier || 'Pro'}</Badge>
                <Badge className="bg-accent/20 text-accent border-accent/30 uppercase text-[10px] flex gap-1"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>
              </div>
              <Button variant="outline" className="w-full">Update Photo</Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue={userData?.name} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input defaultValue={userData?.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+1 (555) 000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input defaultValue="United Kingdom" />
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Security
                </h4>
                <div className="flex gap-4">
                  <Button variant="secondary">Change Password</Button>
                  <Button variant="secondary">Enable 2FA</Button>
                </div>
              </div>
              <Button className="font-bold px-8">Save Changes</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
