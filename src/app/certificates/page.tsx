"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2 } from 'lucide-react';

export default function CertificatesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">Your Certificates</h1>
          <p className="text-muted-foreground">Verified proof of your trading excellence.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CertificateCard 
            title="Funded Trader Certificate"
            date="March 12, 2024"
            type="Platinum"
            account="$100,000 1-Step Pro"
          />
          <CertificateCard 
            title="Consistency Award"
            date="February 28, 2024"
            type="Gold"
            account="$100,000 1-Step Pro"
          />
          <CertificateCard 
            title="Evaluation Passed"
            date="January 15, 2024"
            type="Silver"
            account="$100,000 1-Step Pro"
          />
        </div>
      </main>
    </div>
  );
}

function CertificateCard({ title, date, type, account }: { title: string, date: string, type: string, account: string }) {
  return (
    <Card className="overflow-hidden group hover:border-primary transition-all">
      <div className="h-48 bg-secondary flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white opacity-10" />
        <Award className="w-20 h-20 text-primary opacity-20 group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20">
          {type} Verified
        </div>
      </div>
      <CardContent className="p-6">
        <h3 className="text-lg font-headline font-bold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{account}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-6">
          <span>Issued: {date}</span>
          <span className="font-mono">ID: PF-CERT-44102</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="h-9 w-9 p-0">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
