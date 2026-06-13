import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function PayoutsLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10 space-y-2">
          <Skeleton className="h-10 w-64 rounded-lg bg-secondary/50" />
          <Skeleton className="h-4 w-72 rounded-lg bg-secondary/30" />
        </header>

        <Skeleton className="h-24 w-full rounded-2xl bg-secondary/20 mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-3xl bg-secondary/20" />
          ))}
        </div>

        <Skeleton className="h-[400px] w-full rounded-3xl bg-secondary/10" />
      </main>
    </div>
  );
}
