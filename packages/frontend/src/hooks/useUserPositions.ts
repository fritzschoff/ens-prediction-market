'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { Address, formatEther } from 'viem';

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface UserPosition {
  outcome: boolean;
  amount: string;
  avgPrice: number;
  potentialWin: string;
  tokenAddress: Address;
  balance: bigint;
}

export function useUserPositions(
  yesToken: Address | undefined,
  noToken: Address | undefined,
  yesPrice: number,
  noPrice: number,
  resolved?: boolean,
  outcome?: boolean
) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!isConnected || !address || !publicClient || !yesToken || !noToken) {
      setPositions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [yesBalance, noBalance] = await Promise.all([
        publicClient.readContract({
          address: yesToken,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        }),
        publicClient.readContract({
          address: noToken,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address],
        }),
      ]);

      const positionsList: UserPosition[] = [];

      if (yesBalance > 0n) {
        const amount = formatEther(yesBalance);
        const potentialWin = resolved && outcome
          ? amount
          : (parseFloat(amount) / yesPrice).toFixed(4);

        positionsList.push({
          outcome: true,
          amount: `${amount} ETH`,
          avgPrice: yesPrice,
          potentialWin: `${potentialWin} ETH`,
          tokenAddress: yesToken,
          balance: yesBalance,
        });
      }

      if (noBalance > 0n) {
        const amount = formatEther(noBalance);
        const potentialWin = resolved && !outcome
          ? amount
          : (parseFloat(amount) / noPrice).toFixed(4);

        positionsList.push({
          outcome: false,
          amount: `${amount} ETH`,
          avgPrice: noPrice,
          potentialWin: `${potentialWin} ETH`,
          tokenAddress: noToken,
          balance: noBalance,
        });
      }

      setPositions(positionsList);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch positions')
      );
      console.error('Error fetching positions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected, publicClient, yesToken, noToken, yesPrice, noPrice, resolved, outcome]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    isLoading,
    error,
    refetch: fetchPositions,
  };
}

