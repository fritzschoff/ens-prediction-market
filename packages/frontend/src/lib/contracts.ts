import { Address } from "viem";

export const CONTRACTS = {
  MARKET_FACTORY: "0x5ab4d6d9c05f28bff69ad48cab9d119803ac7a16" as Address,
  PREDICTION_HOOK: "0x3e59cd5f19ba3affdd77aaf2cb7a1a72282e3ac0" as Address,
  PRIVATE_BETTING_HOOK: "0x38498093d43e1d9b3fb86f492c64ceb9eb902880" as Address,
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
