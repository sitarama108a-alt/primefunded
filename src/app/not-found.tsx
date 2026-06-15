"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TrendingUp, FileQuestion, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
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
          <FileQuestion className="w-24 h-24 text-muted-foreground/20 mx-auto" />
          <h1 className="text-8xl font-black text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10">404</h1>
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-headline font-bold text-white">Route Lost in Volatility</h2>
          <p className="text-muted-foreground text-lg">
            The page you are looking for has been liquidated or moved. Let&apos;s get you back to the terminal.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" size="lg" className="h-12 px-8 rounded-xl font-bold border-border/50 hover:bg-secondary cursor-pointer" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 w-4 h-4" /> Go Back
            </Link>
          </Button>
          <Button size="lg" className="h-12 px-8 rounded-xl font-bold cyan-box-glow cursor-pointer" asChild>
            <Link href="/dashboard">
              Trader Terminal
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
