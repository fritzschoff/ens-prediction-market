"use client";

import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";

interface MarketCardProps {
  id: string;
  question: string;
  ensName?: string;
  expiry: number;
  yesPrice: number;
  noPrice: number;
  totalVolume: string;
  resolved?: boolean;
  outcome?: boolean;
  isExample?: boolean;
}

export function MarketCard({
  id,
  question,
  ensName,
  expiry,
  yesPrice,
  noPrice,
  totalVolume,
  resolved,
  outcome,
  isExample,
}: MarketCardProps) {
  const isExpired = Date.now() / 1000 > expiry;

  return (
    <Link href={`/market/${ensName || id}`}>
      <div className="group relative overflow-hidden rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6 transition-all duration-300 hover:border-indigo-500/50 hover:bg-slate-900/80 hover:glow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="relative">
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            {isExample && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Example
              </div>
            )}
            {ensName && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                {ensName}
              </div>
            )}
          </div>

          <h3 className="mb-4 text-lg font-semibold text-slate-100 line-clamp-2">
            {question}
          </h3>

          {resolved ? (
            <div className="mb-4">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                  outcome
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                Resolved: {outcome ? "YES" : "NO"}
              </span>
            </div>
          ) : (
            <div className="mb-4 flex gap-3">
              <div className="flex-1 rounded-xl bg-emerald-500/10 p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {(yesPrice * 100).toFixed(0)}%
                </div>
                <div className="text-xs font-medium text-emerald-400/60">
                  YES
                </div>
              </div>
              <div className="flex-1 rounded-xl bg-rose-500/10 p-3 text-center">
                <div className="text-2xl font-bold text-rose-400">
                  {(noPrice * 100).toFixed(0)}%
                </div>
                <div className="text-xs font-medium text-rose-400/60">NO</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Volume</span>
            <span className="font-medium text-slate-300">{totalVolume}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              {isExpired ? "Expired" : "Expires"}
            </span>
            <span
              className={`font-medium ${
                isExpired ? "text-rose-400" : "text-slate-300"
              }`}
            >
              {formatDistanceToNow(expiry)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

