
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Mail, MessageSquare, Clock, ShieldCheck, HelpCircle, TrendingUp } from 'lucide-react';
import { useBrandSettings } from '@/hooks/use-brand-settings';

const FAQS = [
  {
    q: "How long does payment verification take?",
    a: "Payment verification takes 5-30 minutes during business hours. MT5 credentials are sent within 1 hour after verification is successfully confirmed."
  },
  {
    q: "Is news trading allowed?",
    a: "YES! News trading is fully allowed on all accounts. Trade during any market conditions—including NFP, FOMC, and CPI—with absolutely no restrictions."
  },
  {
    q: "Are there consistency rules?",
    a: "NO! We have absolutely no consistency rules. Trade your way, use any lot size, and trade on any day that suits your strategy."
  },
  {
    q: "What is the profit split?",
    a: "All our traders receive 80% profit split from day one. No tiers required."
  },
  {
    q: "How do I request a payout?",
    a: "Navigate to the Payouts page in your dashboard, click 'Request Payout', and enter your desired amount and crypto wallet address."
  }
];

export default function SupportPage() {
  const { logoUrl, siteName } = useBrandSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Public Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <Image 
              src={logoUrl} 
              alt={siteName}
              width={40}
              height={40}
              className="rounded-full border border-primary/20"
              data-ai-hint="site logo"
            />
            <span className="font-headline font-bold text-2xl tracking-tight text-white">{siteName}</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/challenges" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Challenges</Link>
            <Link href="/rules" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Rules</Link>
            <Button size="sm" variant="ghost" className="font-bold" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <section className="text-center mb-16">
            <Badge variant="outline" className="mb-6 border-primary/30 text-primary px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase">Support Center</Badge>
            <h1 className="text-5xl font-headline font-bold mb-6">We're Here to Help 24/7</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Get priority assistance from our team of professional traders and technical specialists.
            </p>
          </section>

          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <Card className="border-primary/20 bg-primary/5 p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                <Mail className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Direct Email</h3>
              <p className="text-muted-foreground mb-6">Email our desk for complex inquiries or compliance help.</p>
              <div className="text-lg font-bold text-white mb-8">Supportprimefunded@gmail.com</div>
              <Button className="w-full h-14 font-bold cyan-box-glow" asChild>
                <a href="mailto:Supportprimefunded@gmail.com">Send Email</a>
              </Button>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Clock className="w-3 h-3" /> Average response: Within 2 hours
              </div>
            </Card>

            <Card className="bg-secondary/30 border-border p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="text-accent w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Community Desk</h3>
              <p className="text-muted-foreground mb-6">Join our Discord for trader-to-trader help and announcements.</p>
              <Button variant="outline" className="w-full h-14 font-bold border-border hover:bg-accent/10">
                Join Discord
              </Button>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="w-3 h-3" /> Active community support
              </div>
            </Card>
          </div>

          <section className="mb-20">
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
                    <AccordionTrigger className="hover:no-underline hover:text-primary py-6 text-left font-bold text-lg">
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

          <div className="text-center bg-secondary/20 rounded-[3rem] p-12 border border-border">
            <h3 className="text-2xl font-bold mb-4">Still need help?</h3>
            <p className="text-muted-foreground mb-8">Our support team is available around the clock to ensure your trading journey is smooth.</p>
            <Button variant="link" asChild className="text-primary font-bold">
              <Link href="/rules">Read our full rulebook <TrendingUp className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-white/5 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <Image src={logoUrl} alt={siteName} width={30} height={30} className="rounded-full" data-ai-hint="site logo" />
              <span className="font-headline font-bold text-2xl tracking-tight text-white">{siteName}</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 {siteName} Global. All rights reserved.</p>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link href="/rules" className="hover:text-primary transition-colors">Risk Disclosure</Link>
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Client Area</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
