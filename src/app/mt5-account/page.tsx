"use client";

import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Terminal, Copy, ExternalLink, ShieldCheck, Key, Server, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MT5AccountPage() {
  const { userData } = useAuth();
  const { toast } = useToast();

  const copyToClipboard = (label: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">MT5 Credentials</h1>
          <p className="text-muted-foreground">Access details for your MetaTrader 5 trading terminal.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-headline font-bold">$100,000 1-Step Pro</CardTitle>
                  <CardDescription>Account Type: Evaluation (Phase 1)</CardDescription>
                </div>
                <Badge className="bg-primary text-primary-foreground font-bold">ACTIVE</Badge>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <CredentialCard 
                    icon={<User className="w-5 h-5 text-primary" />} 
                    label="Login ID" 
                    value="1092844" 
                    onCopy={() => copyToClipboard("Login ID", "1092844")} 
                  />
                  <CredentialCard 
                    icon={<Key className="w-5 h-5 text-primary" />} 
                    label="Master Password" 
                    value="PrimePassword123!" 
                    onCopy={() => copyToClipboard("Password", "PrimePassword123!")} 
                  />
                  <CredentialCard 
                    icon={<Server className="w-5 h-5 text-primary" />} 
                    label="Trading Server" 
                    value="PrimeFunded-Live" 
                    onCopy={() => copyToClipboard("Server", "PrimeFunded-Live")} 
                  />
                  <CredentialCard 
                    icon={<Terminal className="w-5 h-5 text-primary" />} 
                    label="Platform" 
                    value="MetaTrader 5" 
                  />
                </div>

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1 font-bold h-12">
                    <ExternalLink className="w-4 h-4 mr-2" /> Open WebTerminal
                  </Button>
                  <Button variant="secondary" className="flex-1 font-bold h-12">
                    Reset Trading Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <QuickAction title="Download for Windows" icon={<Terminal className="w-6 h-6" />} />
              <QuickAction title="Download for macOS" icon={<Terminal className="w-6 h-6" />} />
              <QuickAction title="Mobile App (iOS/Android)" icon={<Terminal className="w-6 h-6" />} />
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <SecurityItem label="Account Lock" status="Disabled" />
                <SecurityItem label="IP Whitelist" status="None" />
                <SecurityItem label="Investor Password" status="Enabled" />
                <div className="pt-4 border-t border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2">Important Note</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Never share your master password with anyone. PrimeFunded support will never ask for your trading credentials.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function CredentialCard({ icon, label, value, onCopy }: { icon: React.ReactNode, label: string, value: string, onCopy?: () => void }) {
  return (
    <div className="p-4 rounded-xl bg-secondary/50 border border-border">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-lg font-bold">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-primary">
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function QuickAction({ title, icon }: { title: string, icon: React.ReactNode }) {
  return (
    <button className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors group">
      <div className="mb-4 text-muted-foreground group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="text-xs font-bold text-center leading-tight">{title}</span>
    </button>
  );
}

function SecurityItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-primary">{status}</span>
    </div>
  );
}