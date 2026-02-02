'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import {
  CONTRACTS,
  MARKET_FACTORY_ABI,
  PREDICTION_HOOK_ABI,
} from '@/lib/contracts';
import { Address, formatEther } from 'viem';
import { resolveMarketFromENS } from '@hack-money/ens';

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface MarketData {
  marketId: string;
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
  resolved: boolean;
  outcome?: boolean;
  totalCollateral: bigint;
  yesSupply: bigint;
  noSupply: bigint;
  yesPrice: number;
  noPrice: number;
  totalVolume: string;
  criteria?: string;
  ensName?: string;
}

export function useMarketData(nameOrId: string) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [market, setMarket] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMarket = useCallback(async () => {
    if (!isConnected || !publicClient) {
      setError(new Error('Please connect your wallet to fetch market data'));
      return;
    }

    if (!nameOrId) {
      setError(new Error('Market name or ID is required'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let marketId: string;
      let ensRecords: any = null;

      if (nameOrId.startsWith('0x') && nameOrId.length === 66) {
        marketId = nameOrId;
      } else {
        const ensName = nameOrId.includes('.') ? nameOrId : `${nameOrId}.predict.eth`;
        
        const foundMarketId = await publicClient.readContract({
          address: CONTRACTS.MARKET_FACTORY,
          abi: MARKET_FACTORY_ABI,
          functionName: 'getMarketByENS',
          args: [ensName],
        });
        
        if (!foundMarketId || foundMarketId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          ensRecords = await resolveMarketFromENS(publicClient, ensName);
          
          if (!ensRecords) {
            throw new Error(`Market not found for ENS name: ${ensName}`);
          }

          const allMarketsCount = await publicClient.readContract({
            address: CONTRACTS.MARKET_FACTORY,
            abi: MARKET_FACTORY_ABI,
            functionName: 'getMarketCount',
          });

          let legacyMarketId: string | null = null;
          const count = Number(allMarketsCount);

          for (let i = 0; i < Math.min(count, 100); i++) {
            try {
              const id = await publicClient.readContract({
                address: CONTRACTS.MARKET_FACTORY,
                abi: MARKET_FACTORY_ABI,
                functionName: 'getMarketIdAt',
                args: [BigInt(i)],
              });

              const info = await publicClient.readContract({
                address: CONTRACTS.MARKET_FACTORY,
                abi: MARKET_FACTORY_ABI,
                functionName: 'getMarketInfo',
                args: [id],
              });

              if (
                info.yesToken.toLowerCase() === ensRecords.yesToken?.toLowerCase() &&
                info.noToken.toLowerCase() === ensRecords.noToken?.toLowerCase()
              ) {
                legacyMarketId = id;
                break;
              }
            } catch (err) {
              continue;
            }
          }

          if (!legacyMarketId) {
            throw new Error('Market ID not found for ENS name');
          }

          marketId = legacyMarketId;
        } else {
          marketId = foundMarketId;
        }
      }

      const marketInfo = await publicClient.readContract({
        address: CONTRACTS.MARKET_FACTORY,
        abi: MARKET_FACTORY_ABI,
        functionName: 'getMarketInfo',
        args: [marketId as `0x${string}`],
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

      const [yesSupply, noSupply] = await Promise.all([
        publicClient.readContract({
          address: marketInfo.yesToken,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }),
        publicClient.readContract({
          address: marketInfo.noToken,
          abi: ERC20_ABI,
          functionName: 'totalSupply',
        }),
      ]);

      const totalSupply = yesSupply + noSupply;
      let yesPrice = 0.5;
      let noPrice = 0.5;

      if (hookMarket?.resolved) {
        yesPrice = hookMarket.outcome ? 1 : 0;
        noPrice = hookMarket.outcome ? 0 : 1;
      } else if (totalSupply > 0n) {
        yesPrice = Number(yesSupply) / Number(totalSupply);
        noPrice = Number(noSupply) / Number(totalSupply);
      }

      const totalCollateral = hookMarket?.totalCollateral || 0n;

      const marketData: MarketData = {
        marketId,
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
        yesSupply,
        noSupply,
        yesPrice,
        noPrice,
        totalVolume:
          totalCollateral > 0n
            ? `${formatEther(totalCollateral)} ETH`
            : '0 ETH',
        criteria: ensRecords?.criteria,
        ensName: marketInfo.ensName || undefined,
      };

      setMarket(marketData);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch market data')
      );
      console.error('Error fetching market:', err);
    } finally {
      setIsLoading(false);
    }
  }, [nameOrId, isConnected, publicClient]);

  useEffect(() => {
    if (isConnected && publicClient) {
      fetchMarket();
    } else {
      setMarket(null);
      setError(new Error('Please connect your wallet to fetch market data'));
    }
  }, [isConnected, publicClient, fetchMarket]);

  return {
    market,
    isLoading,
    error,
    refetch: fetchMarket,
  };
}

