import { Address } from "viem";

export interface MarketRecords {
  pool: Address;
  oracle: Address;
  expiry: number;
  criteria: string;
  yesToken: Address;
  noToken: Address;
  creator: string;
}

export interface PartialMarketRecords {
  pool?: Address;
  oracle?: Address;
  expiry?: number;
  criteria?: string;
  yesToken?: Address;
  noToken?: Address;
  creator?: string;
}

export interface ENSResolverConfig {
  chainId: number;
  resolverAddress?: Address;
}

