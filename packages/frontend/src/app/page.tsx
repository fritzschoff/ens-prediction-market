"use client";

import { MarketCard } from "@/components/MarketCard";

const MOCK_MARKETS = [
  {
    id: "1",
    question: "Will ETH reach $10,000 by end of 2026?",
    ensName: "eth-10k.predict.eth",
    expiry: Math.floor(Date.now() / 1000) + 86400 * 365,
    yesPrice: 0.35,
    noPrice: 0.65,
    totalVolume: "$125,430",
  },
  {
    id: "2",
    question: "Will Bitcoin ETF see $50B AUM by Q2 2026?",
    ensName: "btc-etf-50b.predict.eth",
    expiry: Math.floor(Date.now() / 1000) + 86400 * 180,
    yesPrice: 0.72,
    noPrice: 0.28,
    totalVolume: "$89,200",
  },
  {
    id: "3",
    question: "Will Uniswap v4 surpass v3 in TVL?",
    ensName: "uni-v4-tvl.predict.eth",
    expiry: Math.floor(Date.now() / 1000) + 86400 * 90,
    yesPrice: 0.45,
    noPrice: 0.55,
    totalVolume: "$45,800",
  },
  {
    id: "4",
    question: "Will ENS reach 5M registered names?",
    ensName: "ens-5m.predict.eth",
    expiry: Math.floor(Date.now() / 1000) + 86400 * 120,
    yesPrice: 0.58,
    noPrice: 0.42,
    totalVolume: "$32,150",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          <span className="text-gradient">Prediction Markets</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400">
          Trade on future outcomes with ENS-named markets, powered by Uniswap v4
          and Yellow Network for instant, gasless betting.
        </p>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="rounded-full bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-500/20">
            All Markets
          </button>
          <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800">
            Crypto
          </button>
          <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800">
            DeFi
          </button>
          <button className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800">
            NFTs
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search markets..."
            className="w-64 rounded-full border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_MARKETS.map((market) => (
          <MarketCard key={market.id} {...market} isExample={true} />
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-gradient">$292K</div>
            <div className="text-sm text-slate-500">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-gradient">4</div>
            <div className="text-sm text-slate-500">Active Markets</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-gradient">0</div>
            <div className="text-sm text-slate-500">Gas Fees Paid</div>
          </div>
        </div>
      </div>
    </div>
  );
}

