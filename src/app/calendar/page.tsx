"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Globe, AlertTriangle } from 'lucide-react';

const events = [
  { time: "14:30", currency: "USD", event: "CPI m/m", forecast: "0.4%", actual: "-", impact: "High" },
  { time: "14:30", currency: "USD", event: "Core CPI m/m", forecast: "0.3%", actual: "-", impact: "High" },
  { time: "15:15", currency: "EUR", event: "ECB President Lagarde Speaks", impact: "Medium" },
  { time: "16:00", currency: "USD", event: "Michigan Consumer Sentiment", forecast: "76.9", actual: "-", impact: "Low" },
];

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
                  <CalendarIcon className="w-5 h-5 text-primary" /> Today, March 12, 2024
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                        <th className="py-4 px-6 w-24">Time</th>
                        <th className="py-4 px-2 w-24">Cur.</th>
                        <th className="py-4 px-2">Event</th>
                        <th className="py-4 px-2 text-center w-24">Impact</th>
                        <th className="py-4 px-2 w-24 text-right">Forecast</th>
                        <th className="py-4 px-6 w-24 text-right">Actual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {events.map((e, idx) => (
                        <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                          <td className="py-4 px-6 font-mono text-xs text-muted-foreground">{e.time}</td>
                          <td className="py-4 px-2 font-bold">{e.currency}</td>
                          <td className="py-4 px-2 font-medium">{e.event}</td>
                          <td className="py-4 px-2 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              e.impact === 'High' ? 'bg-destructive/10 text-destructive' : 
                              e.impact === 'Medium' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                            )}>
                              {e.impact}
                            </span>
                          </td>
                          <td className="py-4 px-2 text-right text-muted-foreground">{e.forecast || '-'}</td>
                          <td className="py-4 px-6 text-right font-bold">{e.actual}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" /> News Rule Warning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Trading high-impact news events (USD CPI) is prohibited 5 minutes before and after the release on 2-Step Classic Phase 1 accounts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Filter Calendar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span>High Impact Only</span>
                  <div className="w-8 h-4 bg-primary rounded-full relative">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs opacity-50">
                  <span>Show Holidays</span>
                  <div className="w-8 h-4 bg-secondary rounded-full relative">
                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}