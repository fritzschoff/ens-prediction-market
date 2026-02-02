'use client';

import { useState, useCallback } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { CONTRACTS, PREDICTION_HOOK_ABI } from '@/lib/contracts';
import { Address, parseEther, decodeErrorResult } from 'viem';

export interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

interface BetActionsState {
  isMinting: boolean;
  isClaiming: boolean;
  mintHash: `0x${string}` | undefined;
  claimHash: `0x${string}` | undefined;
  mintError: Error | null;
  claimError: Error | null;
}

const ERROR_MESSAGES: Record<string, string> = {
  MarketExpired: 'This market has expired and no longer accepts bets.',
  MarketNotExpired: 'Market has not expired yet.',
  MarketAlreadyResolved: 'This market has already been resolved.',
  MarketNotResolved: 'This market has not been resolved yet.',
  OnlyOracle: 'Only the oracle can resolve this market.',
  InvalidExpiry: 'Invalid expiry time.',
  NoWinnings: 'You have no winnings to claim.',
  MarketNotInitialized: 'Market has not been initialized.',
  InvalidAmount: 'Invalid amount. Please enter a valid amount.',
  TransferFailed: 'Transfer failed. Please try again.',
};

function parseContractError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'An unknown error occurred';
  }

  const cause = (err as any).cause;
  const data = cause?.data || cause?.error?.data;

  if (data && typeof data === 'string' && data.startsWith('0x')) {
    try {
      const decoded = decodeErrorResult({
        abi: PREDICTION_HOOK_ABI,
        data: data as `0x${string}`,
      });
      if (decoded.errorName && ERROR_MESSAGES[decoded.errorName]) {
        return ERROR_MESSAGES[decoded.errorName];
      }
      return `Contract error: ${decoded.errorName || 'Unknown'}`;
    } catch {
      const errorSelector = data.slice(0, 10).toLowerCase();
      const selectorMap: Record<string, string> = {
        '0x03e49696': 'MarketExpired',
        '0x085de625': 'MarketNotExpired',
        '0x5c94f51c': 'MarketAlreadyResolved',
        '0x47b56d4f': 'MarketNotResolved',
        '0x6d5769be': 'OnlyOracle',
        '0x72b13ad8': 'InvalidExpiry',
        '0x6e93657a': 'NoWinnings',
        '0xbf37b20e': 'MarketNotInitialized',
        '0x2c5211c6': 'InvalidAmount',
        '0x90b8ec18': 'TransferFailed',
      };
      const errorName = selectorMap[errorSelector];
      if (errorName && ERROR_MESSAGES[errorName]) {
        return ERROR_MESSAGES[errorName];
      }
    }
  }

  if (cause?.shortMessage) {
    return cause.shortMessage;
  }

  if (err.message.includes('User rejected')) {
    return 'Transaction was rejected';
  }

  return err.message || 'Transaction failed';
}

export function useBetActions(poolKey: PoolKey | undefined) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [state, setState] = useState<BetActionsState>({
    isMinting: false,
    isClaiming: false,
    mintHash: undefined,
    claimHash: undefined,
    mintError: null,
    claimError: null,
  });

  const {
    writeContract: writeMint,
    data: mintTxHash,
    isPending: isMintPending,
    error: mintWriteError,
    reset: resetMint,
  } = useWriteContract();

  const {
    writeContract: writeClaim,
    data: claimTxHash,
    isPending: isClaimPending,
    error: claimWriteError,
    reset: resetClaim,
  } = useWriteContract();

  const {
    isLoading: isMintConfirming,
    isSuccess: isMintSuccess,
  } = useWaitForTransactionReceipt({
    hash: mintTxHash,
  });

  const {
    isLoading: isClaimConfirming,
    isSuccess: isClaimSuccess,
  } = useWaitForTransactionReceipt({
    hash: claimTxHash,
  });

  const mintPosition = useCallback(
    async (amountEth: string) => {
      if (!isConnected || !address || !publicClient || !poolKey) {
        throw new Error('Wallet not connected or market not loaded');
      }

      setState((prev) => ({ ...prev, mintError: null }));

      const value = parseEther(amountEth);
      if (value <= 0n) {
        const error = new Error('Amount must be greater than 0');
        setState((prev) => ({ ...prev, mintError: error }));
        throw error;
      }

      try {
        const poolKeyArg = {
          currency0: poolKey.currency0,
          currency1: poolKey.currency1,
          fee: poolKey.fee,
          tickSpacing: poolKey.tickSpacing,
          hooks: poolKey.hooks,
        };

        await publicClient.simulateContract({
          address: CONTRACTS.PREDICTION_HOOK,
          abi: PREDICTION_HOOK_ABI,
          functionName: 'mintPosition',
          args: [poolKeyArg],
          value,
          account: address,
        });

        writeMint({
          address: CONTRACTS.PREDICTION_HOOK,
          abi: PREDICTION_HOOK_ABI,
          functionName: 'mintPosition',
          args: [poolKeyArg],
          value,
        });

        setState((prev) => ({ ...prev, mintHash: mintTxHash }));
      } catch (err) {
        const errorMessage = parseContractError(err);
        const error = new Error(errorMessage);
        setState((prev) => ({ ...prev, mintError: error }));
        throw error;
      }
    },
    [isConnected, address, publicClient, poolKey, writeMint, mintTxHash]
  );

  const claimWinnings = useCallback(async () => {
    if (!isConnected || !address || !publicClient || !poolKey) {
      throw new Error('Wallet not connected or market not loaded');
    }

    setState((prev) => ({ ...prev, claimError: null }));

    try {
      const poolKeyArg = {
        currency0: poolKey.currency0,
        currency1: poolKey.currency1,
        fee: poolKey.fee,
        tickSpacing: poolKey.tickSpacing,
        hooks: poolKey.hooks,
      };

      await publicClient.simulateContract({
        address: CONTRACTS.PREDICTION_HOOK,
        abi: PREDICTION_HOOK_ABI,
        functionName: 'claimWinnings',
        args: [poolKeyArg],
        account: address,
      });

      writeClaim({
        address: CONTRACTS.PREDICTION_HOOK,
        abi: PREDICTION_HOOK_ABI,
        functionName: 'claimWinnings',
        args: [poolKeyArg],
      });

      setState((prev) => ({ ...prev, claimHash: claimTxHash }));
    } catch (err) {
      const errorMessage = parseContractError(err);
      const error = new Error(errorMessage);
      setState((prev) => ({ ...prev, claimError: error }));
      throw error;
    }
  }, [isConnected, address, publicClient, poolKey, writeClaim, claimTxHash]);

  const clearErrors = useCallback(() => {
    setState((prev) => ({ ...prev, mintError: null, claimError: null }));
    resetMint();
    resetClaim();
  }, [resetMint, resetClaim]);

  return {
    mintPosition,
    claimWinnings,
    clearErrors,
    isMinting: isMintPending || isMintConfirming,
    isClaiming: isClaimPending || isClaimConfirming,
    isMintSuccess,
    isClaimSuccess,
    mintHash: mintTxHash,
    claimHash: claimTxHash,
    mintError: state.mintError || mintWriteError,
    claimError: state.claimError || claimWriteError,
    isConnected,
  };
}

