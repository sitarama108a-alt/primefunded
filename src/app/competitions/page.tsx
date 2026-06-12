"use client";

import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Clock, ArrowRight } from 'lucide-react';

const activeCompetitions = [
  {
    id: 1,
    title: "March Monthly Shootout",
    prize: "$5,000",
    participants: 1240,
    endsIn: "14 Days",
    status: "active",
    type: "Free to Join"
  },
  {
    id: 2,
    title: "Weekend Scalping King",
    prize: "$1,500",
    participants: 450,
    endsIn: "2 Days",
    status: "active",
    type: "Pro Only"
  }
];

const upcomingCompetitions = [
  {
    id: 3,
    title: "Spring Trading Championship",
    prize: "$25,000",
    startDate: "April 1st",
    status: "upcoming",
    type: "Open Enrollment"
  }
];

export default function CompetitionsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">Trading Competitions</h1>
          <p className="text-muted-foreground">Test your skills against the community and win cash prizes.</p>
        </header>

        <section className="mb-12">
          <h2 className="text-xl font-headline font-bold mb-6 flex items-center gap-2">
            <Trophy className="text-primary w-5 h-5" /> Live Now
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {activeCompetitions.map((comp) => (
              <Card key={comp.id} className="border-primary/20 bg-primary/5 hover:border-primary/40 transition-all">
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2 text-primary border-primary/30 uppercase text-[10px]">{comp.type}</Badge>
                    <CardTitle className="text-xl font-headline font-bold">{comp.title}</CardTitle>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total Prize</p>
                    <p className="text-2xl font-headline font-bold text-primary">{comp.prize}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" /> {comp.participants} Joined
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" /> {comp.endsIn} left
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full font-bold">
                    View Leaderboard <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-headline font-bold mb-6">Upcoming</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingCompetitions.map((comp) => (
              <Card key={comp.id} className="opacity-80">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2 uppercase text-[10px]">Upcoming</Badge>
                  <CardTitle className="text-lg font-headline font-bold">{comp.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Starts: {comp.startDate}</p>
                  <p className="text-lg font-bold text-primary mt-2">{comp.prize} Prize</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Remind Me</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}