"use client";

import { cn } from "@/lib/utils";
import { useEthPrice } from "@/hooks";

interface Position {
  outcome: boolean;
  amount: string;
  avgPrice: number;
  potentialWin: string;
}

interface PositionManagerProps {
  positions: Position[];
  resolved?: boolean;
  winningOutcome?: boolean;
  onClaim?: () => void;
}

export function PositionManager({
  positions,
  resolved,
  winningOutcome,
  onClaim,
}: PositionManagerProps) {
  const { price: ethPrice } = useEthPrice();
  const hasWinningPosition =
    resolved &&
    positions.some((p) => p.outcome === winningOutcome && parseFloat(p.amount) > 0);

  if (positions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-slate-100">
          Your Position
        </h3>
        <p className="text-center text-slate-500">No positions yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">
        Your Position
      </h3>

      <div className="space-y-3">
        {positions.map((position, i) => {
          const amountEth = parseFloat(position.amount.replace(' ETH', '')) || 0;
          const winEth = parseFloat(position.potentialWin.replace(' ETH', '')) || 0;
          const amountUSD = ethPrice ? (amountEth * ethPrice).toFixed(2) : null;
          const winUSD = ethPrice ? (winEth * ethPrice).toFixed(2) : null;

          return (
            <div
              key={i}
              className={cn(
                "rounded-xl p-4",
                position.outcome
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-rose-500/10 border border-rose-500/20"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "font-semibold",
                    position.outcome ? "text-emerald-400" : "text-rose-400"
                  )}
                >
                  {position.outcome ? "YES" : "NO"}
                </span>
                <div className="text-right">
                  <span className="font-mono text-slate-100">{position.amount}</span>
                  {amountUSD && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      ≈ ${amountUSD}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Avg Price</span>
                <span className="text-slate-300">
                  {(position.avgPrice * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-500">Potential Win</span>
                <div className="text-right">
                  <span className="text-slate-300">{position.potentialWin}</span>
                  {winUSD && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      ≈ ${winUSD}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {resolved && hasWinningPosition && (
        <button
          onClick={onClaim}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 font-semibold text-white transition-all hover:from-emerald-600 hover:to-emerald-700"
        >
          Claim Winnings
        </button>
      )}
    </div>
  );
}

