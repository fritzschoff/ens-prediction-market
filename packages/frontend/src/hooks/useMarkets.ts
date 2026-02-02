'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import {
  CONTRACTS,
  MARKET_FACTORY_ABI,
  PREDICTION_HOOK_ABI,
} from '@/lib/contracts';
import { Address, formatEther, zeroAddress } from 'viem';

export interface Market {
  id: string;
  question: string;
  oracle: Address;
  expiry: number;
  creator: Address;
  yesToken: Address;
  noToken: Address;
  poolKey: {
    currency0: Address;
    currency1: Address;
    fee: number;
    tickSpacing: number;
    hooks: Address;
  };
  resolved?: boolean;
  outcome?: boolean;
  totalCollateral?: bigint;
  yesPrice?: number;
  noPrice?: number;
  totalVolume?: string;
  ensName?: string;
}

export function useMarkets() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);

  const fetchMarkets = useCallback(async () => {
    if (!isConnected || !publicClient) {
      setError(new Error('Please connect your wallet to fetch markets'));
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const marketCount = await publicClient.readContract({
        address: CONTRACTS.MARKET_FACTORY,
        abi: MARKET_FACTORY_ABI,
        functionName: 'getMarketCount',
      });
      const count = Number(marketCount);
      setTotalCount(count);

      if (count === 0) {
        setMarkets([]);
        setIsLoading(false);
        return;
      }

      const marketsToFetch = Math.min(10, count);
      const fetchedMarkets: Market[] = [];
      let emptyResults = 0;
      const maxEmptyResults = 15;
      let fetchedCount = 0;

      const marketIdPromises: Promise<`0x${string}`>[] = [];
      for (
        let i = 0;
        i < Math.min(count, marketsToFetch + maxEmptyResults);
        i++
      ) {
        marketIdPromises.push(
          publicClient.readContract({
            address: CONTRACTS.MARKET_FACTORY,
            abi: MARKET_FACTORY_ABI,
            functionName: 'getMarketIdAt',
            args: [BigInt(i)],
          })
        );
      }

      const marketIds = await Promise.all(marketIdPromises);

      for (
        let i = 0;
        i < marketIds.length &&
        fetchedCount < marketsToFetch &&
        emptyResults < maxEmptyResults;
        i++
      ) {
        try {
          const marketId = marketIds[i];

          if (!marketId || marketId === zeroAddress) {
            emptyResults++;
            continue;
          }

          const marketInfo = await publicClient.readContract({
            address: CONTRACTS.MARKET_FACTORY,
            abi: MARKET_FACTORY_ABI,
            functionName: 'getMarketInfo',
            args: [marketId],
          });

          const poolKey = marketInfo.poolKey;
          let hookMarket = null;

          try {
            hookMarket = await publicClient.readContract({
              address: CONTRACTS.PREDICTION_HOOK,
              abi: PREDICTION_HOOK_ABI,
              functionName: 'getMarket',
              args: [poolKey],
            });
          } catch (err) {
            console.warn('Failed to fetch hook market data:', err);
          }

          const totalCollateral = hookMarket?.totalCollateral || 0n;

          let yesPrice = 0.5;
          let noPrice = 0.5;

          if (hookMarket?.resolved) {
            yesPrice = hookMarket.outcome ? 1 : 0;
            noPrice = hookMarket.outcome ? 0 : 1;
          }

          const ensName = marketInfo.ensName || undefined;

          const market: Market = {
            id: marketId,
            question: marketInfo.question,
            oracle: marketInfo.oracle,
            expiry: Number(marketInfo.expiry),
            creator: marketInfo.creator,
            yesToken: marketInfo.yesToken,
            noToken: marketInfo.noToken,
            poolKey: {
              currency0: poolKey.currency0 as Address,
              currency1: poolKey.currency1 as Address,
              fee: Number(poolKey.fee),
              tickSpacing: Number(poolKey.tickSpacing),
              hooks: poolKey.hooks as Address,
            },
            resolved: hookMarket?.resolved || false,
            outcome: hookMarket?.outcome,
            totalCollateral,
            yesPrice,
            noPrice,
            totalVolume:
              totalCollateral > 0n
                ? `${formatEther(totalCollateral)} ETH`
                : '0 ETH',
            ensName,
          };

          fetchedMarkets.push(market);
          fetchedCount++;
          emptyResults = 0;
        } catch (err) {
          console.error(`Failed to fetch market at index ${i}:`, err);
          emptyResults++;
        }
      }

      setMarkets(fetchedMarkets);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch markets';
      setError(new Error(errorMessage));
      console.error('Error fetching markets:', err);
      setMarkets([]);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, publicClient]);

  useEffect(() => {
    if (isConnected && publicClient) {
      fetchMarkets();
    } else {
      setMarkets([]);
      setIsLoading(false);
      if (!isConnected) {
        setError(new Error('Please connect your wallet to fetch markets'));
      } else {
        setError(null);
      }
    }
  }, [isConnected, publicClient, fetchMarkets]);

  return {
    markets,
    isLoading,
    error,
    totalCount,
    refetch: fetchMarkets,
  };
}
