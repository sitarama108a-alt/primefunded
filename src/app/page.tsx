import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, Shield, Zap, Globe, ArrowRight, BarChart3, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary w-8 h-8" />
            <span className="font-headline font-bold text-2xl tracking-tight">PrimeFunded</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#challenges" className="text-sm font-medium hover:text-primary transition-colors">Challenges</Link>
            <Link href="#rules" className="text-sm font-medium hover:text-primary transition-colors">Rules</Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">About Us</Link>
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Login</Link>
            <Button asChild>
              <Link href="/signup">Get Funded</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden bg-grid-white">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full -z-10" />
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-accent live-indicator" />
            Now Funding Up To $200,000
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold mb-6 leading-tight">
            Institutional Funding for <br />
            <span className="text-primary italic">Elite Traders.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Trade our capital, keep up to 90% of the profits. Industry-leading technology, instant execution, and professional compliance monitoring.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-lg rounded-xl font-bold" asChild>
              <Link href="/challenges">Start Challenge <ArrowRight className="ml-2 w-5 h-5" /></Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-xl font-bold bg-transparent" asChild>
              <Link href="/rules">View Trading Rules</Link>
            </Button>
          </div>
          
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="p-4">
              <p className="text-3xl font-headline font-bold mb-1">$50M+</p>
              <p className="text-sm text-muted-foreground">Payouts Disbursed</p>
            </div>
            <div className="p-4">
              <p className="text-3xl font-headline font-bold mb-1">0.1s</p>
              <p className="text-sm text-muted-foreground">Execution Speed</p>
            </div>
            <div className="p-4">
              <p className="text-3xl font-headline font-bold mb-1">80%+</p>
              <p className="text-sm text-muted-foreground">Profit Share</p>
            </div>
            <div className="p-4">
              <p className="text-3xl font-headline font-bold mb-1">24/7</p>
              <p className="text-sm text-muted-foreground">Trader Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-card/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-headline font-bold mb-4">Why PrimeFunded?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Our infrastructure is built by traders, for traders. We provide the tools you need to succeed.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield className="text-primary w-8 h-8" />}
              title="Secure Compliance"
              description="AI-powered monitor ensures you stay within rules and flags risks before breaches happen."
            />
            <FeatureCard 
              icon={<Zap className="text-accent w-8 h-8" />}
              title="Instant Funding"
              description="No evaluation phase needed for our Instant models. Trade live capital from day one."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-primary w-8 h-8" />}
              title="Advanced Analytics"
              description="Real-time dashboard with MetaApi integration for deep performance insights."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-primary w-6 h-6" />
            <span className="font-headline font-bold text-xl tracking-tight">PrimeFunded</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Risk Disclosure</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 PrimeFunded. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-headline font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}