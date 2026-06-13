'use client';

import { TrendingUp, Settings, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-8 max-w-md"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-primary/20 p-4 rounded-3xl border border-primary/20 cyan-box-glow">
            <TrendingUp className="text-primary w-12 h-12" />
          </div>
        </div>

        <div className="relative inline-block">
          <Settings className="w-24 h-24 text-primary animate-spin-slow opacity-20 mx-auto" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <Clock className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-headline font-bold text-white">Terminal Upgrading</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We are performing scheduled maintenance to enhance your trading performance. The markets are still being monitored, and your accounts remain secure.
          </p>
        </div>

        <div className="pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">System reconnecting soon</span>
          </div>
        </div>
        
        <p className="text-[10px] uppercase font-bold text-muted-foreground/30 tracking-[0.3em]">
          PRIME FUNDED NODE: UNDER MAINTENANCE
        </p>
      </motion.div>
    </div>
  );
}
