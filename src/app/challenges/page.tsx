"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, Info, Shield, Zap, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const challengeTiers = [
  { size: '$10k', price: '$99' },
  { size: '$25k', price: '$225' },
  { size: '$50k', price: '$399' },
  { size: '$100k', price: '$549', popular: true },
  { size: '$200k', price: '$999' },
];

export default function ChallengesPage() {
  const [selectedPlan, setSelectedPlan] = useState('1-step');

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      
      <main className="flex-1 p-8">
        <header className="mb-12">
          <h1 className="text-4xl font-headline font-bold mb-2">Select Your Challenge</h1>
          <p className="text-muted-foreground">Pick the model that fits your trading style and start earning.</p>
        </header>

        <div className="mb-12">
          <Tabs defaultValue="1-step" className="w-full" onValueChange={setSelectedPlan}>
            <TabsList className="grid w-full max-w-md grid-cols-3 h-14 bg-secondary p-1">
              <TabsTrigger value="1-step" className="data-[state=active]:bg-background font-bold">1-Step Pro</TabsTrigger>
              <TabsTrigger value="2-step" className="data-[state=active]:bg-background font-bold">2-Step Classic</TabsTrigger>
              <TabsTrigger value="instant" className="data-[state=active]:bg-background font-bold">Instant Funding</TabsTrigger>
            </TabsList>

            <div className="mt-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {challengeTiers.map((tier) => (
                  <Card key={tier.size} className={`relative overflow-hidden border-border/50 hover:border-primary transition-all flex flex-col ${tier.popular ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                    {tier.popular && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase">Best Value</div>
                      </div>
                    )}
                    <CardHeader className="text-center pt-8">
                      <CardTitle className="text-2xl font-headline font-bold">{tier.size}</CardTitle>
                      <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">Trading Capital</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col items-center">
                      <div className="mb-8">
                        <span className="text-4xl font-headline font-bold">{tier.price}</span>
                        <span className="text-muted-foreground text-sm"> / one-time</span>
                      </div>
                      
                      <div className="w-full space-y-3 mb-8">
                        <FeatureItem text={selectedPlan === 'instant' ? 'No Evaluation' : (selectedPlan === '1-step' ? '1-Step Evaluation' : '2-Step Evaluation')} />
                        <FeatureItem text="80% Profit Split" />
                        <FeatureItem text="No Time Limit" />
                        <FeatureItem text="Bi-Weekly Payouts" />
                        <FeatureItem text="Rule Monitoring" />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-8 px-6">
                      <Button className="w-full h-12 font-bold" asChild>
                        <Link href={`/payment?plan=${selectedPlan}&size=${tier.size}&price=${tier.price}`}>Select Challenge</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>

            <div className="mt-16 grid md:grid-cols-3 gap-8 p-10 rounded-3xl bg-secondary/30 border border-border">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  <TrendingUp className="text-primary" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-3">Profit Target</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedPlan === '1-step' ? 'Achieve a 10% profit target with no maximum time limit to advance to funded status.' : 
                   selectedPlan === '2-step' ? 'Phase 1: 8% target. Phase 2: 5% target. Professional 2-step process.' : 
                   'No profit target required for scaling. Start earning from your very first trade.'}
                </p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center mb-6">
                  <Shield className="text-destructive" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-3">Drawdown Rules</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedPlan === '1-step' ? '3% Daily Loss limit and 6% Maximum Total Loss limit. Fair and competitive.' : 
                   selectedPlan === '2-step' ? '5% Daily Loss limit and 10% Maximum Total Loss limit for both phases.' : 
                   '4% Daily Loss limit and 8% Maximum Total Loss limit. Highest leverage in the industry.'}
                </p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                  <Zap className="text-accent" />
                </div>
                <h3 className="text-xl font-headline font-bold mb-3">Instant Credentialing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Once your payment is verified, credentials are generated and emailed instantly via our automated system.
                </p>
              </div>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Check className="text-accent w-4 h-4 flex-shrink-0" />
      <span className="text-foreground/80">{text}</span>
    </div>
  );
}