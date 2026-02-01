"use client";

import { BetPanel } from "@/components/BetPanel";
import { PositionManager } from "@/components/PositionManager";
import { formatDistanceToNow, shortenAddress } from "@/lib/utils";

interface MarketPageProps {
  params: { name: string };
}

const MOCK_MARKET = {
  id: "1",
  question: "Will ETH reach $10,000 by end of 2026?",
  ensName: "eth-10k.predict.eth",
  expiry: Math.floor(Date.now() / 1000) + 86400 * 365,
  yesPrice: 0.35,
  noPrice: 0.65,
  totalVolume: "$125,430",
  oracle: "0x1234567890123456789012345678901234567890",
  creator: "vitalik.eth",
  criteria: "Market resolves YES if ETH/USD price on Coinbase exceeds $10,000 at any point before December 31, 2026 23:59:59 UTC.",
  resolved: false,
};

const MOCK_POSITIONS = [
  {
    outcome: true,
    amount: "100 USDC",
    avgPrice: 0.32,
    potentialWin: "312.50",
  },
];

export default function MarketPage({ params }: MarketPageProps) {
  const { name } = params;
  const market = MOCK_MARKET;

  const handleBet = (outcome: boolean, amount: string) => {
    console.log("Bet placed:", { outcome, amount });
  };

  const handleClaim = () => {
    console.log("Claiming winnings");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400 border border-amber-500/20">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Example
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            {market.ensName}
          </div>
        </div>
        <h1 className="mb-4 text-4xl font-bold text-slate-100">
          {market.question}
        </h1>
        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span>Created by</span>
            <span className="font-medium text-slate-300">{market.creator}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Oracle</span>
            <span className="font-mono text-slate-300">
              {shortenAddress(market.oracle)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Expires</span>
            <span className="font-medium text-slate-300">
              {formatDistanceToNow(market.expiry)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">
              Current Odds
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-emerald-500/10 p-6 text-center">
                <div className="text-5xl font-bold text-emerald-400">
                  {(market.yesPrice * 100).toFixed(0)}%
                </div>
                <div className="mt-2 text-lg font-medium text-emerald-400/60">
                  YES
                </div>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-6 text-center">
                <div className="text-5xl font-bold text-rose-400">
                  {(market.noPrice * 100).toFixed(0)}%
                </div>
                <div className="mt-2 text-lg font-medium text-rose-400/60">
                  NO
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">
              Resolution Criteria
            </h2>
            <p className="text-slate-400 leading-relaxed">{market.criteria}</p>
          </div>

          <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-100">
              Market Stats
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-2xl font-bold text-slate-100">
                  {market.totalVolume}
                </div>
                <div className="text-sm text-slate-500">Total Volume</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">1,234</div>
                <div className="text-sm text-slate-500">Trades</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">89</div>
                <div className="text-sm text-slate-500">Traders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">$52,100</div>
                <div className="text-sm text-slate-500">Liquidity</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <BetPanel
            yesPrice={market.yesPrice}
            noPrice={market.noPrice}
            onBet={handleBet}
            disabled={market.resolved}
          />
          <PositionManager
            positions={MOCK_POSITIONS}
            resolved={market.resolved}
            winningOutcome={true}
            onClaim={handleClaim}
          />
        </div>
      </div>
    </div>
  );
}

