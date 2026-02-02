'use client';

import { useState, useCallback } from 'react';
import {
  useAccount,
  usePublicClient,
  useWalletClient,
} from 'wagmi';
import { Address, namehash, encodeFunctionData } from 'viem';
import {
  getTextRecord,
  MARKET_RECORD_KEYS,
  ENS_PUBLIC_RESOLVER_SEPOLIA,
} from '@hack-money/ens';

const resolverAbi = [
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    name: 'setText',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'data', type: 'bytes[]' }],
    name: 'multicall',
    outputs: [{ name: 'results', type: 'bytes[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export interface RegisterENSParams {
  ensName: string;
  pool: Address;
  oracle: Address;
  expiry: number;
  criteria: string;
  yesToken: Address;
  noToken: Address;
  creator: Address;
  marketId?: string;
}

export interface ENSSimulationResult {
  success: boolean;
  isNameTaken: boolean;
  isUnauthorized: boolean;
  error?: string;
}

export function useRegisterENS() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [error, setError] = useState<Error | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);

  const checkENSAvailability = useCallback(
    async (ensName: string): Promise<boolean> => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const existingPool = await getTextRecord(
        publicClient,
        ensName,
        MARKET_RECORD_KEYS.pool
      );

      return !existingPool;
    },
    [publicClient]
  );

  const simulateENS = useCallback(
    async (params: RegisterENSParams): Promise<ENSSimulationResult> => {
      if (!isConnected || !address || !publicClient) {
        return {
          success: false,
          isNameTaken: false,
          isUnauthorized: false,
          error: 'Wallet not connected',
        };
      }

      setIsSimulating(true);
      setSimulationError(null);

      try {
        const isAvailable = await checkENSAvailability(params.ensName);

        if (!isAvailable) {
          setIsSimulating(false);
          return {
            success: false,
            isNameTaken: true,
            isUnauthorized: false,
            error: `ENS name "${params.ensName}" is already taken`,
          };
        }

        setIsSimulating(false);
        return {
          success: true,
          isNameTaken: false,
          isUnauthorized: false,
        };
      } catch (err) {
        setIsSimulating(false);
        let errorMessage = 'ENS check failed';
        let isUnauthorized = false;

        if (err instanceof Error) {
          if (err.message.includes('already taken')) {
            errorMessage = err.message;
          } else if (
            err.message.includes('unauthorized') ||
            err.message.includes('not authorized') ||
            err.message.includes('Unauthorised')
          ) {
            isUnauthorized = true;
            errorMessage =
              'ENS registration requires owning the parent domain. Market will be created without ENS.';
          } else if (err.message.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
          } else {
            errorMessage = err.message;
          }
        }

        if (isUnauthorized) {
          return {
            success: true,
            isNameTaken: false,
            isUnauthorized: true,
            error: errorMessage,
          };
        }

        const error = new Error(errorMessage);
        setSimulationError(error);
        return {
          success: false,
          isNameTaken: false,
          isUnauthorized: false,
          error: errorMessage,
        };
      }
    },
    [isConnected, address, publicClient, checkENSAvailability]
  );

  const registerENS = useCallback(
    async (params: RegisterENSParams) => {
      if (!isConnected || !address || !walletClient || !publicClient) {
        setError(new Error('Wallet not connected'));
        return;
      }

      setError(null);
      setIsLoading(true);
      setIsSuccess(false);

      const node = namehash(params.ensName);

      const records: [string, string][] = [
        [MARKET_RECORD_KEYS.pool, params.pool],
        [MARKET_RECORD_KEYS.oracle, params.oracle],
        [MARKET_RECORD_KEYS.expiry, params.expiry.toString()],
        [MARKET_RECORD_KEYS.criteria, params.criteria],
        [MARKET_RECORD_KEYS.yesToken, params.yesToken],
        [MARKET_RECORD_KEYS.noToken, params.noToken],
        [MARKET_RECORD_KEYS.creator, params.creator],
      ];

      if (params.marketId) {
        records.push([MARKET_RECORD_KEYS.marketId, params.marketId]);
      }

      try {
        const calls = records.map(([key, value]) =>
          encodeFunctionData({
            abi: resolverAbi,
            functionName: 'setText',
            args: [node, key, value],
          })
        );

        console.log(`Setting ${records.length} ENS records via multicall...`);

        const multicallData = encodeFunctionData({
          abi: resolverAbi,
          functionName: 'multicall',
          args: [calls],
        });

        const txHash = await walletClient.sendTransaction({
          to: ENS_PUBLIC_RESOLVER_SEPOLIA,
          data: multicallData,
        });

        setHash(txHash);
        console.log('ENS multicall tx:', txHash);

        await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log('All ENS records set successfully');

        setIsSuccess(true);
        setIsLoading(false);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to register ENS');
        setError(error);
        setIsLoading(false);
        throw error;
      }
    },
    [isConnected, address, walletClient, publicClient]
  );

  const clearError = useCallback(() => {
    setError(null);
    setSimulationError(null);
  }, []);

  return {
    registerENS,
    simulateENS,
    checkENSAvailability,
    clearError,
    hash,
    isLoading,
    isSimulating,
    isSuccess,
    error,
    simulationError,
    isConnected,
  };
}
