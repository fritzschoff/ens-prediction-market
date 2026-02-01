'use client';

import { useState, useCallback } from 'react';
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { Address } from 'viem';
import {
  encodeSetMarketRecords,
  PartialMarketRecords,
  getTextRecord,
  MARKET_RECORD_KEYS,
} from '@hack-money/ens';

export interface RegisterENSParams {
  ensName: string;
  pool: Address;
  oracle: Address;
  expiry: number;
  criteria: string;
  yesToken: Address;
  noToken: Address;
  creator: Address;
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
  const [error, setError] = useState<Error | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<Error | null>(null);

  const {
    sendTransaction,
    data: hash,
    isPending: isWriting,
    error: sendError,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

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
          error: 'Wallet not connected',
        };
      }

      setIsSimulating(true);
      setSimulationError(null);

      try {
        const isAvailable = await checkENSAvailability(params.ensName);

        if (!isAvailable) {
          const error = new Error(
            `ENS name "${params.ensName}" is already taken`
          );
          setSimulationError(error);
          setIsSimulating(false);
          return {
            success: false,
            isNameTaken: true,
            error: error.message,
          };
        }

        const records: PartialMarketRecords = {
          pool: params.pool,
          oracle: params.oracle,
          expiry: params.expiry,
          criteria: params.criteria,
          yesToken: params.yesToken,
          noToken: params.noToken,
          creator: params.creator,
        };

        const { to, data } = encodeSetMarketRecords({
          name: params.ensName,
          records,
        });

        await publicClient.call({
          account: address,
          to,
          data,
        });

        setIsSimulating(false);
        return {
          success: true,
          isNameTaken: false,
        };
      } catch (err) {
        setIsSimulating(false);
        let errorMessage = 'ENS simulation failed';

        if (err instanceof Error) {
          if (err.message.includes('already taken')) {
            errorMessage = err.message;
          } else if (err.message.includes('unauthorized')) {
            errorMessage =
              'You do not have permission to set records on this ENS name';
          } else if (err.message.includes('rate limit')) {
            errorMessage = 'Rate limit exceeded. Please try again later.';
          } else {
            errorMessage = err.message;
          }
        }

        const error = new Error(errorMessage);
        setSimulationError(error);
        return {
          success: false,
          isNameTaken: false,
          error: errorMessage,
        };
      }
    },
    [isConnected, address, publicClient, checkENSAvailability]
  );

  const registerENS = useCallback(
    async (params: RegisterENSParams) => {
      if (!isConnected || !address) {
        setError(new Error('Wallet not connected'));
        return;
      }

      setError(null);

      try {
        const records: PartialMarketRecords = {
          pool: params.pool,
          oracle: params.oracle,
          expiry: params.expiry,
          criteria: params.criteria,
          yesToken: params.yesToken,
          noToken: params.noToken,
          creator: params.creator,
        };

        const { to, data } = encodeSetMarketRecords({
          name: params.ensName,
          records,
        });

        sendTransaction({
          to,
          data,
        });
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to register ENS');
        setError(error);
        throw error;
      }
    },
    [isConnected, address, sendTransaction]
  );

  const clearError = useCallback(() => {
    setError(null);
    setSimulationError(null);
  }, []);

  const isLoading = isWriting || isConfirming;

  return {
    registerENS,
    simulateENS,
    checkENSAvailability,
    clearError,
    hash,
    isLoading,
    isSimulating,
    isSuccess,
    error: error || sendError,
    simulationError,
    isConnected,
  };
}
