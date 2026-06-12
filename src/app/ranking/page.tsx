"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, TrendingUp, Medal } from 'lucide-react';

const rankings = [
  { rank: 1, name: "Alexander K.", profit: "$242,500", gain: "+42.5%", winRate: "72%", avatar: "https://picsum.photos/seed/trader1/100" },
  { rank: 2, name: "Sarah Miller", profit: "$189,200", gain: "+38.1%", winRate: "68%", avatar: "https://picsum.photos/seed/trader2/100" },
  { rank: 3, name: "David Chen", profit: "$154,000", gain: "+31.0%", winRate: "65%", avatar: "https://picsum.photos/seed/trader3/100" },
  { rank: 4, name: "Elena Rossi", profit: "$122,800", gain: "+28.4%", winRate: "64%", avatar: "https://picsum.photos/seed/trader4/100" },
  { rank: 5, name: "James Wilson", profit: "$98,400", gain: "+24.2%", winRate: "61%", avatar: "https://picsum.photos/seed/trader5/100" },
];

export default function RankingPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1 text-primary flex items-center gap-3">
            <Medal className="w-8 h-8" /> Trader Rankings
          </h1>
          <p className="text-muted-foreground">The elite 1% of PrimeFunded. Top performers by all-time profit.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <TopTraderCard trader={rankings[0]} />
          <TopTraderCard trader={rankings[1]} />
          <TopTraderCard trader={rankings[2]} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">All-Time Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/30">
                  <tr className="border-b border-border/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                    <th className="py-4 px-6 w-20 text-center">Rank</th>
                    <th className="py-4 px-2">Trader</th>
                    <th className="py-4 px-2">Win Rate</th>
                    <th className="py-4 px-2">Gain</th>
                    <th className="py-4 px-6 text-right">Total Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {rankings.map((trader) => (
                    <tr key={trader.rank} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-6 text-center font-headline font-bold">
                        {trader.rank === 1 ? '🥇' : trader.rank === 2 ? '🥈' : trader.rank === 3 ? '🥉' : `#${trader.rank}`}
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border border-primary/20">
                            <AvatarImage src={trader.avatar} />
                            <AvatarFallback>{trader.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold">{trader.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-muted-foreground font-mono">{trader.winRate}</td>
                      <td className="py-4 px-2">
                        <Badge className="bg-accent/10 text-accent border-accent/20">{trader.gain}</Badge>
                      </td>
                      <td className="py-4 px-6 text-right font-headline font-bold text-primary">{trader.profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TopTraderCard({ trader }: { trader: any }) {
  return (
    <Card className={`relative overflow-hidden border-primary/20 ${trader.rank === 1 ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
      {trader.rank === 1 && (
        <div className="absolute top-0 right-0 p-2">
          <Trophy className="w-6 h-6 text-primary fill-primary/20" />
        </div>
      )}
      <CardContent className="pt-10 flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 mb-4 border-4 border-primary/20">
          <AvatarImage src={trader.avatar} />
          <AvatarFallback>{trader.name[0]}</AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-headline font-bold mb-1">{trader.name}</h3>
        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter mb-4">Rank #{trader.rank}</p>
        <div className="grid grid-cols-2 gap-8 w-full border-t border-border pt-4">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Gain</p>
            <p className="text-lg font-bold text-accent">{trader.gain}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Profit</p>
            <p className="text-lg font-bold text-primary">{trader.profit}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}