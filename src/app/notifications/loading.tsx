
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10 space-y-2">
          <Skeleton className="h-10 w-48 rounded-lg bg-secondary/50" />
          <Skeleton className="h-4 w-64 rounded-lg bg-secondary/30" />
        </header>

        <Skeleton className="h-12 w-96 rounded-xl bg-secondary/30 mb-8" />

        <div className="space-y-4 max-w-4xl">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-3xl bg-secondary/20" />
          ))}
        </div>
      </main>
    </div>
  );
}
