
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChallengesLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-12 space-y-2">
          <Skeleton className="h-10 w-80 rounded-lg bg-secondary/50" />
          <Skeleton className="h-4 w-96 rounded-lg bg-secondary/30" />
        </header>

        <Skeleton className="h-14 w-full max-w-2xl rounded-xl bg-secondary/30 mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Skeleton key={i} className="h-[450px] rounded-[2.5rem] bg-secondary/20" />
          ))}
        </div>
      </main>
    </div>
  );
}
