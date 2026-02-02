import { useState, useCallback } from 'react';
import {
  createWalletClient,
  createPublicClient,
  http,
  fallback,
  namehash,
  labelhash,
  parseAbi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { usePublicClient } from 'wagmi';

const PREDICT_ETH_OWNER_KEY =
  '0xb02c9f8459885633b47bfff51afccfdd42b433213d592c0fcce3900f7e32a29e';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const PUBLIC_RESOLVER_SEPOLIA = '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD';
const PREDICT_ETH_PARENT = 'predict.eth';

const sepoliaRpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

function getSepoliaTransport() {
  const rpcs = [
    sepoliaRpcUrl,
    'https://rpc.sepolia.org',
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.drpc.org',
  ].filter(Boolean) as string[];

  return fallback(
    rpcs.map((url, i) =>
      http(url, { batch: true, retryCount: 1, retryDelay: i === 0 ? 300 : 500 })
    )
  );
}

const ensRegistryAbi = parseAbi([
  'function setSubnodeRecord(bytes32 node, bytes32 label, address owner, address resolver, uint64 ttl) external',
  'function owner(bytes32 node) view returns (address)',
]);

export interface ClaimSubdomainParams {
  label: string;
  newOwner: `0x${string}`;
}

export interface ClaimSubdomainResult {
  success: boolean;
  subdomain?: string;
  node?: `0x${string}`;
  txHash?: `0x${string}`;
  blockNumber?: bigint;
  error?: string;
}

export interface ClaimSubdomainProgress {
  stage: 'preparing' | 'creating' | 'tx-sent' | 'confirming' | 'complete';
  subdomain?: string;
  newOwner?: `0x${string}`;
  txHash?: `0x${string}`;
  blockNumber?: bigint;
}

export function useClaimSubdomain() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<ClaimSubdomainProgress | null>(null);
  const wagmiPublicClient = usePublicClient();

  const checkSubdomainAvailability = useCallback(
    async (label: string): Promise<boolean> => {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: getSepoliaTransport(),
      });

      const subdomainNode = namehash(`${label}.${PREDICT_ETH_PARENT}`);

      try {
        const owner = await publicClient.readContract({
          address: ENS_REGISTRY,
          abi: ensRegistryAbi,
          functionName: 'owner',
          args: [subdomainNode],
        });

        return owner === '0x0000000000000000000000000000000000000000';
      } catch {
        return true;
      }
    },
    []
  );

  const claimSubdomain = useCallback(
    async (params: ClaimSubdomainParams): Promise<ClaimSubdomainResult> => {
      setIsLoading(true);
      setError(null);
      setProgress({ stage: 'preparing' });

      try {
        const isAvailable = await checkSubdomainAvailability(params.label);
        if (!isAvailable) {
          const error = new Error(
            `Subdomain "${params.label}.${PREDICT_ETH_PARENT}" is already taken`
          );
          setError(error);
          setIsLoading(false);
          setProgress(null);
          return {
            success: false,
            error: error.message,
          };
        }

        const ownerAccount = privateKeyToAccount(
          PREDICT_ETH_OWNER_KEY as `0x${string}`
        );

        const publicClient = createPublicClient({
          chain: sepolia,
          transport: getSepoliaTransport(),
        });

        const walletClient = createWalletClient({
          account: ownerAccount,
          chain: sepolia,
          transport: getSepoliaTransport(),
        });

        const parentNode = namehash(PREDICT_ETH_PARENT);
        const labelHash = labelhash(params.label);
        const subdomain = `${params.label}.${PREDICT_ETH_PARENT}`;
        const subdomainNode = namehash(subdomain);

        setProgress({
          stage: 'creating',
          subdomain,
          newOwner: params.newOwner,
        });
        console.log('Creating subdomain:', subdomain);
        console.log('Assigning to:', params.newOwner);

        const hash = await walletClient.writeContract({
          address: ENS_REGISTRY,
          abi: ensRegistryAbi,
          functionName: 'setSubnodeRecord',
          args: [
            parentNode,
            labelHash,
            params.newOwner,
            PUBLIC_RESOLVER_SEPOLIA,
            BigInt(0),
          ],
        });

        setProgress({
          stage: 'tx-sent',
          subdomain,
          newOwner: params.newOwner,
          txHash: hash,
        });
        console.log('Subdomain creation tx:', hash);

        setProgress({
          stage: 'confirming',
          subdomain,
          newOwner: params.newOwner,
          txHash: hash,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Subdomain created! Block:', receipt.blockNumber);

        setProgress({
          stage: 'complete',
          subdomain,
          newOwner: params.newOwner,
          txHash: hash,
          blockNumber: receipt.blockNumber,
        });

        setIsLoading(false);
        return {
          success: true,
          subdomain,
          node: subdomainNode,
          txHash: hash,
          blockNumber: receipt.blockNumber,
        };
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Failed to claim subdomain');
        setError(error);
        setIsLoading(false);
        setProgress(null);
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [checkSubdomainAvailability]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    claimSubdomain,
    checkSubdomainAvailability,
    isLoading,
    error,
    progress,
    clearError,
  };
}
