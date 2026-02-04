import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DEPLOY_BROADCAST_PATH = join(
  process.cwd(),
  '../uniswap-v4/broadcast/Deploy.s.sol/11155111/run-latest.json'
);

const PRIVATE_HOOK_BROADCAST_PATH = join(
  process.cwd(),
  '../uniswap-v4/broadcast/DeployPrivateBettingHook.s.sol/11155111/run-latest.json'
);

const OUTPUT_PATH = join(process.cwd(), 'src/lib/contracts.ts');

interface BroadcastTransaction {
  contractName: string;
  contractAddress: string;
  transactionType: string;
}

interface BroadcastData {
  transactions: BroadcastTransaction[];
}

function extractAddresses(broadcastData: BroadcastData) {
  const addresses: Record<string, string> = {};

  for (const tx of broadcastData.transactions) {
    if (tx.contractName === 'PredictionMarketHook') {
      addresses.PREDICTION_HOOK = tx.contractAddress;
    } else if (tx.contractName === 'MarketFactory') {
      addresses.MARKET_FACTORY = tx.contractAddress;
    } else if (tx.contractName === 'PrivateBettingHook') {
      addresses.PRIVATE_BETTING_HOOK = tx.contractAddress;
    }
  }

  return addresses;
}

try {
  const addresses: Record<string, string> = {
    MARKET_FACTORY: '0x0000000000000000000000000000000000000000',
    PREDICTION_HOOK: '0x0000000000000000000000000000000000000000',
    PRIVATE_BETTING_HOOK: '0x0000000000000000000000000000000000000000',
  };

  if (existsSync(DEPLOY_BROADCAST_PATH)) {
    const broadcastContent = readFileSync(DEPLOY_BROADCAST_PATH, 'utf-8');
    const broadcastData: BroadcastData = JSON.parse(broadcastContent);
    const deployAddresses = extractAddresses(broadcastData);
    Object.assign(addresses, deployAddresses);
  } else {
    console.log('⚠️  Deploy.s.sol broadcast not found, using default addresses');
  }

  if (existsSync(PRIVATE_HOOK_BROADCAST_PATH)) {
    const broadcastContent = readFileSync(PRIVATE_HOOK_BROADCAST_PATH, 'utf-8');
    const broadcastData: BroadcastData = JSON.parse(broadcastContent);
    const privateHookAddresses = extractAddresses(broadcastData);
    Object.assign(addresses, privateHookAddresses);
  } else {
    console.log(
      '⚠️  DeployPrivateBettingHook.s.sol broadcast not found, using default address'
    );
  }

  const contractsFile = `import { Address } from "viem";

export const CONTRACTS = {
  MARKET_FACTORY: "${addresses.MARKET_FACTORY}" as Address,
  PREDICTION_HOOK: "${addresses.PREDICTION_HOOK}" as Address,
  PRIVATE_BETTING_HOOK: "${addresses.PRIVATE_BETTING_HOOK}" as Address,
} as const;

export const MARKET_FACTORY_ABI = [
  {
    inputs: [],
    name: "EmptyQuestion",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidExpiry",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidOracle",
    type: "error",
  },
  {
    inputs: [],
    name: "ENSNameTaken",
    type: "error",
  },
  {
    inputs: [
      {
        components: [
          { name: "question", type: "string" },
          { name: "oracle", type: "address" },
          { name: "expiry", type: "uint256" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "createMarket",
    outputs: [{ name: "marketId", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "marketId", type: "bytes32" }],
    name: "getMarketInfo",
    outputs: [
      {
        components: [
          { name: "yesToken", type: "address" },
          { name: "noToken", type: "address" },
          {
            components: [
              { name: "currency0", type: "address" },
              { name: "currency1", type: "address" },
              { name: "fee", type: "uint24" },
              { name: "tickSpacing", type: "int24" },
              { name: "hooks", type: "address" },
            ],
            name: "poolKey",
            type: "tuple",
          },
          { name: "question", type: "string" },
          { name: "oracle", type: "address" },
          { name: "expiry", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "ensName", type: "string" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMarketCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "getMarketIdAt",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "ensName", type: "string" }],
    name: "getMarketByENS",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const PREDICTION_HOOK_ABI = [
  {
    inputs: [
      {
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
        name: "key",
        type: "tuple",
      },
    ],
    name: "getMarket",
    outputs: [
      {
        components: [
          { name: "yesToken", type: "address" },
          { name: "noToken", type: "address" },
          { name: "oracle", type: "address" },
          { name: "expiry", type: "uint256" },
          { name: "resolved", type: "bool" },
          { name: "outcome", type: "bool" },
          { name: "totalCollateral", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
        name: "key",
        type: "tuple",
      },
      { name: "outcome", type: "bool" },
    ],
    name: "betOnOutcome",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
        name: "key",
        type: "tuple",
      },
      { name: "outcome", type: "bool" },
    ],
    name: "resolveMarket",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" },
        ],
        name: "key",
        type: "tuple",
      },
    ],
    name: "claimWinnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
`;

  writeFileSync(OUTPUT_PATH, contractsFile, 'utf-8');
  console.log('✅ Generated contracts.ts from broadcast files');
  console.log(`   MARKET_FACTORY: ${addresses.MARKET_FACTORY}`);
  console.log(`   PREDICTION_HOOK: ${addresses.PREDICTION_HOOK}`);
  console.log(`   PRIVATE_BETTING_HOOK: ${addresses.PRIVATE_BETTING_HOOK}`);
} catch (error) {
  console.error('❌ Error generating contracts:', error);
  process.exit(1);
}
