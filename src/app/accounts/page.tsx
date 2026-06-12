"use client";

import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Plus, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AccountsPage() {
  const { userData } = useAuth();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Account detail copied to clipboard." });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1">Your Trading Accounts</h1>
            <p className="text-muted-foreground">Manage your evaluations and funded credentials.</p>
          </div>
          <Button asChild>
            <a href="/challenges"><Plus className="w-4 h-4 mr-2" /> New Challenge</a>
          </Button>
        </header>

        <div className="grid gap-6">
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <ShieldCheck className="text-accent w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-headline font-bold">$100,000 1-Step Pro</CardTitle>
                  <p className="text-xs text-muted-foreground">Account ID: PF-882941</p>
                </div>
              </div>
              <Badge className="bg-accent text-accent-foreground uppercase text-[10px]">Active</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6 mb-6">
                <CredentialItem label="Platform" value="MetaTrader 5" />
                <CredentialItem label="Server" value="PrimeFunded-Live" />
                <CredentialItem 
                  label="Login" 
                  value="1092844" 
                  onCopy={() => copyToClipboard("1092844")} 
                />
                <CredentialItem 
                  label="Password" 
                  value="********" 
                  onCopy={() => copyToClipboard("PrimePassword123!")} 
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="h-9 px-4">
                  <ExternalLink className="w-4 h-4 mr-2" /> Open WebTerminal
                </Button>
                <Button variant="secondary" size="sm" className="h-9 px-4">
                  Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 opacity-60 grayscale">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  <ShieldCheck className="text-muted-foreground w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-xl font-headline font-bold">$50,000 2-Step Classic</CardTitle>
                  <p className="text-xs text-muted-foreground">Account ID: PF-112039</p>
                </div>
              </div>
              <Badge variant="secondary" className="uppercase text-[10px]">Breached</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">This account was breached on 2024-02-15 due to Daily Drawdown limit.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function CredentialItem({ label, value, onCopy }: { label: string, value: string, onCopy?: () => void }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{label}</p>
      <div className="flex items-center gap-2">
        <p className="font-mono text-sm font-semibold">{value}</p>
        {onCopy && (
          <button onClick={onCopy} className="text-muted-foreground hover:text-primary transition-colors">
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
