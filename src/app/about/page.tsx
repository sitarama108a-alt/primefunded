
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Zap, Globe, Award, CheckCircle2, BarChart3, Clock, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const logoUrl = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || '';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <Image 
              src={logoUrl} 
              alt="PrimeFunded Logo"
              width={40}
              height={40}
              className="rounded-full border border-primary/20"
              data-ai-hint="PF logo"
            />
            <span className="font-headline font-bold text-2xl tracking-tight text-white">PrimeFunded</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/challenges" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Challenges</Link>
            <Link href="/rules" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Rules</Link>
            <Button size="sm" className="font-bold cyan-box-glow" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <header className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold mb-6 uppercase tracking-widest"
            >
              About PrimeFunded
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-headline font-bold mb-6"
            >
              Empowering Traders with <br />
              <span className="text-primary cyan-glow">Institutional Capital.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
            >
              Founded in 2024, PrimeFunded is dedicated to bridging the gap between elite retail talent and the capital they need to succeed.
            </motion.p>
          </header>

          <section className="mb-32">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h2 className="text-4xl font-headline font-bold">Our Mission</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  We believe every skilled trader deserves access to institutional capital. PrimeFunded was built to bridge the gap between talented traders and the funding they need to succeed in the global markets.
                </p>
                <div className="pt-4 flex flex-col gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <CheckCircle2 className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold">Institutional Access</h4>
                      <p className="text-sm text-muted-foreground">Trade on the same infrastructure as professional desk traders.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Zap className="text-primary w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold">Elite Technology</h4>
                      <p className="text-sm text-muted-foreground">Low-latency execution and real-time risk monitoring tools.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-secondary/30 rounded-[3rem] border border-white/5 p-12 flex flex-col justify-center text-center relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="grid grid-cols-2 gap-8 relative z-10">
                  <AboutStat value="$200,000" label="Max Funding" />
                  <AboutStat value="80%" label="Profit Split" />
                  <AboutStat value="5,000+" label="Active Traders" />
                  <AboutStat value="24hr" label="Payout (Instant)" />
                </div>
              </motion.div>
            </div>
          </section>

          <section className="mb-32">
            <h2 className="text-4xl font-headline font-bold text-center mb-16">Why Choose Us</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ChoiceCard 
                icon={<BarChart3 />} 
                title="No Consistency Rules" 
                description="Trade freely without any consistency requirements. Your style, your rules, any lot size." 
              />
              <ChoiceCard 
                icon={<Globe />} 
                title="News Trading Allowed" 
                description="Trade during high-impact news events. No restrictions on when you trade or how you profit." 
              />
              <ChoiceCard 
                icon={<Zap />} 
                title="Daily Payouts (Instant)" 
                description="Instant Funding accounts get daily payouts. Your profits, paid fast and reliably every 24 hours." 
              />
              <ChoiceCard 
                icon={<Award />} 
                title="80% Profit Split" 
                description="Keep 80% of everything you earn. All traders, all plans." 
              />
              <ChoiceCard 
                icon={<TrendingUp />} 
                title="Scale to $2,000,000" 
                description="Start small, grow big. Scale your account up to $2 million through consistent performance." 
              />
              <ChoiceCard 
                icon={<Clock />} 
                title="Fast Verification" 
                description="Payment verified within 30 minutes. MT5 credentials sent instantly upon approval." 
              />
            </div>
          </section>

          <section className="mb-32 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-4xl font-headline font-bold">Our Team</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                PrimeFunded is built by a team of professional traders and technology experts dedicated to creating the most trader-friendly proprietary firm in the industry.
              </p>
            </div>
          </section>

          <section className="bg-primary/5 rounded-[4rem] p-16 border border-primary/20 text-center relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 blur-[120px] -mr-48 -mb-48 rounded-full" />
            <h2 className="text-4xl font-headline font-bold mb-6">Contact Us</h2>
            <p className="text-xl text-muted-foreground mb-8">Have questions? We respond within 2 hours.</p>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
                <span className="text-primary">Supportprimefunded@gmail.com</span>
              </div>
              <Button size="lg" className="h-14 px-12 font-bold text-lg cyan-box-glow" asChild>
                <a href="mailto:Supportprimefunded@gmail.com">Send Email</a>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-20 border-t border-white/5 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <Image src={logoUrl} alt="Logo" width={30} height={30} className="rounded-full" />
              <span className="font-headline font-bold text-2xl tracking-tight text-white">PrimeFunded</span>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 PrimeFunded Global. All rights reserved.</p>
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

function AboutStat({ value, label }: { value: string, label: string }) {
  return (
    <div className="space-y-2">
      <p className="text-4xl font-headline font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase font-black tracking-widest text-primary">{label}</p>
    </div>
  );
}

function ChoiceCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-secondary/30 border border-white/5 hover:border-primary/30 transition-all duration-300 group">
      <div className="mb-6 p-4 bg-primary/10 rounded-2xl w-fit text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
