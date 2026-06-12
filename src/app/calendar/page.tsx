"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Globe, Info } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1">Economic Calendar</h1>
            <p className="text-muted-foreground">Monitor high-impact news events that affect the global markets.</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="h-9 px-4 flex items-center gap-2">
              <Globe className="w-3 h-3" /> Timezone: GMT-5 (New York)
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" /> Market Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="p-20 text-center flex flex-col items-center justify-center">
                <Info className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-lg font-bold">No events scheduled</h3>
                <p className="text-sm text-muted-foreground">Live economic news feed will populate here shortly. Please check back during market hours.</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-secondary/20 border-border">
              <CardHeader>
                <CardTitle className="text-sm">Filter Calendar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground italic">Filtering options will become active when news data is live.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
