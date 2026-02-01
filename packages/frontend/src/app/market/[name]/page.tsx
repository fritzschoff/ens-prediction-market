'use client';

import { BetPanel } from '@/components/BetPanel';
import { PositionManager } from '@/components/PositionManager';
import { formatDistanceToNow, shortenAddress } from '@/lib/utils';
import { useMarketData, useEthPrice, useUserPositions } from '@/hooks';
import { useAccount, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { formatEther } from 'viem';

interface MarketPageProps {
  params: { name: string };
}

export default function MarketPage({ params }: MarketPageProps) {
  const { name } = params;
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { market, isLoading, error } = useMarketData(name);
  const { price: ethPrice } = useEthPrice();
  const { positions } = useUserPositions(
    market?.yesToken,
    market?.noToken,
    market?.yesPrice || 0.5,
    market?.noPrice || 0.5,
    market?.resolved,
    market?.outcome
  );

  const handleBet = (outcome: boolean, amount: string) => {
    console.log('Bet placed:', { outcome, amount });
  };

  const handleClaim = () => {
    console.log('Claiming winnings');
  };

  const totalVolumeUSD =
    market && ethPrice
      ? (parseFloat(formatEther(market.totalCollateral)) * ethPrice).toFixed(2)
      : null;

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-12 text-center">
          <h2 className="mb-4 text-2xl font-semibold text-slate-100">
            Connect Your Wallet
          </h2>
          <p className="mb-6 text-slate-400">
            Please connect your wallet to view this market.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-900/50" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 animate-pulse rounded-2xl bg-slate-900/50" />
              <div className="h-48 animate-pulse rounded-2xl bg-slate-900/50" />
            </div>
            <div className="h-96 animate-pulse rounded-2xl bg-slate-900/50" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-red-400">
            Error Loading Market
          </h2>
          <p className="text-sm text-red-400/80">
            {error?.message || 'Market not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          {market.resolved && (
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
                market.outcome
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  market.outcome ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
              />
              Resolved: {market.outcome ? 'YES' : 'NO'}
            </div>
          )}
          {market.ensName && (
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400">
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              {market.ensName}
            </div>
          )}
        </div>
        <h1 className="mb-4 text-4xl font-bold text-slate-100">
          {market.question}
        </h1>
        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span>Created by</span>
            <span className="font-medium text-slate-300">
              {shortenAddress(market.creator)}
            </span>
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

          {market.criteria && (
            <div className="rounded-2xl border border-slate-800/50 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-100">
                Resolution Criteria
              </h2>
              <p className="text-slate-400 leading-relaxed">
                {market.criteria}
              </p>
            </div>
          )}

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
                {totalVolumeUSD && (
                  <div className="text-xs text-slate-500 mt-1">
                    ≈ ${totalVolumeUSD}
                  </div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">
                  {formatEther(market.yesSupply)}
                </div>
                <div className="text-sm text-slate-500">YES Supply</div>
                {ethPrice && (
                  <div className="text-xs text-slate-500 mt-1">
                    ≈ $
                    {(
                      parseFloat(formatEther(market.yesSupply)) * ethPrice
                    ).toFixed(2)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">
                  {formatEther(market.noSupply)}
                </div>
                <div className="text-sm text-slate-500">NO Supply</div>
                {ethPrice && (
                  <div className="text-xs text-slate-500 mt-1">
                    ≈ $
                    {(
                      parseFloat(formatEther(market.noSupply)) * ethPrice
                    ).toFixed(2)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">
                  {formatEther(market.totalCollateral)}
                </div>
                <div className="text-sm text-slate-500">Total Collateral</div>
                {ethPrice && (
                  <div className="text-xs text-slate-500 mt-1">
                    ≈ $
                    {(
                      parseFloat(formatEther(market.totalCollateral)) * ethPrice
                    ).toFixed(2)}
                  </div>
                )}
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
            positions={positions}
            resolved={market.resolved}
            winningOutcome={market.outcome}
            onClaim={handleClaim}
          />
        </div>
      </div>
    </div>
  );
}
