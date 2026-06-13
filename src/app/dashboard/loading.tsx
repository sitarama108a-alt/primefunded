import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-10">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 rounded-lg bg-secondary/50" />
            <Skeleton className="h-4 w-48 rounded-lg bg-secondary/30" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-lg bg-secondary/50" />
            <Skeleton className="h-10 w-32 rounded-lg bg-secondary/50" />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl bg-secondary/20" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-3xl bg-secondary/20" />
          <div className="space-y-6">
            <Skeleton className="h-[180px] rounded-3xl bg-secondary/20" />
            <Skeleton className="h-[180px] rounded-3xl bg-secondary/20" />
          </div>
        </div>

        <Skeleton className="h-64 w-full rounded-3xl bg-secondary/20" />
      </main>
    </div>
  );
}
