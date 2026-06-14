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
  const branding = useBrandSettings();

  return (
    <div className="min-h-screen bg-background">
      {/* Public Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <Image 
              src={branding.logoUrl} 
              alt={branding.siteName}
              width={40}
              height={40}
              className="rounded-full border border-primary/20"
              data-ai-hint="site logo"
            />
            <span className="font-headline font-bold text-2xl tracking-tight text-white">{branding.siteName}</span>
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
              <div className="w-16 h-16 bg-[#5865F2]/20 rounded-2xl flex items-center justify-center mb-6">
                <DiscordIcon className="text-[#5865F2] w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Community Desk</h3>
              <p className="text-muted-foreground mb-6">Join our Discord for trader-to-trader help and announcements.</p>
              <Button className="w-full h-14 font-bold bg-[#5865F2] hover:bg-[#5865F2]/90 transition-colors" asChild>
                <a href={branding.discordUrl} target="_blank" rel="noopener noreferrer">
                  Join Discord Community
                </a>
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
              <Image src={branding.logoUrl} alt={branding.siteName} width={30} height={30} className="rounded-full" data-ai-hint="site logo" />
              <span className="font-headline font-bold text-2xl tracking-tight text-white">{branding.siteName}</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 {branding.siteName} Global. All rights reserved.</p>
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

function DiscordIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993.023.03.07.039.084.028a19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.419-2.157 2.419z" />
    </svg>
  );
}
