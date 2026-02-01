'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { CONTRACTS, MARKET_FACTORY_ABI } from '@/lib/contracts';
import { Address, decodeEventLog, decodeErrorResult } from 'viem';

interface CreateMarketParams {
  question: string;
  oracle: Address;
  expiry: number;
}

export interface MarketCreatedResult {
  marketId: `0x${string}`;
  yesToken: Address;
  noToken: Address;
  oracle: Address;
  expiry: bigint;
  creator: Address;
}

const MARKET_DEPLOYED_EVENT_ABI = {
  anonymous: false,
  inputs: [
    { indexed: true, name: 'marketId', type: 'bytes32' },
    { indexed: false, name: 'yesToken', type: 'address' },
    { indexed: false, name: 'noToken', type: 'address' },
    { indexed: false, name: 'question', type: 'string' },
    { indexed: false, name: 'oracle', type: 'address' },
    { indexed: false, name: 'expiry', type: 'uint256' },
    { indexed: false, name: 'creator', type: 'address' },
  ],
  name: 'MarketDeployed',
  type: 'event',
} as const;

export function useCreateMarket() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [marketId, setMarketId] = useState<`0x${string}` | null>(null);
  const [marketResult, setMarketResult] = useState<MarketCreatedResult | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [simulationError, setSimulationError] = useState<Error | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const {
    writeContract,
    data: hash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (receipt && publicClient) {
      try {
        const log = receipt.logs.find((log) => {
          try {
            const decoded = decodeEventLog({
              abi: [MARKET_DEPLOYED_EVENT_ABI],
              data: log.data,
              topics: log.topics,
            });
            return decoded.eventName === 'MarketDeployed';
          } catch {
            return false;
          }
        });

        if (log) {
          const decoded = decodeEventLog({
            abi: [MARKET_DEPLOYED_EVENT_ABI],
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === 'MarketDeployed') {
            const args = decoded.args as {
              marketId: `0x${string}`;
              yesToken: Address;
              noToken: Address;
              oracle: Address;
              expiry: bigint;
              creator: Address;
            };
            setMarketId(args.marketId);
            setMarketResult({
              marketId: args.marketId,
              yesToken: args.yesToken,
              noToken: args.noToken,
              oracle: args.oracle,
              expiry: args.expiry,
              creator: args.creator,
            });
          }
        }
      } catch (err) {
        console.error('Failed to extract marketId from receipt:', err);
      }
    }
  }, [receipt, publicClient]);

  const simulateCreateMarket = useCallback(
    async (params: CreateMarketParams) => {
      if (!isConnected || !address || !publicClient) {
        const error = new Error('Wallet not connected');
        setSimulationError(error);
        setIsSimulating(false);
        throw error;
      }

      setSimulationError(null);
      setIsSimulating(true);

      try {
        const args = [
          {
            question: params.question,
            oracle: params.oracle,
            expiry: BigInt(params.expiry),
          },
        ] as const;

        const result = await publicClient.simulateContract({
          address: CONTRACTS.MARKET_FACTORY,
          abi: MARKET_FACTORY_ABI,
          functionName: 'createMarket',
          args,
          account: address,
        });

        setIsSimulating(false);
        return {
          success: true,
          result,
          gas: result.request.gas,
        };
      } catch (err) {
        setIsSimulating(false);
        let errorMessage = 'Simulation failed';

        const errorMessages: Record<string, string> = {
          InvalidOracle:
            'Invalid oracle address. Oracle cannot be zero address.',
          InvalidExpiry: 'Invalid expiry time. Expiry must be in the future.',
          EmptyQuestion:
            'Question cannot be empty. Please provide a question for the market.',
        };

        try {
          if (err instanceof Error) {
            const cause = err.cause as any;
            const data = cause?.data || cause?.error?.data;

            if (data) {
              try {
                const decoded = decodeErrorResult({
                  abi: MARKET_FACTORY_ABI,
                  data: data as `0x${string}`,
                });

                if (decoded.errorName && errorMessages[decoded.errorName]) {
                  errorMessage = errorMessages[decoded.errorName];
                } else {
                  errorMessage = `Contract error: ${
                    decoded.errorName || 'Unknown error'
                  }`;
                }
              } catch {
                if (typeof data === 'string' && data.startsWith('0x')) {
                  const errorSelector = data.slice(0, 10).toLowerCase();
                  const selectorMap: Record<string, string> = {
                    '0x9589a27d': 'InvalidOracle',
                    '0x72b13ad8': 'InvalidExpiry',
                    '0x6d705ebb': 'EmptyQuestion',
                  };

                  const errorName = selectorMap[errorSelector];
                  if (errorName && errorMessages[errorName]) {
                    errorMessage = errorMessages[errorName];
                  } else {
                    errorMessage = `Contract error (${errorSelector})`;
                  }
                }
              }
            }

            if (errorMessage === 'Simulation failed' && err.message) {
              errorMessage = err.message;
              if (cause?.reason) {
                errorMessage = `${errorMessage}: ${cause.reason}`;
              }
              if (
                cause?.shortMessage &&
                !errorMessage.includes(cause.shortMessage)
              ) {
                errorMessage = cause.shortMessage;
              }
            }
          } else if (typeof err === 'object' && err !== null) {
            const errObj = err as any;
            if (errObj.shortMessage) {
              errorMessage = errObj.shortMessage;
            } else if (errObj.message) {
              errorMessage = errObj.message;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error:', parseError);
        }

        const error = new Error(errorMessage);
        setSimulationError(error);
        throw error;
      }
    },
    [isConnected, address, publicClient]
  );

  const createMarket = useCallback(
    async (params: CreateMarketParams, simulationGas?: bigint) => {
      if (!isConnected || !address || !publicClient) {
        setError(new Error('Wallet not connected'));
        return;
      }

      setError(null);
      setMarketId(null);

      try {
        const args = [
          {
            question: params.question,
            oracle: params.oracle,
            expiry: BigInt(params.expiry),
          },
        ] as const;

        let gas: bigint | undefined = simulationGas
          ? (simulationGas * BigInt(120)) / BigInt(100)
          : undefined;
        if (!gas) {
          try {
            const estimatedGas = await publicClient.estimateContractGas({
              address: CONTRACTS.MARKET_FACTORY,
              abi: MARKET_FACTORY_ABI,
              functionName: 'createMarket',
              args,
              account: address,
            });
            gas = (estimatedGas * BigInt(120)) / BigInt(100);
            setGasEstimate(gas);
          } catch (estimateError) {
            console.warn(
              'Gas estimation failed, using default:',
              estimateError
            );
            gas = BigInt(5000000);
          }
        } else {
          setGasEstimate(gas);
        }

        writeContract({
          address: CONTRACTS.MARKET_FACTORY,
          abi: MARKET_FACTORY_ABI,
          functionName: 'createMarket',
          args,
          gas,
        });
      } catch (err) {
        let errorMessage = 'Failed to create market';

        const errorMessages: Record<string, string> = {
          InvalidOracle:
            'Invalid oracle address. Oracle cannot be zero address.',
          InvalidExpiry: 'Invalid expiry time. Expiry must be in the future.',
          EmptyQuestion:
            'Question cannot be empty. Please provide a question for the market.',
        };

        try {
          if (err instanceof Error) {
            const cause = err.cause as any;
            const data = cause?.data || cause?.error?.data;

            if (data) {
              try {
                const decoded = decodeErrorResult({
                  abi: MARKET_FACTORY_ABI,
                  data: data as `0x${string}`,
                });

                if (decoded.errorName && errorMessages[decoded.errorName]) {
                  errorMessage = errorMessages[decoded.errorName];
                } else {
                  errorMessage = `Contract error: ${
                    decoded.errorName || 'Unknown error'
                  }`;
                }
              } catch {
                if (typeof data === 'string' && data.startsWith('0x')) {
                  const errorSelector = data.slice(0, 10).toLowerCase();
                  const selectorMap: Record<string, string> = {
                    '0x9589a27d': 'InvalidOracle',
                    '0x72b13ad8': 'InvalidExpiry',
                    '0x6d705ebb': 'EmptyQuestion',
                  };

                  const errorName = selectorMap[errorSelector];
                  if (errorName && errorMessages[errorName]) {
                    errorMessage = errorMessages[errorName];
                  } else {
                    errorMessage = `Contract error (${errorSelector})`;
                  }
                }
              }
            }

            if (errorMessage === 'Failed to create market' && err.message) {
              errorMessage = err.message;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error:', parseError);
        }

        const error = new Error(errorMessage);
        setError(error);
        throw error;
      }
    },
    [isConnected, address, writeContract, publicClient]
  );

  const clearError = useCallback(() => {
    setError(null);
    setSimulationError(null);
  }, []);

  const isLoading = isWriting || isConfirming;

  return {
    createMarket,
    simulateCreateMarket,
    clearError,
    marketId,
    marketResult,
    hash,
    isLoading,
    isSimulating,
    isSuccess,
    error: error || writeError || simulationError,
    simulationError,
    isConnected,
  };
}
