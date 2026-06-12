"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, ShieldCheck, Zap, Globe, Users, Award, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Simple Nav for non-dashboard pages */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary/20 p-1.5 rounded-lg">
              <TrendingUp className="text-primary w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tight text-white">PrimeFunded</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/challenges" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Challenges</Link>
            <Button size="sm" className="font-bold cyan-box-glow" asChild>
              <Link href="/signup">Join Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <header className="text-center mb-20">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-headline font-bold mb-6"
            >
              The Next Era of <br />
              <span className="text-primary cyan-glow">Proprietary Trading.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto"
            >
              PrimeFunded was built by institutional traders for elite retail talent. Our mission is to bridge the gap between skilled individuals and institutional capital.
            </motion.p>
          </header>

          <div className="grid md:grid-cols-2 gap-12 mb-32">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-headline font-bold">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                We believe that trading talent is distributed globally, but capital is not. PrimeFunded provides a transparent, fair, and high-performance environment where traders can scale their careers without risking their own savings.
              </p>
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="text-primary w-5 h-5 shrink-0 mt-1" />
                  <span>Transparent rules with zero hidden "soft breach" traps.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="text-primary w-5 h-5 shrink-0 mt-1" />
                  <span>Institutional-grade liquidity and sub-100ms execution.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="text-primary w-5 h-5 shrink-0 mt-1" />
                  <span>A community-first approach with 24/7 dedicated support.</span>
                </li>
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-secondary/30 rounded-[2rem] border border-white/5 p-10 flex flex-col justify-center text-center"
            >
              <div className="grid grid-cols-2 gap-8">
                <AboutStat icon={<Users />} value="12k+" label="Traders" />
                <AboutStat icon={<Globe />} value="140+" label="Countries" />
                <AboutStat icon={<Zap />} value="<0.1s" label="Latency" />
                <AboutStat icon={<Award />} value="90%" label="Profit Share" />
              </div>
            </motion.div>
          </div>

          <section className="text-center bg-primary/5 rounded-[3rem] p-16 border border-primary/20">
            <h2 className="text-4xl font-headline font-bold mb-6">Ready to scale your career?</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
              Join thousands of funded traders and start your evaluation today. Prove your skills and get access to up to $200,000 in capital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-14 px-10 font-bold cyan-box-glow" asChild>
                <Link href="/challenges">Start Challenge</Link>
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-10 font-bold" asChild>
                <Link href="/rules">Read Rulebook</Link>
              </Button>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-20 border-t border-white/5 bg-secondary/20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary w-7 h-7" />
            <span className="font-headline font-bold text-2xl tracking-tight text-white">PrimeFunded</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/challenges" className="hover:text-primary transition-colors">Challenges</Link>
            <Link href="/rules" className="hover:text-primary transition-colors">Rules</Link>
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 PrimeFunded Global. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function AboutStat({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <div className="space-y-2">
      <div className="text-primary w-8 h-8 mx-auto mb-2 opacity-50">{icon}</div>
      <p className="text-3xl font-headline font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}
