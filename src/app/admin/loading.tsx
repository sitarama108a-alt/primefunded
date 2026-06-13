
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="flex justify-between items-start mb-8">
          <div className="space-y-2">
            <Skeleton className="h-10 w-80 rounded-lg bg-secondary/50" />
            <Skeleton className="h-4 w-64 rounded-lg bg-secondary/30" />
          </div>
          <Skeleton className="h-10 w-64 rounded-lg bg-secondary/50" />
        </header>

        <Skeleton className="h-12 w-full rounded-xl bg-secondary/30 mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl bg-secondary/20" />
          ))}
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl bg-secondary/10" />
          ))}
        </div>
      </main>
    </div>
  );
}
