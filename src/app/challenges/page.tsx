"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, TrendingUp, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const planData = {
  '1-step': [
    { size: '$5k', price: '$49' },
    { size: '$10k', price: '$99' },
    { size: '$25k', price: '$199' },
    { size: '$50k', price: '$299' },
    { size: '$100k', price: '$499', popular: true },
    { size: '$200k', price: '$949' },
  ],
  '2-step': [
    { size: '$5k', price: '$39' },
    { size: '$10k', price: '$79' },
    { size: '$25k', price: '$159' },
    { size: '$50k', price: '$249' },
    { size: '$100k', price: '$399', popular: true },
    { size: '$200k', price: '$749' },
  ],
  'instant': [
    { size: '$5k', price: '$250' },
    { size: '$10k', price: '$500' },
    { size: '$25k', price: '$1250' },
    { size: '$50k', price: '$2500', popular: true },
  ]
};

export default function ChallengesPage() {
  const [selectedPlan, setSelectedPlan] = useState('1-step');

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
          <Tabs defaultValue="1-step" className="w-full" onValueChange={setSelectedPlan}>
            <TabsList className="grid w-full max-w-md grid-cols-3 h-14 bg-secondary p-1 rounded-xl">
              <TabsTrigger value="1-step" className="data-[state=active]:bg-background font-bold rounded-lg transition-all">1-Step Pro</TabsTrigger>
              <TabsTrigger value="2-step" className="data-[state=active]:bg-background font-bold rounded-lg transition-all">2-Step Classic</TabsTrigger>
              <TabsTrigger value="instant" className="data-[state=active]:bg-background font-bold rounded-lg transition-all">Instant Funding</TabsTrigger>
            </TabsList>

            <div className="mt-10">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={selectedPlan}
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

function ChallengeCard({ tier, planName, delay }: { tier: any, planName: string, delay: number }) {
  const getDisplayName = (id: string) => {
    if (id === '1-step') return '1-Step Pro';
    if (id === '2-step') return '2-Step Classic';
    return 'Instant Funding';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={`relative overflow-hidden border-border/50 hover:border-primary/50 transition-all flex flex-col h-full bg-card/50 backdrop-blur-sm group ${tier.popular ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
        {tier.popular && (
          <div className="absolute top-0 right-0">
            <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">Most Popular</div>
          </div>
        )}
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-3xl font-headline font-bold text-white group-hover:text-primary transition-colors">{tier.size}</CardTitle>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-bold">{getDisplayName(planName)}</p>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="text-center mb-8">
            <span className="text-4xl font-headline font-bold text-white">{tier.price}</span>
            <span className="text-muted-foreground text-sm font-medium"> / one-time</span>
          </div>
          
          <div className="space-y-4 mb-8">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Trading Rules</h4>
            <div className="grid gap-2.5">
              <RuleItem text="8% profit target" check />
              <RuleItem text="5% daily drawdown limit" check />
              <RuleItem text="10% maximum drawdown" check />
              <RuleItem text="No time limit" check />
              <RuleItem text="Up to 80% profit split" check />
              <RuleItem text="Daily payouts" check />
              <RuleItem text="No consistency rules" check />
              <RuleItem text="All forex pairs allowed" check />
              <RuleItem text="No trading during news" />
              <RuleItem text="No overnight holding on Fridays" />
              <RuleItem text="No martingale strategy" />
              <RuleItem text="No copying from signals" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-8 px-6">
          <Button className="w-full h-12 font-bold rounded-xl cyan-box-glow hover:scale-[1.02] transition-all" asChild>
            <Link href={`/payment?plan=${planName}&size=${tier.size}&price=${tier.price}`}>
              Start Challenge
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

function RuleItem({ text, check }: { text: string, check?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 text-xs">
      {check ? (
        <Check className="text-accent w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      ) : (
        <X className="text-destructive w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
      )}
      <span className={check ? 'text-foreground/80' : 'text-muted-foreground/60'}>{text}</span>
    </div>
  );
}