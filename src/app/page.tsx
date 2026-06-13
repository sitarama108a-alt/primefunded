"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, ShieldCheck, Zap, Globe, ArrowRight, BarChart3, CheckCircle2, Trophy, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.3 }
};

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <div className="bg-primary/20 p-1.5 rounded-lg border border-primary/20">
              <TrendingUp className="text-primary w-6 h-6" />
            </div>
            <span className="font-headline font-bold text-2xl tracking-tight text-white">PrimeFunded</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href={user ? "/challenges" : "/login?redirect=/challenges"} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Challenges</Link>
            <Link href="/rules" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Rules</Link>
            <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">About Us</Link>
            {user ? (
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Dashboard</Link>
            ) : (
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Login</Link>
            )}
            <Button className="font-bold cyan-box-glow" asChild>
              <Link href={user ? "/challenges" : "/signup"}>Get Funded</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 overflow-hidden bg-grid-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-primary/10 blur-[140px] rounded-full -z-10" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 uppercase tracking-wider shadow-[0_0_15px_rgba(17,179,245,0.2)]"
          >
            <span className="w-2 h-2 rounded-full bg-primary live-indicator" />
            Now Funding Up To $200,000
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-6xl md:text-8xl font-headline font-bold mb-8 leading-[1.1] tracking-tight"
          >
            Trade Like a Pro! <br />
            <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent cyan-glow">With Up to $200,000 Funding</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            No consistency rules. News trading allowed. Daily payouts on Instant accounts. Keep 80% of your profits.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            <HighlightBadge text="No Consistency Rules" />
            <HighlightBadge text="News Trading Allowed" />
            <HighlightBadge text="Daily Payouts (Instant)" />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Button size="lg" className="h-16 px-10 text-lg rounded-2xl font-bold transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(17,179,245,0.4)] bg-primary text-primary-foreground group" asChild>
              <Link href={user ? "/challenges" : "/signup"}>
                Start Challenge 
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-16 px-10 text-lg rounded-2xl font-bold border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10" asChild>
              <Link href="/rules">View Trading Rules</Link>
            </Button>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
          >
            <HighlightCard 
              icon={<Trophy className="w-8 h-8" />}
              title="Up To 10X Payouts"
              subtitle="Scale your funded account up to 10X your initial size as you hit profit targets"
            />
            <HighlightCard 
              icon={<Zap className="w-8 h-8" />}
              title="Instant Account Access"
              subtitle="Get funded instantly and start trading within minutes of purchase"
            />
            <HighlightCard 
              icon={<Wallet className="w-8 h-8" />}
              title="Up To 100% Profit Split"
              subtitle="Keep up to 100% of your profits with our monthly reward program"
            />
            <HighlightCard 
              icon={<ShieldCheck className="w-8 h-8" />}
              title="Secure & Transparent"
              subtitle="Fully verified payouts, real MT5 accounts and 24/7 trader support"
            />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 relative bg-background">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-secondary/20 to-transparent -z-10" />
        
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            {...fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6">Built for Performance.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
              Our infrastructure is engineered by institutional traders to give you the competitive edge you need.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<CheckCircle2 className="text-primary w-8 h-8" />}
              title="No Consistency Rules"
              description="Trade any lot size, any day. Complete trading freedom for every individual style."
              delay={0.05}
            />
            <FeatureCard 
              icon={<Globe className="text-primary w-8 h-8" />}
              title="News Trading Allowed"
              description="Trade during NFP, FOMC, CPI and all major news events freely with no restrictions."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Zap className="text-primary w-8 h-8" />}
              title="Daily Payouts"
              description="Instant Funding accounts receive daily payouts. Fast, reliable, and consistent withdrawals."
              delay={0.15}
            />
            <FeatureCard 
              icon={<BarChart3 className="text-primary w-8 h-8" />}
              title="80% Profit Split"
              description="Every trader keeps 80% of all profits generated. No tiers, no waiting, from day one."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-secondary/20 relative">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-primary w-7 h-7" />
              <span className="font-headline font-bold text-2xl tracking-tight text-white">PrimeFunded</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs text-center md:text-left">
              The world's most transparent institutional funding firm for traders.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-10 text-sm font-medium">
            <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link>
            <Link href="/rules" className="text-muted-foreground hover:text-primary transition-colors">Risk Disclosure</Link>
            <Link href="/support" className="text-muted-foreground hover:text-primary transition-colors">Contact Support</Link>
            <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">Client Area</Link>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <p className="text-xs text-muted-foreground">© 2024 PrimeFunded Global. All rights reserved.</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Built for Elite Traders</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HighlightBadge({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-xs font-bold text-primary">
      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
      {text}
    </div>
  );
}

function HighlightCard({ title, subtitle, icon }: { title: string, subtitle: string, icon: React.ReactNode }) {
  return (
    <div className="p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-all duration-300 group flex flex-col items-center text-center hover:bg-white/10 hover:scale-[1.02]">
      <div className="mb-6 p-4 bg-primary/10 rounded-2xl w-fit border border-primary/10 group-hover:scale-110 transition-transform duration-300 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors cyan-glow mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="p-10 rounded-[2.5rem] bg-secondary/30 border border-white/5 hover:border-primary/30 transition-all duration-300 hover:bg-secondary/40 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
      <div className="mb-8 p-4 bg-primary/10 rounded-2xl w-fit border border-primary/10 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-2xl font-headline font-bold mb-4 text-white">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
