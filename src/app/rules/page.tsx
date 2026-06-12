"use client"

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, Shield, AlertTriangle, Target, Info, Skull, AlertCircle } from 'lucide-react';
import Link from 'next/link';

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
      { text: "80% profit split", check: true },
      { text: "Trading Leverage: 1:30", check: true },
      { text: "Instruments: Fx, Commodities, Indices, Stock, Crypto", check: true },
      { text: "Daily payouts available", check: true },
      { text: "First payout after 24 hours", check: true },
      { text: "1% max floating loss (Hard Breach)", warning: true },
      { text: "2% daily drawdown (Hard Breach)", warning: true },
      { text: "4% max drawdown (Hard Breach)", warning: true },
      { text: "3% max loss per single trade", warning: true },
      { text: "No Friday overnight holding (Hard Breach)", check: false },
      { text: "Max withdraw 3% per 24hrs", warning: true },
      { text: "No payout exceeding daily drawdown", warning: true },
    ]
  }
};

export default function RulesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Navigation />
      </div>
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-headline font-bold mb-2">Trading Rules</h1>
            <p className="text-muted-foreground">Comprehensive guide to maintain your funding eligibility.</p>
          </div>
          <Link href="/" className="lg:hidden flex items-center gap-2 bg-secondary/50 p-2 rounded-xl">
            <div className="bg-primary/20 p-1 rounded-lg">
              <AlertCircle className="text-primary w-5 h-5" />
            </div>
            <span className="font-bold text-sm">Public Area</span>
          </Link>
        </header>

        <div className="sticky top-0 z-20 mb-8 p-4 bg-destructive/15 border-l-4 border-destructive backdrop-blur-md rounded-r-lg shadow-lg flex items-center gap-3">
          <AlertCircle className="text-destructive w-5 h-5 shrink-0" />
          <p className="text-sm font-bold text-destructive">
            ⚠️ Hard breaches result in immediate account termination with no appeal.
          </p>
        </div>

        <Tabs defaultValue="1-step" className="space-y-12">
          <TabsList className="bg-secondary/50 border border-border p-1 h-14 w-full max-w-4xl justify-start overflow-x-auto">
            <TabsTrigger value="1-step" className="h-full px-8 font-bold">1-Step Pro</TabsTrigger>
            <TabsTrigger value="2-step" className="h-full px-8 font-bold">2-Step Classic</TabsTrigger>
            <TabsTrigger value="3-step" className="h-full px-8 font-bold">3-Step Classic</TabsTrigger>
            <TabsTrigger value="instant" className="h-full px-8 font-bold">Instant Funding</TabsTrigger>
          </TabsList>

          <TabsContent value="1-step" className="space-y-12">
            <div className="grid md:grid-cols-2 gap-8">
              <RuleCard title="Evaluation Phase" items={PLAN_RULES['1-step'].evaluation} variant="primary" />
              <RuleCard title="Funded Stage" items={PLAN_RULES['1-step'].funded} variant="destructive" />
            </div>
            <FundedRulesDetailed 
              daily="3%" 
              max="6%" 
              payout="Minimum 5 trading days required before payout request" 
              extra={["No closing trades within 2 minutes", "1 trade per 3 minutes maximum"]}
            />
          </TabsContent>

          <TabsContent value="2-step" className="space-y-12">
            <div className="grid md:grid-cols-3 gap-8">
              <RuleCard title="Phase 1: Evaluation" items={PLAN_RULES['2-step'].phase1} variant="primary" />
              <RuleCard title="Phase 2: Verification" items={PLAN_RULES['2-step'].phase2} variant="primary" />
              <RuleCard title="Funded Stage" items={PLAN_RULES['2-step'].funded} variant="destructive" />
            </div>
            <FundedRulesDetailed 
              daily="5%" 
              max="10%" 
              payout="Minimum 5 trading days required before payout request" 
              extra={["No closing trades within 2 minutes", "1 trade per 3 minutes maximum"]}
            />
          </TabsContent>

          <TabsContent value="3-step" className="space-y-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <RuleCard title="Phase 1" items={PLAN_RULES['3-step'].phase1} variant="primary" />
              <RuleCard title="Phase 2" items={PLAN_RULES['3-step'].phase2} variant="primary" />
              <RuleCard title="Phase 3" items={PLAN_RULES['3-step'].phase3} variant="primary" />
              <RuleCard title="Funded Stage" items={PLAN_RULES['3-step'].funded} variant="destructive" />
            </div>
            <FundedRulesDetailed 
              daily="4%" 
              max="8%" 
              payout="Minimum 5 trading days required before payout request" 
              extra={["Bi-Weekly & Monthly payouts available", "No closing trades within 2 minutes", "1 trade per 3 minutes maximum"]}
            />
          </TabsContent>

          <TabsContent value="instant" className="space-y-12">
            <div className="grid md:grid-cols-1 max-w-4xl gap-8">
              <RuleCard title="Live Account Rules" items={PLAN_RULES['instant'].funded} variant="destructive" />
            </div>
            <FundedRulesDetailed 
              daily="2%" 
              max="4%" 
              payout="First payout after 24 hours" 
              extra={["3% max loss per single trade", "Max withdraw 3% of account per 24hrs", "No overnight holding on Fridays"]}
              isInstant={true}
            />
          </TabsContent>
        </Tabs>

        <section className="mt-20 space-y-12">
          <div className="flex items-center gap-3">
            <Skull className="text-destructive w-8 h-8" />
            <h2 className="text-3xl font-headline font-bold">Breach Types Explained</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-destructive/10 pb-4">
                <div className="p-2 bg-destructive/20 rounded-lg">
                  <Skull className="text-destructive w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-destructive">HARD BREACH</CardTitle>
                  <p className="text-xs text-muted-foreground uppercase font-black">Account Terminated Immediately</p>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {[
                  "Max floating loss > 1% on open trades",
                  "Daily drawdown exceeded",
                  "Max drawdown exceeded",
                  "Martingale strategy in funded stage",
                  "Payout exceeds daily drawdown limit (if applicable)",
                  "Trade closed in under 2 minutes",
                  "More than 1 trade per 3 minutes",
                  "Single pair loss > 3% (if applicable)",
                  "Overnight holding on Friday (Instant only)"
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-sm font-medium">{rule}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="flex flex-row items-center gap-3 border-b border-amber-500/10 pb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="text-amber-500 w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-amber-500">SOFT BREACH</CardTitle>
                  <p className="text-xs text-muted-foreground uppercase font-black">Warning / Challenge Fail</p>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {[
                  "Martingale in challenge phase",
                  "Trade rules violation in challenge",
                  "Minimum trading days not met",
                  "Signal copying detected"
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-sm font-medium">{rule}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-32 pb-20 pt-20 border-t border-border">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="text-primary w-8 h-8" />
              <h2 className="text-3xl font-headline font-bold uppercase tracking-tight">Risk Disclosure Statement</h2>
            </div>
            <div className="space-y-6 text-muted-foreground text-sm leading-relaxed bg-secondary/20 p-10 rounded-[2rem] border border-border">
              <p>
                Trading foreign exchange and CFDs carries a high level of risk and may not be suitable for all investors. Past performance is not indicative of future results. The high degree of leverage can work against you as well as for you.
              </p>
              <p>
                PrimeFunded provides simulated funded accounts for educational purposes and skill evaluation. Performance rewards are discretionary and not guaranteed. Participation in our evaluation programs does not constitute an investment in any financial instrument.
              </p>
              <p>
                You should carefully consider your investment objectives, level of experience, and risk appetite before participating. Only risk capital should be used. There is a possibility that you could sustain a loss of some or all of your initial evaluation fees.
              </p>
              <p className="font-bold text-foreground">
                By using our services, you acknowledge that you have read and understood this risk disclosure and agree to our Terms of Service.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function RuleCard({ title, items, variant }: { title: string, items: any[], variant: 'primary' | 'destructive' }) {
  const isDestructive = variant === 'destructive';
  return (
    <Card className={`border-${variant}/20 bg-${variant}/5 h-full shadow-lg`}>
      <CardHeader className="border-b border-white/5 pb-4">
        <CardTitle className={`text-xl font-headline font-bold flex items-center gap-3 ${isDestructive ? 'text-destructive' : ''}`}>
          {isDestructive ? <Skull className="w-5 h-5" /> : <Target className="text-primary w-5 h-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={`mt-1 p-0.5 rounded-full ${item.check ? 'bg-accent/20 text-accent' : item.warning ? 'bg-amber-500/20 text-amber-500' : 'bg-destructive/20 text-destructive'}`}>
              {item.check ? <Check className="w-3.5 h-3.5" /> : item.warning ? <AlertTriangle className="w-3.5 h-3.5" /> : <Skull className="w-3.5 h-3.5" />}
            </div>
            <span className={`text-sm font-medium ${item.check ? 'text-foreground/90' : 'text-muted-foreground/90'}`}>
              {item.text}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FundedRulesDetailed({ daily, max, payout, extra, isInstant }: { daily: string, max: string, payout: string, extra: string[], isInstant?: boolean }) {
  return (
    <div className="space-y-8">
      <Card className="border-destructive/20 bg-destructive/5 border-l-4">
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-2xl font-headline font-bold text-destructive flex items-center gap-2">
                <Skull className="w-6 h-6" /> MAX FLOATING LOSS RULE
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                During the Funded Stage, a <span className="text-destructive font-bold underline">1% Maximum Floating Loss</span> rule is strictly enforced. 
                Your open trades must never exceed a 1% loss of your funded account balance at any moment.
              </p>
              <div className="p-4 bg-background/50 rounded-xl border border-destructive/10 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Info className="w-3 h-3" /> Important Notes:</p>
                <ul className="text-xs space-y-2 list-disc pl-4 text-muted-foreground">
                  <li>Multiple open positions are considered a single combined floating loss.</li>
                  <li>Reaching or exceeding 1% floating loss is a <span className="font-bold">HARD BREACH</span>.</li>
                  <li>Account will be immediately closed regardless of later recovery.</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-2xl font-headline font-bold text-amber-500 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" /> PAYOUT & EQUITY CUSHION RULES
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isInstant ? "All payout requests must remain within the daily drawdown limit. " : ""}An equity cushion must always be maintained.
              </p>
              <div className="grid gap-3">
                {isInstant && (
                  <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg text-xs font-bold text-destructive">
                    <Skull className="w-4 h-4" /> HARD BREACH: Payout exceeds daily drawdown limit
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg text-xs font-bold text-destructive">
                  <Skull className="w-4 h-4" /> HARD BREACH: First payout requested before minimum {isInstant ? "24 hours" : "5 trading days"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-border/50 bg-secondary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Full Rules Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
             <div className="space-y-3">
                <SummaryItem text="No profit target" checked />
                <SummaryItem text="80% profit split" checked />
                <SummaryItem text={payout} warning />
                <SummaryItem text="Scale up to $2M" checked />
             </div>
             <div className="space-y-3">
                <SummaryItem text={`${daily} daily limit`} hard />
                <SummaryItem text={`${max} max limit`} hard />
                <SummaryItem text="1% max floating loss" hard />
                <SummaryItem text="No martingale" hard />
             </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <Skull className="w-5 h-5" /> Prohibited (Hard Breach)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Loss Recovery (Martingale)</p>
            <p className="text-sm text-muted-foreground mb-4">
              Increasing lot size after a loss to recover is strictly prohibited. Includes doubling lots or re-entering with larger positions.
            </p>
            {extra.map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-medium">
                <X className="text-destructive w-4 h-4" /> {e}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryItem({ text, checked, warning, hard }: { text: string, checked?: boolean, warning?: boolean, hard?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold">
      {checked ? <Check className="text-accent w-3 h-3" /> : warning ? <AlertTriangle className="text-amber-500 w-3 h-3" /> : <Skull className="text-destructive w-3 h-3" />}
      <span className={hard ? 'text-destructive' : warning ? 'text-amber-500' : 'text-foreground'}>{text}</span>
    </div>
  );
}
