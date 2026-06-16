
"use client"

import { useMemo, useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, Shield, AlertTriangle, Target, Skull, AlertCircle, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PLAN_RULES = {
  '1-step': {
    evaluation: [
      { text: "10% profit target", check: true },
      { text: "3% daily drawdown limit", check: true },
      { text: "6% maximum drawdown", check: true },
      { text: "Trading Leverage: 1:100", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
      { text: "Minimum 5 trading days required", check: true },
      { text: "Maximum 1 execution every 3 minutes", check: true },
      { text: "Hold trades for at least 2 minutes", check: true },
      { text: "No time limit", check: true },
      { text: "No martingale allowed (Soft Breach)", check: false },
    ],
    funded: [
      { text: "80% profit split", check: true },
      { text: "Trading Leverage: 1:30", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
      { text: "Minimum 5 trading days required before payout request", warning: true },
      { text: "1% max floating loss (Hard Breach)", warning: true },
      { text: "3% daily drawdown limit (Hard Breach)", warning: true },
      { text: "6% max drawdown limit (Hard Breach)", warning: true },
      { text: "No martingale (Hard Breach)", check: false },
    ]
  },
  '2-step': {
    phase1: [
      { text: "8% profit target", check: true },
      { text: "5% daily drawdown", check: true },
      { text: "10% max drawdown", check: true },
      { text: "Trading Leverage: 1:100", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
      { text: "Minimum 5 trading days", check: true },
    ],
    phase2: [
      { text: "5% profit target", check: true },
      { text: "5% daily drawdown", check: true },
      { text: "10% max drawdown", check: true },
      { text: "Trading Leverage: 1:100", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
      { text: "Minimum 5 trading days", check: true },
    ],
    funded: [
      { text: "80% profit split", check: true },
      { text: "Trading Leverage: 1:30", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
      { text: "Minimum 5 trading days required before payout request", warning: true },
      { text: "1% max floating loss (Hard Breach)", warning: true },
      { text: "5% daily drawdown limit (Hard Breach)", warning: true },
      { text: "10% max drawdown limit (Hard Breach)", warning: true },
      { text: "No martingale (Hard Breach)", check: false },
    ]
  },
  '3-step': {
    phase1: [
      { text: "10% profit target", check: true },
      { text: "4% daily drawdown", check: true },
      { text: "8% max drawdown", check: true },
      { text: "Minimum 7 trading days", check: true },
      { text: "Trading Leverage: 1:100", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
    ],
    phase2: [
      { text: "8% profit target", check: true },
      { text: "4% daily drawdown", check: true },
      { text: "8% max drawdown", check: true },
      { text: "Minimum 6 trading days", check: true },
      { text: "Trading Leverage: 1:100", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
    ],
    phase3: [
      { text: "5% profit target", check: true },
      { text: "4% daily drawdown", check: true },
      { text: "8% max drawdown", check: true },
      { text: "Minimum 5 trading days", check: true },
      { text: "Trading Leverage: 1:100", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
    ],
    funded: [
      { text: "80% profit split (Bi-Weekly)", check: true },
      { text: "100% profit split (Monthly)", check: true },
      { text: "Trading Leverage: 1:30", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
      { text: "Minimum 5 trading days required before payout request", warning: true },
      { text: "1% max floating loss (Hard Breach)", warning: true },
      { text: "4% daily drawdown limit (Hard Breach)", warning: true },
      { text: "8% max drawdown limit (Hard Breach)", warning: true },
      { text: "No martingale (Hard Breach)", check: false },
    ]
  },
  'instant': {
    funded: [
      { text: "70% profit split", check: true },
      { text: "Trading Leverage: 1:30", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
      { text: "Daily payouts available", check: true },
      { text: "First payout after 24 hours", check: true },
      { text: "1% max floating loss (Hard Breach)", warning: true },
      { text: "3% daily drawdown (Hard Breach)", warning: true },
      { text: "4% max drawdown (Hard Breach)", warning: true },
      { text: "3% max loss per single trade", warning: true },
      { text: "No Friday overnight holding (Hard Breach)", check: false },
      { text: "Max withdraw 3% per 24hrs", warning: true },
      { text: "No payout exceeding daily drawdown", warning: true },
    ]
  }
};

export default function RulesPage() {
  const { userData } = useAuth();
  const [activePlan, setActivePlan] = useState('1-step');

  useEffect(() => {
    if (userData?.accountPlan) {
      const p = userData.accountPlan.toLowerCase();
      if (p.includes('1-step')) setActivePlan('1-step');
      else if (p.includes('2-step')) setActivePlan('2-step');
      else if (p.includes('3-step')) setActivePlan('3-step');
      else if (p.includes('instant')) setActivePlan('instant');
    }
  }, [userData]);

  const currentPhaseName = useMemo(() => {
    const phase = userData?.currentPhase || 'evaluation';
    if (phase === 'evaluation') return 'Evaluation Phase';
    if (phase === 'phase1') return 'Phase 1';
    if (phase === 'phase2') return 'Phase 2';
    if (phase === 'phase3') return 'Phase 3';
    if (phase === 'funded') return 'Funded Stage';
    return phase;
  }, [userData?.currentPhase]);

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2 text-white">Trading Rules</h1>
            <p className="text-muted-foreground">Comprehensive guide to maintain your funding eligibility.</p>
          </div>
          {userData?.currentPhase && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 bg-primary/10 border border-primary/30 px-6 py-3 rounded-2xl shadow-xl shadow-primary/5"
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your Current Status</p>
                <p className="text-lg font-bold text-white uppercase">{currentPhaseName}</p>
              </div>
            </motion.div>
          )}
        </header>

        <div className="mb-8 p-4 bg-destructive/15 border-l-4 border-destructive rounded-r-lg flex items-center gap-3">
          <AlertCircle className="text-destructive w-5 h-5 shrink-0" />
          <p className="text-sm font-bold text-destructive uppercase tracking-tight">
            ⚠️ Hard breaches result in immediate account termination with no appeal.
          </p>
        </div>

        <Tabs value={activePlan} onValueChange={setActivePlan} className="space-y-12">
          <TabsList className="bg-secondary/50 border border-border p-1 h-14 w-full max-w-4xl justify-start overflow-x-auto no-scrollbar">
            <TabsTrigger value="1-step" className="h-full px-8 font-bold">1-Step Pro</TabsTrigger>
            <TabsTrigger value="2-step" className="h-full px-8 font-bold">2-Step Classic</TabsTrigger>
            <TabsTrigger value="3-step" className="h-full px-8 font-bold">3-Step Classic</TabsTrigger>
            <TabsTrigger value="instant" className="h-full px-8 font-bold">Instant Funding</TabsTrigger>
          </TabsList>

          <TabsContent value="1-step" className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8">
              <RuleCard title="Evaluation Phase" items={PLAN_RULES['1-step'].evaluation} active={userData?.currentPhase === 'evaluation'} />
              <RuleCard title="Funded Stage" items={PLAN_RULES['1-step'].funded} variant="destructive" active={userData?.currentPhase === 'funded'} />
            </div>
          </TabsContent>

          <TabsContent value="2-step" className="space-y-12">
            <div className="grid md:grid-cols-3 gap-8">
              <RuleCard title="Phase 1: Evaluation" items={PLAN_RULES['2-step'].phase1} active={userData?.currentPhase === 'phase1'} />
              <RuleCard title="Phase 2: Verification" items={PLAN_RULES['2-step'].phase2} active={userData?.currentPhase === 'phase2'} />
              <RuleCard title="Funded Stage" items={PLAN_RULES['2-step'].funded} variant="destructive" active={userData?.currentPhase === 'funded'} />
            </div>
          </TabsContent>

          <TabsContent value="3-step" className="space-y-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <RuleCard title="Phase 1" items={PLAN_RULES['3-step'].phase1} active={userData?.currentPhase === 'phase1'} />
              <RuleCard title="Phase 2" items={PLAN_RULES['3-step'].phase2} active={userData?.currentPhase === 'phase2'} />
              <RuleCard title="Phase 3" items={PLAN_RULES['3-step'].phase3} active={userData?.currentPhase === 'phase3'} />
              <RuleCard title="Funded Stage" items={PLAN_RULES['3-step'].funded} variant="destructive" active={userData?.currentPhase === 'funded'} />
            </div>
          </TabsContent>

          <TabsContent value="instant" className="space-y-12">
            <div className="grid md:grid-cols-1 max-w-4xl gap-8">
              <RuleCard title="Live Account Rules" items={PLAN_RULES['instant'].funded} variant="destructive" active={true} />
            </div>
          </TabsContent>
        </Tabs>

        <section className="mt-20 space-y-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-secondary rounded-lg">
                <Shield className="text-primary w-6 h-6" />
             </div>
             <h2 className="text-3xl font-headline font-bold text-white">Breach Protocol</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-destructive/5 border-destructive/20 p-8">
              <h3 className="text-xl font-bold text-destructive mb-4 flex items-center gap-2">
                <Skull className="w-5 h-5" /> Hard Breach
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Violating hard rules results in immediate liquidation of your trading account. The account is terminated, and all profits are forfeited. No appeals are permitted for hard breaches.
              </p>
              <ul className="space-y-3">
                <ProtocolItem text="Daily Drawdown limit reached" />
                <ProtocolItem text="Maximum Drawdown limit reached" />
                <ProtocolItem text="Unauthorized Martingale / Grid trading" />
              </ul>
            </Card>

            <Card className="bg-amber-500/5 border-amber-500/20 p-8">
              <h3 className="text-xl font-bold text-amber-500 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Soft Breach
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Soft rules are designed to protect your evaluation. Violating a soft rule results in a formal warning or a reset of the evaluation phase without terminating your eligibility for funding.
              </p>
              <ul className="space-y-3">
                <ProtocolItem text="Holding over the weekend (on specific plans)" />
                <ProtocolItem text="Copying unauthorized external signals" />
                <ProtocolItem text="Inconsistent execution patterns" />
              </ul>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}

function RuleCard({ title, items, variant = 'primary', active }: { title: string, items: any[], variant?: 'primary' | 'destructive', active?: boolean }) {
  const isDestructive = variant === 'destructive';
  return (
    <Card className={cn(
      "h-full transition-all duration-500 relative",
      active ? "border-primary ring-2 ring-primary/20 scale-[1.02] shadow-2xl shadow-primary/10 bg-primary/5" : "border-border/50 opacity-60 grayscale-[0.5] bg-card/40",
      isDestructive && active ? "border-destructive ring-destructive/20 shadow-destructive/10 bg-destructive/5" : ""
    )}>
      {active && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10 shadow-lg">
          Your Current Stage
        </div>
      )}
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className={cn(
          "text-xl font-headline font-bold flex items-center gap-3",
          isDestructive ? 'text-destructive' : 'text-primary'
        )}>
          {isDestructive ? <Skull className="w-5 h-5" /> : <Target className="text-primary w-5 h-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={cn(
              "mt-1 p-0.5 rounded-full",
              item.check ? 'bg-accent/20 text-accent' : item.warning ? 'bg-amber-500/20 text-amber-500' : 'bg-destructive/20 text-destructive'
            )}>
              {item.check ? <Check className="w-3.5 h-3.5" /> : item.warning ? <AlertTriangle className="w-3.5 h-3.5" /> : <Skull className="w-3.5 h-3.5" />}
            </div>
            <span className={cn(
              "text-sm font-medium",
              (item.warning || !item.check) ? 'text-destructive' : 'text-foreground/90'
            )}>
              {item.text}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProtocolItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="w-1.5 h-1.5 rounded-full bg-border" />
      {text}
    </li>
  );
}
