"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, Shield, AlertTriangle, Scale, Target, Info } from 'lucide-react';

const PLAN_RULES = {
  '1-step': {
    evaluation: [
      { text: "10% profit target", check: true },
      { text: "3% daily drawdown limit", check: true },
      { text: "6% maximum drawdown", check: true },
      { text: "Minimum 3 trading days required", check: true },
      { text: "Maximum 1 trade every 3 minutes", check: true },
      { text: "Hold trades for at least 2 minutes", check: true },
      { text: "No time limit - trade at your pace", check: true },
      { text: "All forex pairs and metals allowed", check: true },
      { text: "No martingale strategy allowed", check: false },
      { text: "No signal copying from external sources", check: false },
    ],
    funded: [
      { text: "80% profit split from Day 1", check: true },
      { text: "Daily payouts available", check: true },
      { text: "3% daily drawdown limit", check: true },
      { text: "6% max drawdown limit", check: true },
      { text: "Min 3 trading days between payouts", check: true },
      { text: "Scale account up to $2,000,000", check: true },
    ]
  },
  '2-step': {
    phase1: [
      { text: "8% profit target", check: true },
      { text: "5% daily drawdown", check: true },
      { text: "10% max drawdown", check: true },
      { text: "Minimum 4 trading days", check: true },
      { text: "Unlimited evaluation days", check: true },
      { text: "Do not lose more than 3% on one pair", check: true },
    ],
    phase2: [
      { text: "5% profit target", check: true },
      { text: "5% daily drawdown", check: true },
      { text: "10% max drawdown", check: true },
      { text: "Minimum 4 trading days", check: true },
      { text: "Unlimited verification days", check: true },
    ],
    funded: [
      { text: "80% profit split", check: true },
      { text: "Daily payouts available", check: true },
      { text: "Minimum 5 days trading per payout", check: true },
      { text: "5% daily drawdown", check: true },
      { text: "10% max drawdown", check: true },
    ]
  },
  'instant': {
    funded: [
      { text: "Funded from day one - No evaluation", check: true },
      { text: "No profit target required", check: true },
      { text: "Trade immediately after purchase", check: true },
      { text: "4% daily drawdown", check: true },
      { text: "8% max drawdown", check: true },
      { text: "3% maximum loss per trade", check: true },
      { text: "First payout available after 48 hours", check: true },
      { text: "Maximum withdraw 3% of account per 24hrs", check: true },
      { text: "Up to 80% profit split", check: true },
      { text: "No overnight holding on Fridays", check: false },
    ]
  }
};

export default function RulesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-headline font-bold mb-2">Trading Rules</h1>
          <p className="text-muted-foreground">Standardized guidelines for all PrimeFunded challenges.</p>
        </header>

        <Tabs defaultValue="1-step" className="space-y-8">
          <TabsList className="bg-secondary/50 border border-border p-1 h-14 w-full max-w-2xl justify-start">
            <TabsTrigger value="1-step" className="h-full px-8 font-bold">1-Step Pro</TabsTrigger>
            <TabsTrigger value="2-step" className="h-full px-8 font-bold">2-Step Classic</TabsTrigger>
            <TabsTrigger value="instant" className="h-full px-8 font-bold">Instant Funding</TabsTrigger>
          </TabsList>

          {/* 1-Step Pro Content */}
          <TabsContent value="1-step" className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <RuleCard title="Evaluation Rules" items={PLAN_RULES['1-step'].evaluation} variant="primary" />
              <RuleCard title="Funded Rules" items={PLAN_RULES['1-step'].funded} variant="accent" />
            </div>
            <ImportantNote />
          </TabsContent>

          {/* 2-Step Classic Content */}
          <TabsContent value="2-step" className="space-y-8">
            <div className="grid md:grid-cols-3 gap-8">
              <RuleCard title="Phase 1: Evaluation" items={PLAN_RULES['2-step'].phase1} variant="primary" />
              <RuleCard title="Phase 2: Verification" items={PLAN_RULES['2-step'].phase2} variant="primary" />
              <RuleCard title="Funded Phase" items={PLAN_RULES['2-step'].funded} variant="accent" />
            </div>
            <ImportantNote customText="A 3% maximum loss per single currency pair is strictly enforced on all 2-Step Classic models to ensure risk diversification." />
          </TabsContent>

          {/* Instant Funding Content */}
          <TabsContent value="instant" className="space-y-8">
            <div className="grid md:grid-cols-1 max-w-4xl gap-8">
              <RuleCard title="Live Account Rules" items={PLAN_RULES['instant'].funded} variant="accent" />
            </div>
            <ImportantNote customText="All positions must be closed before the market close on Fridays (21:00 GMT). Weekend holding is not permitted on Instant Funding models." />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function RuleCard({ title, items, variant }: { title: string, items: any[], variant: 'primary' | 'accent' }) {
  return (
    <Card className={`border-${variant}/20 bg-${variant}/5 h-full shadow-lg`}>
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className="text-xl font-headline font-bold flex items-center gap-3">
          {variant === 'primary' ? <Target className="text-primary w-5 h-5" /> : <Shield className="text-accent w-5 h-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={`mt-1 p-0.5 rounded-full ${item.check ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}`}>
              {item.check ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            </div>
            <span className={`text-sm font-medium ${item.check ? 'text-foreground/90' : 'text-muted-foreground/70 italic'}`}>
              {item.text}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ImportantNote({ customText }: { customText?: string }) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-6 flex items-start gap-4">
        <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
          <AlertTriangle className="text-amber-500 w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black uppercase tracking-widest text-amber-500">Crucial Risk Guidelines</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {customText || "Maximum 1 execution is allowed every 3 minutes. Automated high-frequency trading (HFT) and account-to-account hedging are strictly prohibited. Breach of these rules results in immediate account suspension."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
