"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Check, X, ChevronDown, ChevronUp, TicketPercent } from 'lucide-react';
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
      { text: "10% profit target", check: true },
      { text: "3% daily drawdown limit", check: true },
      { text: "6% max drawdown", check: true },
      { text: "Minimum 3 trading days", check: true },
      { text: "Max 1 trade every 3 mins", check: true },
      { text: "Hold trades min 2 mins", check: true },
      { text: "No time limit", check: true },
      { text: "All forex pairs allowed", check: true },
      { text: "No martingale strategy", check: false },
      { text: "No signal copying", check: false },
    ],
    funded: [
      { text: "Up to 80% profit split", check: true },
      { text: "Daily payouts", check: true },
      { text: "Scale up to $2,000,000", check: true },
      { text: "3% daily drawdown", check: true },
      { text: "6% max drawdown", check: true },
    ]
  },
  '2-step': {
    phase1: [
      { text: "8% profit target", check: true },
      { text: "5% daily drawdown", check: true },
      { text: "10% max drawdown", check: true },
      { text: "Minimum 4 trading days", check: true },
      { text: "Max 3% single pair loss", check: true },
      { text: "Unlimited trading days", check: true },
      { text: "No martingale", check: false },
    ],
    phase2: [
      { text: "5% profit target", check: true },
      { text: "5% daily drawdown", check: true },
      { text: "10% max drawdown", check: true },
      { text: "Minimum 4 trading days", check: true },
      { text: "Unlimited trading days", check: true },
    ],
    funded: [
      { text: "Up to 80% profit split", check: true },
      { text: "Daily payouts", check: true },
      { text: "Min 5 days per payout", check: true },
      { text: "5% daily drawdown", check: true },
    ]
  },
  'instant': {
    funded: [
      { text: "No evaluation needed", check: true },
      { text: "No profit target", check: true },
      { text: "3% max loss per trade", check: true },
      { text: "4% daily drawdown", check: true },
      { text: "8% max drawdown", check: true },
      { text: "Trade immediately", check: true },
      { text: "Daily payouts after 48h", check: true },
      { text: "No martingale", check: false },
      { text: "No Friday overnight", check: false },
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-headline font-bold mb-2"
          >
            Select Your Challenge
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Pick the model that fits your trading style and start earning.
          </motion.p>
        </header>

        <div className="mb-12">
          <Tabs defaultValue="1-step" className="w-full" onValueChange={(val) => {
            setSelectedPlan(val);
            if (val !== 'instant') setDiscountApplied(false);
          }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <TabsList className="grid w-full max-w-md grid-cols-3 h-14 bg-secondary p-1 rounded-xl">
                <TabsTrigger value="1-step" className="data-[state=active]:bg-background font-bold rounded-lg transition-all">1-Step Pro</TabsTrigger>
                <TabsTrigger value="2-step" className="data-[state=active]:bg-background font-bold rounded-lg transition-all">2-Step Classic</TabsTrigger>
                <TabsTrigger value="instant" className="data-[state=active]:bg-background font-bold rounded-lg transition-all">Instant Funding</TabsTrigger>
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {planData[selectedPlan as keyof typeof planData].map((tier, idx) => (
                    <ChallengeCard 
                      key={tier.size} 
                      tier={tier} 
                      planName={selectedPlan} 
                      delay={idx * 0.05} 
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
  
  const getDisplayName = (id: string) => {
    if (id === '1-step') return '1-Step Pro';
    if (id === '2-step') return '2-Step Classic';
    return 'Instant Funding';
  };

  const finalPrice = discountApplied ? Math.floor(tier.price * 0.8) : tier.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={`relative overflow-hidden border-border/50 hover:border-primary/50 transition-all flex flex-col h-full bg-card/50 backdrop-blur-sm group ${tier.popular ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
        {tier.popular && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Most Popular</div>
          </div>
        )}
        
        {discountApplied && (
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-br-lg uppercase tracking-wider">20% OFF Applied!</div>
          </div>
        )}

        <CardHeader className="text-center pt-10">
          <CardTitle className="text-3xl font-headline font-bold text-white group-hover:text-primary transition-colors">{tier.size}</CardTitle>
          <p className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-black">{getDisplayName(planName)}</p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2">
              {discountApplied && (
                <span className="text-xl text-muted-foreground line-through decoration-destructive">${tier.price}</span>
              )}
              <span className={`text-4xl font-headline font-bold ${discountApplied ? 'text-accent' : 'text-white'}`}>
                ${finalPrice}
              </span>
            </div>
            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-1">one-time fee</p>
          </div>
          
          <div className="space-y-4 mb-4">
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary/80 hover:text-primary hover:bg-primary/5 h-10 px-4 border border-primary/20 rounded-lg">
                  View Full Rules
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                {planName === '1-step' && (
                  <>
                    <RuleList title="Evaluation Phase" items={RULES['1-step'].evaluation} />
                    <RuleList title="Funded Phase" items={RULES['1-step'].funded} />
                  </>
                )}
                {planName === '2-step' && (
                  <>
                    <RuleList title="Phase 1: Evaluation" items={RULES['2-step'].phase1} />
                    <RuleList title="Phase 2: Verification" items={RULES['2-step'].phase2} />
                    <RuleList title="Funded Phase" items={RULES['2-step'].funded} />
                  </>
                )}
                {planName === 'instant' && (
                  <RuleList title="Funded From Day 1" items={RULES['instant'].funded} />
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>

        <CardFooter className="pt-0 pb-8 px-6">
          <Button className="w-full h-12 font-bold rounded-xl cyan-box-glow hover:scale-[1.02] transition-all" asChild>
            <Link href={`/payment?plan=${planName}&size=${tier.size}&price=$${finalPrice}`}>
              Start Challenge
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function RuleList({ title, items }: { title: string, items: any[] }) {
  return (
    <div className="space-y-2.5">
      <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/80 pl-1">{title}</h4>
      <div className="grid gap-2">
        {items.map((item, i) => (
          <RuleItem key={i} text={item.text} check={item.check} />
        ))}
      </div>
    </div>
  );
}

function RuleItem({ text, check }: { text: string, check?: boolean }) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      {check ? (
        <Check className="text-accent w-3 h-3 mt-0.5 flex-shrink-0" />
      ) : (
        <X className="text-destructive w-3 h-3 mt-0.5 flex-shrink-0" />
      )}
      <span className={check ? 'text-foreground/80 font-medium' : 'text-muted-foreground/70'}>{text}</span>
    </div>
  );
}
