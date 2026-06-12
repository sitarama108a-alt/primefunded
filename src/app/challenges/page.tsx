"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Check, X, ChevronDown, ChevronUp, TicketPercent, Skull, AlertTriangle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const planData = {
  '1-step': [
    { size: '$5,000', price: 59 },
    { size: '$10,000', price: 89 },
    { size: '$25,000', price: 179 },
    { size: '$50,000', price: 289 },
    { size: '$100,000', price: 499, popular: true },
    { size: '$200,000', price: 999 },
  ],
  '2-step': [
    { size: '$5,000', price: 49 },
    { size: '$10,000', price: 69 },
    { size: '$25,000', price: 149 },
    { size: '$50,000', price: 249 },
    { size: '$100,000', price: 429, popular: true },
    { size: '$200,000', price: 849 },
  ],
  '3-step': [
    { size: '$5,000', price: 39 },
    { size: '$10,000', price: 59 },
    { size: '$25,000', price: 129 },
    { size: '$50,000', price: 219 },
    { size: '$100,000', price: 399, popular: true },
    { size: '$200,000', price: 799 },
    { size: '$300,000', price: 1099 },
  ],
  'instant': [
    { size: '$5,000', price: 125 },
    { size: '$10,000', price: 250 },
    { size: '$25,000', price: 625 },
    { size: '$50,000', price: 1250 },
    { size: '$100,000', price: 2500, popular: true },
    { size: '$200,000', price: 5000 },
  ]
};

const RULES = {
  '1-step': {
    evaluation: [
      { text: "10% profit target", type: 'check' },
      { text: "3% daily drawdown", type: 'check' },
      { text: "6% max drawdown", type: 'check' },
      { text: "Trading Leverage 1:100", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
      { text: "Minimum 5 trading days", type: 'check' },
      { text: "Max 1 trade / 3 mins", type: 'check' },
    ],
    funded: [
      { text: "80% profit split", type: 'check' },
      { text: "Trading Leverage 1:30", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
      { text: "Minimum 5 trading days required before payout request", type: 'warning' },
      { text: "1% max floating loss (Hard Breach)", type: 'warning' },
      { text: "3% daily drawdown limit (Hard Breach)", type: 'hard' },
      { text: "6% max drawdown limit (Hard Breach)", type: 'hard' },
      { text: "No martingale (Hard Breach)", type: 'hard' },
    ]
  },
  '2-step': {
    phase1: [
      { text: "8% profit target", type: 'check' },
      { text: "5% daily drawdown", type: 'check' },
      { text: "10% max drawdown", type: 'check' },
      { text: "Trading Leverage 1:100", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
      { text: "Minimum 5 trading days", type: 'check' },
    ],
    phase2: [
      { text: "5% profit target", type: 'check' },
      { text: "5% daily drawdown", type: 'check' },
      { text: "10% max drawdown", type: 'check' },
      { text: "Trading Leverage 1:100", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
      { text: "Minimum 5 trading days", type: 'check' },
    ],
    funded: [
      { text: "80% profit split", type: 'check' },
      { text: "Trading Leverage 1:30", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
      { text: "Minimum 5 trading days required before payout request", type: 'warning' },
      { text: "1% max floating loss (Hard Breach)", type: 'warning' },
      { text: "5% daily drawdown limit (Hard Breach)", type: 'hard' },
      { text: "10% max drawdown limit (Hard Breach)", type: 'hard' },
      { text: "No martingale (Hard Breach)", type: 'hard' },
    ]
  },
  '3-step': {
    phase1: [
      { text: "10% profit target", type: 'check' },
      { text: "4% daily drawdown", type: 'check' },
      { text: "8% max drawdown", type: 'check' },
      { text: "Minimum 7 trading days", type: 'check' },
      { text: "Trading Leverage: 1:100", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
    ],
    phase2: [
      { text: "8% profit target", type: 'check' },
      { text: "4% daily drawdown", type: 'check' },
      { text: "8% max drawdown", type: 'check' },
      { text: "Minimum 6 trading days", type: 'check' },
      { text: "Trading Leverage: 1:100", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
    ],
    phase3: [
      { text: "5% profit target", type: 'check' },
      { text: "4% daily drawdown", type: 'check' },
      { text: "8% max drawdown", type: 'check' },
      { text: "Trading Leverage: 1:100", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
    ],
    funded: [
      { text: "80% profit split (Bi-Weekly)", type: 'check' },
      { text: "100% profit split (Monthly)", type: 'check' },
      { text: "Trading Leverage: 1:30", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
      { text: "Minimum 5 trading days required before payout request", type: 'warning' },
      { text: "4% daily drawdown limit (Hard Breach)", type: 'hard' },
      { text: "8% max drawdown limit (Hard Breach)", type: 'hard' },
      { text: "No martingale (Hard Breach)", type: 'hard' },
    ]
  },
  'instant': {
    funded: [
      { text: "80% profit split", type: 'check' },
      { text: "Trading Leverage 1:30", type: 'check' },
      { text: "Fx, Commodities, Indices, Stock, Crypto", type: 'check' },
      { text: "Daily payouts available", type: 'check' },
      { text: "First payout after 24 hours", type: 'check' },
      { text: "Max withdraw 3% per 24 hours", type: 'warning' },
      { text: "2% daily drawdown (Hard Breach)", type: 'hard' },
      { text: "4% max drawdown (Hard Breach)", type: 'hard' },
      { text: "No martingale (Hard Breach)", type: 'hard' },
      { text: "No payout exceeding daily drawdown", type: 'warning' },
    ]
  }
};

export default function ChallengesPage() {
  const [selectedPlan, setSelectedPlan] = useState('1-step');
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'primefunded20') {
      setDiscountApplied(true);
    } else {
      setDiscountApplied(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      
      <main className="flex-1 p-8">
        <header className="mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-headline font-bold mb-2"
          >
            Select Your Challenge
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-muted-foreground"
          >
            Institutional funding starting from $5,000 up to $300,000.
          </motion.p>
        </header>

        {/* Sticky Warning Banner */}
        <div className="mb-8 p-4 bg-destructive/15 border-l-4 border-destructive rounded-r-lg flex items-center gap-3">
          <AlertCircle className="text-destructive w-5 h-5 shrink-0" />
          <p className="text-xs font-bold text-destructive">
            ⚠️ Hard breaches result in immediate account termination with no appeal.
          </p>
        </div>

        <div className="mb-12">
          <Tabs defaultValue="1-step" className="w-full" onValueChange={(val) => {
            setSelectedPlan(val);
            if (val !== 'instant') setDiscountApplied(false);
          }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <TabsList className="grid w-full max-w-2xl grid-cols-4 h-14 bg-secondary p-1 rounded-xl">
                <TabsTrigger value="1-step" className="data-[state=active]:bg-background font-bold rounded-lg">1-Step Pro</TabsTrigger>
                <TabsTrigger value="2-step" className="data-[state=active]:bg-background font-bold rounded-lg">2-Step Classic</TabsTrigger>
                <TabsTrigger value="3-step" className="data-[state=active]:bg-background font-bold rounded-lg">3-Step Classic</TabsTrigger>
                <TabsTrigger value="instant" className="data-[state=active]:bg-background font-bold rounded-lg">Instant Funding</TabsTrigger>
              </TabsList>

              {selectedPlan === 'instant' && (
                <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-xl border border-border">
                  <TicketPercent className="w-5 h-5 text-primary ml-2" />
                  <Input 
                    placeholder="Enter Coupon Code" 
                    className="h-10 bg-transparent border-none focus-visible:ring-0 w-44" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button size="sm" className="font-bold" onClick={handleApplyCoupon}>Apply</Button>
                </div>
              )}
            </div>

            <div className="mt-6">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedPlan + (discountApplied ? '-discount' : '')}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {planData[selectedPlan as keyof typeof planData]?.map((tier, idx) => (
                    <ChallengeCard 
                      key={tier.size} 
                      tier={tier} 
                      planName={selectedPlan} 
                      delay={idx * 0.03} 
                      discountApplied={discountApplied && selectedPlan === 'instant'}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function ChallengeCard({ tier, planName, delay, discountApplied }: { tier: any, planName: string, delay: number, discountApplied: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const finalPrice = discountApplied ? Math.floor(tier.price * 0.8) : tier.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={`relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 flex flex-col h-full bg-card/50 backdrop-blur-sm group ${tier.popular ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
        {tier.popular && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Most Popular</div>
          </div>
        )}

        <CardHeader className="text-center pt-10">
          <CardTitle className="text-3xl font-headline font-bold text-white group-hover:text-primary">{tier.size}</CardTitle>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black">
            {planName === '1-step' ? '1-Step Pro' : planName === '2-step' ? '2-Step Classic' : planName === '3-step' ? '3-Step Classic' : 'Instant Funding'}
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2">
              {discountApplied && <span className="text-xl text-muted-foreground line-through">${tier.price}</span>}
              <span className={`text-4xl font-headline font-bold ${discountApplied ? 'text-accent' : 'text-white'}`}>
                ${finalPrice}
              </span>
            </div>
          </div>
          
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary h-10 px-4 border border-primary/20 rounded-lg">
                View Stage Rules
                {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-4">
              {planName === '1-step' && (
                <>
                  <RuleSection title="Evaluation" items={RULES['1-step'].evaluation} />
                  <RuleSection title="Funded stage" items={RULES['1-step'].funded} />
                </>
              )}
              {planName === '2-step' && (
                <>
                  <RuleSection title="Phase 1 & 2" items={RULES['2-step'].phase1} />
                  <RuleSection title="Funded stage" items={RULES['2-step'].funded} />
                </>
              )}
              {planName === '3-step' && (
                <>
                  <RuleSection title="Phase 1 (Evaluation)" items={RULES['3-step'].phase1} />
                  <RuleSection title="Phase 2 (Evaluation)" items={RULES['3-step'].phase2} />
                  <RuleSection title="Phase 3 (Evaluation)" items={RULES['3-step'].phase3} />
                  <RuleSection title="Funded stage" items={RULES['3-step'].funded} />
                </>
              )}
              {planName === 'instant' && (
                <RuleSection title="Funded stage" items={RULES['instant'].funded} />
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>

        <CardFooter className="pt-4 pb-8 px-6">
          <Button className="w-full h-12 font-bold rounded-xl cyan-box-glow" asChild>
            <Link href={`/payment?plan=${planName}&size=${tier.size}&price=$${finalPrice}`}>
              Start Challenge
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function RuleSection({ title, items }: { title: string, items: any[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{title}</h4>
      <div className="grid gap-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] font-medium">
            {item.type === 'check' ? (
              <Check className="text-accent w-3 h-3 flex-shrink-0" />
            ) : item.type === 'warning' ? (
              <AlertTriangle className="text-amber-500 w-3 h-3 flex-shrink-0" />
            ) : (
              <Skull className="text-destructive w-3 h-3 flex-shrink-0" />
            )}
            <span className={item.type === 'hard' ? 'text-destructive' : 'text-foreground/80'}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
