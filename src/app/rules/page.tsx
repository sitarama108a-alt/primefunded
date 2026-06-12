"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle, Info, Scale } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-2">Trading Rules & Compliance</h1>
          <p className="text-muted-foreground">Standardized guidelines for all PrimeFunded challenges.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RuleCard 
            title="Drawdown Limits" 
            icon={<Shield className="text-primary" />}
            content="Daily loss is calculated based on the starting equity or balance of the day (whichever is higher). Maximum total drawdown is fixed at the starting account balance."
          />
          <RuleCard 
            title="Inactivity Policy" 
            icon={<AlertCircle className="text-accent" />}
            content="Accounts with no trading activity for more than 30 consecutive days will be automatically expired. Contact support to request an extension."
          />
          <RuleCard 
            title="Trading Style" 
            icon={<Scale className="text-primary" />}
            content="We allow EAs, hedging, and news trading on all evaluation models. However, high-frequency trading (HFT) and arbitrage are strictly prohibited."
          />
          <RuleCard 
            title="Profit Payouts" 
            icon={<Info className="text-accent" />}
            content="Payouts are processed bi-weekly. Minimum payout amount is $100. Verification of KYC is required before the first withdrawal."
          />
        </div>

        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">AI Compliance Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every PrimeFunded account is monitored by our proprietary AI Compliance system. This tool provides real-time warnings on your dashboard to help you avoid accidental breaches. Note that the AI monitor is an assistance tool; traders are ultimately responsible for adhering to all rules.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function RuleCard({ title, content, icon }: { title: string, content: string, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="p-2 bg-secondary rounded-lg">
          {icon}
        </div>
        <CardTitle className="text-lg font-headline">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
      </CardContent>
    </Card>
  );
}
