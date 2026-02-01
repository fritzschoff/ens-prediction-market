"use client";

import { cn } from "@/lib/utils";

interface BatchInfoProps {
  batchId: number;
  startTime: number;
  totalYes: string;
  totalNo: string;
  yesCount: number;
  noCount: number;
  settled: boolean;
  clearingPrice?: number;
}

export function BatchInfo({
  batchId,
  startTime,
  totalYes,
  totalNo,
  yesCount,
  noCount,
  settled,
  clearingPrice,
}: BatchInfoProps) {
  const BATCH_DURATION = 5 * 60;
  const REVEAL_WINDOW = 10 * 60;

  const now = Date.now() / 1000;
  const commitEnd = startTime + BATCH_DURATION;
  const revealEnd = commitEnd + REVEAL_WINDOW;

  const phase = now < commitEnd ? "commit" : now < revealEnd ? "reveal" : "settled";

  const totalVolume = parseFloat(totalYes) + parseFloat(totalNo);
  const yesPercent = totalVolume > 0 ? (parseFloat(totalYes) / totalVolume) * 100 : 50;
  const noPercent = 100 - yesPercent;

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Batch #{batchId}</h3>
        <span className={cn(
          "rounded-full px-3 py-1 text-xs font-medium",
          phase === "commit" && "bg-indigo-500/10 text-indigo-400",
          phase === "reveal" && "bg-amber-500/10 text-amber-400",
          phase === "settled" && "bg-emerald-500/10 text-emerald-400"
        )}>
          {phase === "commit" && "Committing"}
          {phase === "reveal" && "Revealing"}
          {phase === "settled" && (settled ? "Settled" : "Pending Settlement")}
        </span>
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-emerald-400">YES {yesPercent.toFixed(1)}%</span>
          <span className="text-rose-400">NO {noPercent.toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${yesPercent}%` }}
          />
          <div
            className="bg-rose-500 transition-all duration-500"
            style={{ width: `${noPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-emerald-500/10 p-3">
          <div className="text-2xl font-bold text-emerald-400">{totalYes}</div>
          <div className="text-xs text-emerald-400/60">{yesCount} bets</div>
        </div>
        <div className="rounded-xl bg-rose-500/10 p-3">
          <div className="text-2xl font-bold text-rose-400">{totalNo}</div>
          <div className="text-xs text-rose-400/60">{noCount} bets</div>
        </div>
      </div>

      {settled && clearingPrice !== undefined && (
        <div className="mt-4 rounded-xl bg-slate-800/30 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Clearing Price</span>
            <span className="font-mono text-lg font-semibold text-slate-100">
              {(clearingPrice * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        <div className="flex justify-between">
          <span>Commit ends</span>
          <span>{new Date(commitEnd * 1000).toLocaleTimeString()}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Reveal ends</span>
          <span>{new Date(revealEnd * 1000).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}

