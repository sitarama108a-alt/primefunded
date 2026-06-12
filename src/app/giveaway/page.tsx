"use client";

import { Navigation } from '@/components/Navigation';
import { Gift } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GiveawayPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-md space-y-6"
        >
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20 cyan-box-glow">
            <Gift className="text-primary w-12 h-12" />
          </div>
          <h1 className="text-4xl font-headline font-bold">Exclusive Giveaways</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Join our exclusive events to win free funded accounts, 
            trading setups, and unique bonuses. We believe in rewarding our elite community.
          </p>
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Next giveaway starting soon
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
