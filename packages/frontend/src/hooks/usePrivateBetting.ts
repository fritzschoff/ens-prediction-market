'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from 'wagmi';
import { CONTRACTS, PREDICTION_HOOK_ABI } from '@/lib/contracts';
import {
  Address,
  keccak256,
  encodePacked,
  toHex,
  parseEther,
  decodeErrorResult,
} from 'viem';

const PRIVATE_BETTING_HOOK_ADDRESS = CONTRACTS.PRIVATE_BETTING_HOOK;
const IS_PRIVATE_HOOK_DEPLOYED =
  CONTRACTS.PRIVATE_BETTING_HOOK !==
  '0x0000000000000000000000000000000000000000';

const PRIVATE_BETTING_HOOK_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
        name: 'key',
        type: 'tuple',
      },
      { name: 'commitHash', type: 'bytes32' },
    ],
    name: 'commitBet',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
        name: 'key',
        type: 'tuple',
      },
      { name: 'outcome', type: 'bool' },
      { name: 'salt', type: 'bytes32' },
    ],
    name: 'revealBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
        name: 'key',
        type: 'tuple',
      },
      { name: 'batchId', type: 'uint256' },
    ],
    name: 'settleBatch',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
        name: 'key',
        type: 'tuple',
      },
      { name: 'bettedOutcome', type: 'bool' },
      { name: 'salt', type: 'bytes32' },
    ],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
        name: 'key',
        type: 'tuple',
      },
    ],
    name: 'getCurrentBatchId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
        name: 'key',
        type: 'tuple',
      },
      { name: 'batchId', type: 'uint256' },
    ],
    name: 'getBatchInfo',
    outputs: [
      {
        components: [
          { name: 'startTime', type: 'uint256' },
          { name: 'totalYesAmount', type: 'uint256' },
          { name: 'totalNoAmount', type: 'uint256' },
          { name: 'yesCount', type: 'uint256' },
          { name: 'noCount', type: 'uint256' },
          { name: 'settled', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
        name: 'key',
        type: 'tuple',
      },
      { name: 'user', type: 'address' },
    ],
    name: 'getCommitment',
    outputs: [
      {
        components: [
          { name: 'commitHash', type: 'bytes32' },
          { name: 'amount', type: 'uint256' },
          { name: 'batchId', type: 'uint256' },
          { name: 'revealed', type: 'bool' },
          { name: 'executed', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'currency0', type: 'address' },
          { name: 'currency1', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'tickSpacing', type: 'int24' },
          { name: 'hooks', type: 'address' },
        ],
        name: 'key',
        type: 'tuple',
      },
    ],
    name: 'getMarket',
    outputs: [
      {
        components: [
          { name: 'yesToken', type: 'address' },
          { name: 'noToken', type: 'address' },
          { name: 'oracle', type: 'address' },
          { name: 'expiry', type: 'uint256' },
          { name: 'resolved', type: 'bool' },
          { name: 'outcome', type: 'bool' },
          { name: 'currentBatchId', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'outcome', type: 'bool' },
      { name: 'salt', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
    name: 'generateCommitHash',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'BATCH_DURATION',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'REVEAL_WINDOW',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'MarketNotInitialized', type: 'error' },
  { inputs: [], name: 'MarketExpired', type: 'error' },
  { inputs: [], name: 'MarketNotExpired', type: 'error' },
  { inputs: [], name: 'MarketAlreadyResolved', type: 'error' },
  { inputs: [], name: 'MarketNotResolved', type: 'error' },
  { inputs: [], name: 'OnlyOracle', type: 'error' },
  { inputs: [], name: 'InvalidExpiry', type: 'error' },
  { inputs: [], name: 'CommitmentAlreadyExists', type: 'error' },
  { inputs: [], name: 'NoCommitment', type: 'error' },
  { inputs: [], name: 'AlreadyRevealed', type: 'error' },
  { inputs: [], name: 'RevealWindowNotOpen', type: 'error' },
  { inputs: [], name: 'RevealWindowClosed', type: 'error' },
  { inputs: [], name: 'InvalidReveal', type: 'error' },
  { inputs: [], name: 'BatchNotSettled', type: 'error' },
  { inputs: [], name: 'AlreadyExecuted', type: 'error' },
  { inputs: [], name: 'NoWinnings', type: 'error' },
  { inputs: [], name: 'InsufficientAmount', type: 'error' },
] as const;

export interface PoolKey {
  currency0: Address;
  currency1: Address;
  fee: number;
  tickSpacing: number;
  hooks: Address;
}

export interface BatchInfo {
  startTime: bigint;
  totalYesAmount: bigint;
  totalNoAmount: bigint;
  yesCount: bigint;
  noCount: bigint;
  settled: boolean;
}

export interface Commitment {
  commitHash: `0x${string}`;
  amount: bigint;
  batchId: bigint;
  revealed: boolean;
  executed: boolean;
}

export interface PrivateMarket {
  yesToken: Address;
  noToken: Address;
  oracle: Address;
  expiry: bigint;
  resolved: boolean;
  outcome: boolean;
  currentBatchId: bigint;
}

const BATCH_DURATION = 5 * 60;
const REVEAL_WINDOW = 10 * 60;

const STORAGE_KEY_PREFIX = 'private_bet_';

interface StoredBetData {
  salt: `0x${string}`;
  outcome: boolean;
  amount: string;
  timestamp: number;
}

function getStorageKey(poolId: string, address: string): string {
  return `${STORAGE_KEY_PREFIX}${poolId}_${address.toLowerCase()}`;
}

function saveBetData(
  poolId: string,
  address: string,
  data: StoredBetData
): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(getStorageKey(poolId, address), JSON.stringify(data));
  }
}

function loadBetData(poolId: string, address: string): StoredBetData | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(getStorageKey(poolId, address));
  if (!stored) return null;
  try {
    return JSON.parse(stored) as StoredBetData;
  } catch {
    return null;
  }
}

function clearBetData(poolId: string, address: string): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(getStorageKey(poolId, address));
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  MarketNotInitialized:
    'This market has not been initialized for private betting. The market creator needs to initialize it first.',
  MarketExpired: 'This market has expired.',
  MarketNotExpired: 'Market has not expired yet.',
  MarketAlreadyResolved: 'This market has already been resolved.',
  MarketNotResolved: 'This market has not been resolved yet.',
  OnlyOracle: 'Only the oracle can perform this action.',
  InvalidExpiry: 'Invalid expiry time.',
  CommitmentAlreadyExists:
    'You already have an active commitment. Please reveal or wait for it to settle first.',
  NoCommitment: 'No commitment found.',
  AlreadyRevealed: 'Bet has already been revealed.',
  RevealWindowNotOpen: 'Reveal window is not open yet.',
  RevealWindowClosed: 'Reveal window has closed.',
  InvalidReveal: 'Invalid reveal - hash does not match commitment.',
  BatchNotSettled: 'Batch has not been settled yet.',
  AlreadyExecuted: 'Winnings have already been claimed.',
  NoWinnings: 'No winnings to claim.',
  InsufficientAmount: 'Amount must be greater than zero.',
};

function parseContractError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'An unknown error occurred';
  }

  const cause = (err as any).cause;
  const data = cause?.data || cause?.error?.data || cause?.reason?.data;

  if (data && typeof data === 'string' && data.startsWith('0x')) {
    try {
      const decoded = decodeErrorResult({
        abi: PRIVATE_BETTING_HOOK_ABI,
        data: data as `0x${string}`,
      });
      if (decoded.errorName && ERROR_MESSAGES[decoded.errorName]) {
        return ERROR_MESSAGES[decoded.errorName];
      }
      return `Contract error: ${decoded.errorName || 'Unknown'}`;
    } catch {}
  }

  const message = err.message || cause?.message || cause?.shortMessage || '';

  if (message.includes('User rejected') || message.includes('user rejected')) {
    return 'Transaction was rejected';
  }

  if (
    message.includes('insufficient allowance') ||
    message.includes('ERC20InsufficientAllowance')
  ) {
    return 'Insufficient token allowance. Please approve the contract to spend your tokens first.';
  }

  if (
    message.includes('insufficient balance') ||
    message.includes('ERC20InsufficientBalance')
  ) {
    return 'Insufficient token balance.';
  }

  if (message.includes('execution reverted')) {
    const match = message.match(/execution reverted:?\s*(.+)/i);
    if (match && match[1]) {
      const revertReason = match[1].trim();
      if (revertReason.startsWith('0x')) {
        try {
          const decoded = decodeErrorResult({
            abi: PRIVATE_BETTING_HOOK_ABI,
            data: revertReason as `0x${string}`,
          });
          if (decoded.errorName && ERROR_MESSAGES[decoded.errorName]) {
            return ERROR_MESSAGES[decoded.errorName];
          }
        } catch {}
      } else {
        return revertReason;
      }
    }
  }

  if (cause?.shortMessage) {
    return cause.shortMessage;
  }

  if (message) {
    return message;
  }

  return 'Transaction failed. Please check your token balance and allowance.';
}

function generateSalt(): `0x${string}` {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return toHex(randomBytes);
}

function generateCommitHash(
  outcome: boolean,
  salt: `0x${string}`,
  userAddress: Address
): `0x${string}` {
  return keccak256(
    encodePacked(['bool', 'bytes32', 'address'], [outcome, salt, userAddress])
  );
}

export function usePrivateBetting(poolKey: PoolKey | undefined) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [batchInfo, setBatchInfo] = useState<BatchInfo | null>(null);
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [market, setMarket] = useState<PrivateMarket | null>(null);
  const [storedBetData, setStoredBetData] = useState<StoredBetData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const poolId = poolKey
    ? keccak256(
        encodePacked(
          ['address', 'address', 'uint24', 'int24', 'address'],
          [
            poolKey.currency0,
            poolKey.currency1,
            poolKey.fee,
            poolKey.tickSpacing,
            poolKey.hooks,
          ]
        )
      )
    : null;

  const {
    writeContract: writeCommit,
    data: commitTxHash,
    isPending: isCommitPending,
    error: commitWriteError,
    reset: resetCommit,
  } = useWriteContract();

  const {
    writeContract: writeReveal,
    data: revealTxHash,
    isPending: isRevealPending,
    error: revealWriteError,
    reset: resetReveal,
  } = useWriteContract();

  const {
    writeContract: writeClaim,
    data: claimTxHash,
    isPending: isClaimPending,
    error: claimWriteError,
    reset: resetClaim,
  } = useWriteContract();

  const { isLoading: isCommitConfirming, isSuccess: isCommitSuccess } =
    useWaitForTransactionReceipt({ hash: commitTxHash });

  const { isLoading: isRevealConfirming, isSuccess: isRevealSuccess } =
    useWaitForTransactionReceipt({ hash: revealTxHash });

  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } =
    useWaitForTransactionReceipt({ hash: claimTxHash });

  useEffect(() => {
    if (poolId && address) {
      const data = loadBetData(poolId, address);
      setStoredBetData(data);
    }
  }, [poolId, address]);

  const fetchBatchInfo = useCallback(async () => {
    if (!publicClient || !poolKey || !address || !IS_PRIVATE_HOOK_DEPLOYED)
      return;

    try {
      const currentBatchId = await publicClient.readContract({
        address: PRIVATE_BETTING_HOOK_ADDRESS,
        abi: PRIVATE_BETTING_HOOK_ABI,
        functionName: 'getCurrentBatchId',
        args: [poolKey],
      });

      const batch = await publicClient.readContract({
        address: PRIVATE_BETTING_HOOK_ADDRESS,
        abi: PRIVATE_BETTING_HOOK_ABI,
        functionName: 'getBatchInfo',
        args: [poolKey, currentBatchId],
      });

      setBatchInfo(batch as BatchInfo);
    } catch (err) {
      console.error('Failed to fetch batch info:', err);
    }
  }, [publicClient, poolKey, address]);

  const fetchCommitment = useCallback(async () => {
    if (!publicClient || !poolKey || !address || !IS_PRIVATE_HOOK_DEPLOYED)
      return;

    try {
      const commit = await publicClient.readContract({
        address: PRIVATE_BETTING_HOOK_ADDRESS,
        abi: PRIVATE_BETTING_HOOK_ABI,
        functionName: 'getCommitment',
        args: [poolKey, address],
      });

      if (
        commit &&
        (commit as Commitment).commitHash !==
          '0x0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        setCommitment(commit as Commitment);
      } else {
        setCommitment(null);
      }
    } catch (err) {
      console.error('Failed to fetch commitment:', err);
    }
  }, [publicClient, poolKey, address]);

  const fetchMarket = useCallback(async () => {
    if (!publicClient || !poolKey || !IS_PRIVATE_HOOK_DEPLOYED) return;

    try {
      const mkt = await publicClient.readContract({
        address: PRIVATE_BETTING_HOOK_ADDRESS,
        abi: PRIVATE_BETTING_HOOK_ABI,
        functionName: 'getMarket',
        args: [poolKey],
      });

      const privateMarket = mkt as PrivateMarket;

      if (
        privateMarket.yesToken === '0x0000000000000000000000000000000000000000'
      ) {
        try {
          const regularMarket = await publicClient.readContract({
            address: CONTRACTS.PREDICTION_HOOK,
            abi: PREDICTION_HOOK_ABI,
            functionName: 'getMarket',
            args: [poolKey],
          });

          if (
            regularMarket &&
            regularMarket.yesToken !==
              '0x0000000000000000000000000000000000000000'
          ) {
            setMarket({
              yesToken: regularMarket.yesToken,
              noToken: regularMarket.noToken,
              oracle: regularMarket.oracle,
              expiry: regularMarket.expiry,
              resolved: regularMarket.resolved,
              outcome: regularMarket.outcome,
              currentBatchId: 0n,
            });
            return;
          }
        } catch (err) {
          console.warn('Failed to fetch regular market data:', err);
        }
      }

      setMarket(privateMarket);
    } catch (err) {
      console.error('Failed to fetch market:', err);
    }
  }, [publicClient, poolKey]);

  useEffect(() => {
    if (isConnected && publicClient && poolKey) {
      fetchBatchInfo();
      fetchCommitment();
      fetchMarket();
    }
  }, [
    isConnected,
    publicClient,
    poolKey,
    fetchBatchInfo,
    fetchCommitment,
    fetchMarket,
  ]);

  useEffect(() => {
    if (isCommitSuccess || isRevealSuccess || isClaimSuccess) {
      fetchBatchInfo();
      fetchCommitment();
      fetchMarket();
    }
  }, [
    isCommitSuccess,
    isRevealSuccess,
    isClaimSuccess,
    fetchBatchInfo,
    fetchCommitment,
    fetchMarket,
  ]);

  const commitBet = useCallback(
    async (amountEth: string, outcome: boolean) => {
      if (!isConnected || !address || !publicClient || !poolKey || !poolId) {
        throw new Error('Wallet not connected or market not loaded');
      }

      if (!IS_PRIVATE_HOOK_DEPLOYED) {
        const salt = generateSalt();
        const commitHash = generateCommitHash(outcome, salt, address);
        saveBetData(poolId, address, {
          salt,
          outcome,
          amount: amountEth,
          timestamp: Date.now(),
        });
        setStoredBetData({
          salt,
          outcome,
          amount: amountEth,
          timestamp: Date.now(),
        });
        return { commitHash, salt, outcome };
      }

      setError(null);

      const amount = parseEther(amountEth);
      if (amount <= 0n) {
        const error = new Error('Amount must be greater than 0');
        setError(error);
        throw error;
      }

      try {
        const salt = generateSalt();
        const commitHash = generateCommitHash(outcome, salt, address);

        saveBetData(poolId, address, {
          salt,
          outcome,
          amount: amountEth,
          timestamp: Date.now(),
        });
        setStoredBetData({
          salt,
          outcome,
          amount: amountEth,
          timestamp: Date.now(),
        });

        try {
          await publicClient.simulateContract({
            address: PRIVATE_BETTING_HOOK_ADDRESS,
            abi: PRIVATE_BETTING_HOOK_ABI,
            functionName: 'commitBet',
            args: [poolKey, commitHash],
            value: amount,
            account: address,
          });
        } catch (simErr) {
          const errorMessage = parseContractError(simErr);
          const error = new Error(errorMessage);
          setError(error);
          throw error;
        }

        writeCommit({
          address: PRIVATE_BETTING_HOOK_ADDRESS,
          abi: PRIVATE_BETTING_HOOK_ABI,
          functionName: 'commitBet',
          args: [poolKey, commitHash],
          value: amount,
        });

        return { commitHash, salt, outcome };
      } catch (err) {
        if (err instanceof Error && err.message) {
          throw err;
        }
        const errorMessage = parseContractError(err);
        const error = new Error(errorMessage);
        setError(error);
        throw error;
      }
    },
    [isConnected, address, publicClient, poolKey, poolId, writeCommit]
  );

  const revealBet = useCallback(async () => {
    if (!isConnected || !address || !publicClient || !poolKey || !poolId) {
      throw new Error('Wallet not connected or market not loaded');
    }

    const betData = storedBetData || loadBetData(poolId, address);
    if (!betData) {
      const error = new Error(
        'No stored bet data found. Did you commit from this browser?'
      );
      setError(error);
      throw error;
    }

    if (!IS_PRIVATE_HOOK_DEPLOYED) {
      return;
    }

    setError(null);

    try {
      await publicClient.simulateContract({
        address: PRIVATE_BETTING_HOOK_ADDRESS,
        abi: PRIVATE_BETTING_HOOK_ABI,
        functionName: 'revealBet',
        args: [poolKey, betData.outcome, betData.salt],
        account: address,
      });

      writeReveal({
        address: PRIVATE_BETTING_HOOK_ADDRESS,
        abi: PRIVATE_BETTING_HOOK_ABI,
        functionName: 'revealBet',
        args: [poolKey, betData.outcome, betData.salt],
      });
    } catch (err) {
      const errorMessage = parseContractError(err);
      const error = new Error(errorMessage);
      setError(error);
      throw error;
    }
  }, [
    isConnected,
    address,
    publicClient,
    poolKey,
    poolId,
    storedBetData,
    writeReveal,
  ]);

  const claimWinnings = useCallback(async () => {
    if (!isConnected || !address || !publicClient || !poolKey || !poolId) {
      throw new Error('Wallet not connected or market not loaded');
    }

    const betData = storedBetData || loadBetData(poolId, address);
    if (!betData) {
      const error = new Error('No stored bet data found.');
      setError(error);
      throw error;
    }

    if (!IS_PRIVATE_HOOK_DEPLOYED) {
      clearBetData(poolId, address);
      return;
    }

    setError(null);

    try {
      await publicClient.simulateContract({
        address: PRIVATE_BETTING_HOOK_ADDRESS,
        abi: PRIVATE_BETTING_HOOK_ABI,
        functionName: 'claimWinnings',
        args: [poolKey, betData.outcome, betData.salt],
        account: address,
      });

      writeClaim({
        address: PRIVATE_BETTING_HOOK_ADDRESS,
        abi: PRIVATE_BETTING_HOOK_ABI,
        functionName: 'claimWinnings',
        args: [poolKey, betData.outcome, betData.salt],
      });

      clearBetData(poolId, address);
    } catch (err) {
      const errorMessage = parseContractError(err);
      const error = new Error(errorMessage);
      setError(error);
      throw error;
    }
  }, [
    isConnected,
    address,
    publicClient,
    poolKey,
    poolId,
    storedBetData,
    writeClaim,
  ]);

  const clearErrors = useCallback(() => {
    setError(null);
    resetCommit();
    resetReveal();
    resetClaim();
  }, [resetCommit, resetReveal, resetClaim]);

  const getPhase = useCallback((): 'commit' | 'reveal' | 'settled' => {
    if (!batchInfo) return 'commit';

    const now = BigInt(Math.floor(Date.now() / 1000));
    const batchEnd = batchInfo.startTime + BigInt(BATCH_DURATION);
    const revealEnd = batchEnd + BigInt(REVEAL_WINDOW);

    if (now < batchEnd) return 'commit';
    if (now < revealEnd) return 'reveal';
    return 'settled';
  }, [batchInfo]);

  const getTimeRemaining = useCallback((): number => {
    if (!batchInfo) return 0;

    const now = Math.floor(Date.now() / 1000);
    const batchEnd = Number(batchInfo.startTime) + BATCH_DURATION;
    const revealEnd = batchEnd + REVEAL_WINDOW;

    const phase = getPhase();
    if (phase === 'commit') return Math.max(0, batchEnd - now);
    if (phase === 'reveal') return Math.max(0, revealEnd - now);
    return 0;
  }, [batchInfo, getPhase]);

  return {
    commitBet,
    revealBet,
    claimWinnings,
    clearErrors,
    refetch: () => {
      fetchBatchInfo();
      fetchCommitment();
      fetchMarket();
    },
    batchInfo,
    commitment,
    market,
    storedBetData,
    getPhase,
    getTimeRemaining,
    isCommitting: isCommitPending || isCommitConfirming,
    isRevealing: isRevealPending || isRevealConfirming,
    isClaiming: isClaimPending || isClaimConfirming,
    isCommitSuccess,
    isRevealSuccess,
    isClaimSuccess,
    commitTxHash,
    revealTxHash,
    claimTxHash,
    error: error || commitWriteError || revealWriteError || claimWriteError,
    isConnected,
    isContractDeployed: IS_PRIVATE_HOOK_DEPLOYED,
    BATCH_DURATION,
    REVEAL_WINDOW,
  };
}
