
"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download, Filter, History, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function HistoryPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-1 text-white">Trading History</h1>
            <p className="text-muted-foreground text-sm">Review every execution across all your accounts.</p>
          </div>
          <Button variant="outline" disabled className="w-full md:w-auto font-bold border-border/50 rounded-xl cursor-not-allowed">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </header>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input className="pl-10 h-11 bg-secondary/30 border-border/50 text-white rounded-xl focus:border-primary/50 transition-all" placeholder="Search by symbol, type, or order ID..." />
          </div>
          <Button variant="secondary" disabled className="h-11 px-6 font-bold rounded-xl border border-border/50 cursor-not-allowed">
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
        </div>

        <Card className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <History className="w-5 h-5 text-primary" /> Execution Journal
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30">
                  <tr className="border-b border-border/50 text-muted-foreground uppercase text-[10px] font-black tracking-widest">
                    <th className="py-4 px-6">Symbol</th>
                    <th className="py-4 px-2">Type</th>
                    <th className="py-4 px-2 text-right">Lot</th>
                    <th className="py-4 px-2 text-right">Entry</th>
                    <th className="py-4 px-2 text-right">Exit</th>
                    <th className="py-4 px-2 text-right">P&L</th>
                    <th className="py-4 px-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr>
                    <td colSpan={7} className="py-32 text-center">
                      <div className="flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto">
                        <div className="w-20 h-20 bg-secondary/30 rounded-full flex items-center justify-center border border-white/5">
                          <SearchX className="w-10 h-10 text-muted-foreground opacity-20" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Journal is Empty</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            No historical trade data was found for your linked accounts. Once you execute trades on MT5, they will populate here.
                          </p>
                        </div>
                        <Button variant="link" className="text-primary font-bold hover:no-underline cursor-pointer" asChild>
                          <a href="/mt5-account">View Connection Guide</a>
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
