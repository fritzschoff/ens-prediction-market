'use client';

import { MarketCard } from '@/components/MarketCard';
import { MarketCardSkeleton } from '@/components/MarketCardSkeleton';
import { useMarkets } from '@/hooks';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther } from 'viem';

export default function HomePage() {
  const { isConnected } = useAccount();
  const { markets, isLoading, error, totalCount, refetch } = useMarkets();

  const totalVolume = markets.reduce((sum, market) => {
    const volume = market.totalCollateral || 0n;
    return sum + Number(formatEther(volume));
  }, 0);

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

      {!isConnected ? (
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-12 text-center">
          <h2 className="mb-4 text-2xl font-semibold text-slate-100">
            Connect Your Wallet
          </h2>
          <p className="mb-6 text-slate-400">
            Please connect your wallet to view and interact with prediction
            markets.
          </p>
          <ConnectButton />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-400">
            Error Loading Markets
          </h2>
          <p className="mb-4 text-sm text-red-400/80">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      ) : isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MarketCardSkeleton key={i} />
          ))}
        </div>
      ) : markets.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-12 text-center">
          <h2 className="mb-2 text-xl font-semibold text-slate-100">
            No Markets Found
          </h2>
          <p className="text-slate-400">
            Be the first to create a prediction market!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              id={market.id}
              question={market.question}
              ensName={market.ensName}
              expiry={market.expiry}
              yesPrice={market.yesPrice || 0.5}
              noPrice={market.noPrice || 0.5}
              totalVolume={market.totalVolume || '0 ETH'}
              resolved={market.resolved}
              outcome={market.outcome}
            />
          ))}
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-slate-800/50 bg-slate-900/50 p-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-gradient">
              {isLoading ? '...' : `${totalVolume.toFixed(2)} ETH`}
            </div>
            <div className="text-sm text-slate-500">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-gradient">
              {isLoading ? '...' : totalCount}
            </div>
            <div className="text-sm text-slate-500">Active Markets</div>
          </div>
          <div className="text-center">
            <div className="mb-2 text-4xl font-bold text-gradient">
              {isLoading ? '...' : markets.filter(m => m.ensName).length}
            </div>
            <div className="text-sm text-slate-500">ENS-Named Markets</div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
            <svg className="h-6 w-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">ENS-Powered Discovery</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Markets are linked to ENS domains like <span className="text-indigo-400 font-medium">yourmarket.predict.eth</span>. 
              This makes markets easy to find, share, and verify. Create a market to get your own ENS subdomain!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
