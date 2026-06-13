import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReferralLoading() {
  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10 space-y-2">
          <Skeleton className="h-10 w-64 rounded-lg bg-secondary/50" />
          <Skeleton className="h-4 w-96 rounded-lg bg-secondary/30" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <Skeleton className="h-[300px] rounded-3xl bg-secondary/20" />
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-2xl bg-secondary/10" />)}
            </div>
            <Skeleton className="h-40 rounded-3xl bg-secondary/20" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl bg-secondary/10" />)}
        </div>

        <Skeleton className="h-[400px] rounded-3xl bg-secondary/10" />
      </main>
    </div>
  );
}
