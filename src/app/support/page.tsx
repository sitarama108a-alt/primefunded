"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Mail, MessageSquare, Clock, ShieldCheck, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: "How long does verification take?",
    a: "Payment verification typically takes 5-30 minutes during business hours. MT5 credentials are sent to your registered email address within 1 hour of verification."
  },
  {
    q: "What is the profit split?",
    a: "Our profit split varies by performance tier: Bronze tier traders receive 70%, Silver tier get 75%, and our Gold tier elite traders receive an industry-leading 80% profit split."
  },
  {
    q: "Can I trade news events?",
    a: "Trading during high-impact news events is restricted to ensure risk management consistency. Please check the rules page for specific blackout windows."
  },
  {
    q: "What happens if I breach drawdown?",
    a: "If a drawdown limit is breached, the account is automatically closed to protect capital. You are welcome to purchase a new challenge and try again at any time."
  },
  {
    q: "How do I request a payout?",
    a: "Once you have reached your first payout cycle, navigate to the Payouts page, click 'Request Payout', and enter your desired amount and crypto wallet address."
  },
  {
    q: "Which crypto do you accept?",
    a: "We currently accept USDT/USDC on Ethereum (ERC20), USDT on Tron (TRC20), USDT on BNB Smart Chain (BEP20), and USDT on Polygon."
  },
  {
    q: "Is there a time limit to pass the challenge?",
    a: "No! PrimeFunded offers indefinite trading time on all 1-Step Pro and 2-Step Classic challenges, allowing you to trade at your own pace."
  },
  {
    q: "Can I use an EA or trading bot?",
    a: "Yes, expert advisors and trading bots are fully supported on our platform, provided they do not use martingale, grid, or high-frequency arbitrage strategies."
  },
  {
    q: "What MT5 broker do you use?",
    a: "We provide high-performance MT5 demo accounts hosted on our proprietary 'PrimeFunded-Demo' server, optimized for low-latency institutional execution."
  },
  {
    q: "How do I scale my account?",
    a: "Consistent profitability is rewarded. After meeting our scaling criteria over a 3-month period, your account size will be automatically increased."
  }
];

export default function SupportPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <section className="mb-16 text-center max-w-3xl mx-auto pt-8">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase">Support Center</Badge>
          <h1 className="text-5xl font-headline font-bold mb-6">We're here to help 24/7.</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Get priority assistance from our elite support team of experienced traders and technical specialists.
          </p>
        </section>

        <div className="grid lg:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
          <Card className="border-primary/20 bg-primary/5 text-center p-8 group hover:border-primary/50 transition-all">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <Mail className="text-primary w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Direct Support</h3>
            <p className="text-sm text-muted-foreground mb-6">Email our desk directly for complex inquiries.</p>
            <Button className="w-full h-12 font-bold cyan-box-glow" asChild>
              <a href="mailto:Supportprimefunded@gmail.com">
                Email Support <Mail className="ml-2 w-4 h-4" />
              </a>
            </Button>
            <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Clock className="w-3 h-3" /> Average response: 2 hours
            </p>
          </Card>

          <Card className="bg-secondary/30 text-center p-8 group hover:border-accent/50 transition-all">
            <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare className="text-accent w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Community Desk</h3>
            <p className="text-sm text-muted-foreground mb-6">Join our Discord for trader-to-trader help.</p>
            <Button variant="outline" className="w-full h-12 font-bold hover:bg-accent hover:text-accent-foreground">
              Join Discord
            </Button>
          </Card>

          <Card className="bg-secondary/30 text-center p-8 group hover:border-primary/50 transition-all">
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="text-primary w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Compliance</h3>
            <p className="text-sm text-muted-foreground mb-6">Review KYC or trading rule queries.</p>
            <Button variant="outline" className="w-full h-12 font-bold" asChild>
              <a href="/rules">View Rulebook</a>
            </Button>
          </Card>
        </div>

        <section className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-secondary rounded-lg">
              <HelpCircle className="text-primary w-6 h-6" />
            </div>
            <h2 className="text-3xl font-headline font-bold">Frequently Asked Questions</h2>
          </div>

          <Card className="border-border/50 overflow-hidden bg-card/30 backdrop-blur-md">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="px-6 border-b border-border/50 last:border-none">
                  <AccordionTrigger className="hover:no-underline hover:text-primary py-6 text-left font-bold">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-muted-foreground leading-relaxed text-base">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>
      </main>
    </div>
  );
}
