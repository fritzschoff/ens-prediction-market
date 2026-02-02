import { namehash, labelhash, Address, encodeFunctionData } from 'viem';
import { PartialMarketRecords } from './types';
import {
  MARKET_RECORD_KEYS,
  ENS_PUBLIC_RESOLVER_SEPOLIA,
  ENS_REGISTRY_ADDRESS,
} from './constants';

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

const ensRegistryAbi = [
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'label', type: 'bytes32' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' },
    ],
    name: 'setSubnodeRecord',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface CreateSubdomainParams {
  parentName: string;
  label: string;
  owner: Address;
  resolverAddress?: Address;
}

export function encodeCreateSubdomain(params: CreateSubdomainParams): {
  to: Address;
  data: `0x${string}`;
} {
  const parentNode = namehash(params.parentName);
  const label = labelhash(params.label);
  const resolverAddress = params.resolverAddress ?? ENS_PUBLIC_RESOLVER_SEPOLIA;

  const data = encodeFunctionData({
    abi: ensRegistryAbi,
    functionName: 'setSubnodeRecord',
    args: [parentNode, label, params.owner, resolverAddress, BigInt(0)],
  });

  return {
    to: ENS_REGISTRY_ADDRESS,
    data,
  };
}

export function getSubdomainNode(
  parentName: string,
  label: string
): `0x${string}` {
  return namehash(`${label}.${parentName}`);
}

export { ensRegistryAbi };

export interface SetTextRecordParams {
  name: string;
  key: string;
  value: string;
  resolverAddress?: Address;
}

export function encodeSetTextRecord(params: SetTextRecordParams): {
  to: Address;
  data: `0x${string}`;
} {
  const node = namehash(params.name);
  const resolverAddress = params.resolverAddress ?? ENS_PUBLIC_RESOLVER_SEPOLIA;

  const data = encodeFunctionData({
    abi: resolverAbi,
    functionName: 'setText',
    args: [node, params.key, params.value],
  });

  return {
    to: resolverAddress,
    data,
  };
}

export interface SetMarketRecordsParams {
  name: string;
  records: PartialMarketRecords;
  resolverAddress?: Address;
}

export function encodeSetMarketRecords(params: SetMarketRecordsParams): {
  to: Address;
  data: `0x${string}`;
} {
  const node = namehash(params.name);
  const resolverAddress = params.resolverAddress ?? ENS_PUBLIC_RESOLVER_SEPOLIA;

  const calls: `0x${string}`[] = [];

  if (params.records.pool) {
    calls.push(
      encodeFunctionData({
        abi: resolverAbi,
        functionName: 'setText',
        args: [node, MARKET_RECORD_KEYS.pool, params.records.pool],
      })
    );
  }

  if (params.records.oracle) {
    calls.push(
      encodeFunctionData({
        abi: resolverAbi,
        functionName: 'setText',
        args: [node, MARKET_RECORD_KEYS.oracle, params.records.oracle],
      })
    );
  }

  if (params.records.expiry !== undefined) {
    calls.push(
      encodeFunctionData({
        abi: resolverAbi,
        functionName: 'setText',
        args: [
          node,
          MARKET_RECORD_KEYS.expiry,
          params.records.expiry.toString(),
        ],
      })
    );
  }

  if (params.records.criteria) {
    calls.push(
      encodeFunctionData({
        abi: resolverAbi,
        functionName: 'setText',
        args: [node, MARKET_RECORD_KEYS.criteria, params.records.criteria],
      })
    );
  }

  if (params.records.yesToken) {
    calls.push(
      encodeFunctionData({
        abi: resolverAbi,
        functionName: 'setText',
        args: [node, MARKET_RECORD_KEYS.yesToken, params.records.yesToken],
      })
    );
  }

  if (params.records.noToken) {
    calls.push(
      encodeFunctionData({
        abi: resolverAbi,
        functionName: 'setText',
        args: [node, MARKET_RECORD_KEYS.noToken, params.records.noToken],
      })
    );
  }

  if (params.records.creator) {
    calls.push(
      encodeFunctionData({
        abi: resolverAbi,
        functionName: 'setText',
        args: [node, MARKET_RECORD_KEYS.creator, params.records.creator],
      })
    );
  }

  const data = encodeFunctionData({
    abi: resolverAbi,
    functionName: 'multicall',
    args: [calls],
  });

  return {
    to: resolverAddress,
    data,
  };
}

export function marketRecordsToTextRecords(
  records: PartialMarketRecords
): Record<string, string> {
  const result: Record<string, string> = {};

  if (records.pool) result[MARKET_RECORD_KEYS.pool] = records.pool;
  if (records.oracle) result[MARKET_RECORD_KEYS.oracle] = records.oracle;
  if (records.expiry !== undefined)
    result[MARKET_RECORD_KEYS.expiry] = records.expiry.toString();
  if (records.criteria) result[MARKET_RECORD_KEYS.criteria] = records.criteria;
  if (records.yesToken) result[MARKET_RECORD_KEYS.yesToken] = records.yesToken;
  if (records.noToken) result[MARKET_RECORD_KEYS.noToken] = records.noToken;
  if (records.creator) result[MARKET_RECORD_KEYS.creator] = records.creator;

  return result;
}
