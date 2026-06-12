"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { HelpCircle, MessageSquare, BookOpen, Globe } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-headline font-bold mb-2">How can we help?</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Get fast support from our team of experienced traders and technicians.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <SupportOption 
            icon={<BookOpen className="text-primary" />}
            title="Help Center"
            description="Browse our documentation and knowledge base for instant answers."
          />
          <SupportOption 
            icon={<MessageSquare className="text-accent" />}
            title="Live Chat"
            description="Talk to our support specialists in real-time. Average response: 2m."
          />
          <SupportOption 
            icon={<Globe className="text-primary" />}
            title="Community"
            description="Join our Discord and connect with thousands of funded traders."
          />
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" /> Open a Support Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="What is your issue about?" />
            </div>
            <div className="space-y-2">
              <Label>Account ID (Optional)</Label>
              <Input placeholder="PF-XXXXXX" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea className="min-h-[150px]" placeholder="Describe your issue in detail..." />
            </div>
            <Button className="w-full font-bold h-12">Submit Ticket</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function SupportOption({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="hover:border-primary transition-colors cursor-pointer group">
      <CardContent className="pt-6 flex flex-col items-center text-center">
        <div className="p-3 bg-secondary rounded-2xl mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="font-headline font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}
