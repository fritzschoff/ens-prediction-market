'use client';

export function MarketCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-5 w-20 animate-pulse rounded-full bg-slate-800/50" />
      </div>

      <div className="mb-4 space-y-2">
        <div className="h-5 w-full animate-pulse rounded bg-slate-800/50" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-800/50" />
      </div>

      <div className="mb-4 flex gap-3">
        <div className="flex-1 rounded-xl bg-slate-800/30 p-3">
          <div className="mb-2 h-8 w-12 animate-pulse rounded bg-slate-800/50 mx-auto" />
          <div className="h-3 w-8 animate-pulse rounded bg-slate-800/50 mx-auto" />
        </div>
        <div className="flex-1 rounded-xl bg-slate-800/30 p-3">
          <div className="mb-2 h-8 w-12 animate-pulse rounded bg-slate-800/50 mx-auto" />
          <div className="h-3 w-8 animate-pulse rounded bg-slate-800/50 mx-auto" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-slate-800/50" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-800/50" />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 animate-pulse rounded bg-slate-800/50" />
          <div className="h-4 w-24 animate-pulse rounded bg-slate-800/50" />
        </div>
      </div>
    </div>
  );
}

