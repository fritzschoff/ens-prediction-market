import {
  PublicClient,
  namehash,
  Address,
  encodeFunctionData,
  decodeFunctionResult,
} from "viem";
import { MarketRecords, ENSResolverConfig, PartialMarketRecords } from "./types";
import { MARKET_RECORD_KEYS, ENS_PUBLIC_RESOLVER_SEPOLIA } from "./constants";

const resolverAbi = [
  {
    inputs: [
      { name: "node", type: "bytes32" },
      { name: "key", type: "string" },
    ],
    name: "text",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function getTextRecord(
  client: PublicClient,
  name: string,
  key: string,
  config?: ENSResolverConfig
): Promise<string | null> {
  const node = namehash(name);
  const resolverAddress = config?.resolverAddress ?? ENS_PUBLIC_RESOLVER_SEPOLIA;

  try {
    const data = encodeFunctionData({
      abi: resolverAbi,
      functionName: "text",
      args: [node, key],
    });

    const result = await client.call({
      to: resolverAddress,
      data,
    });

    if (!result.data) return null;

    const decoded = decodeFunctionResult({
      abi: resolverAbi,
      functionName: "text",
      data: result.data,
    });

    return decoded || null;
  } catch {
    return null;
  }
}

export async function getMarketRecords(
  client: PublicClient,
  name: string,
  config?: ENSResolverConfig
): Promise<PartialMarketRecords> {
  const keys = Object.values(MARKET_RECORD_KEYS);

  const results = await Promise.all(
    keys.map((key) => getTextRecord(client, name, key, config))
  );

  const records: PartialMarketRecords = {};

  keys.forEach((key, index) => {
    const value = results[index];
    if (!value) return;

    switch (key) {
      case "pool":
      case "oracle":
      case "yesToken":
      case "noToken":
        records[key] = value as Address;
        break;
      case "expiry":
        records[key] = parseInt(value, 10);
        break;
      case "criteria":
      case "creator":
      case "marketId":
        records[key] = value;
        break;
    }
  });

  return records;
}

export function isValidMarketRecords(
  records: PartialMarketRecords
): records is MarketRecords {
  return (
    typeof records.pool === "string" &&
    typeof records.oracle === "string" &&
    typeof records.expiry === "number" &&
    typeof records.criteria === "string" &&
    typeof records.yesToken === "string" &&
    typeof records.noToken === "string" &&
    typeof records.creator === "string"
  );
}

export async function resolveMarketFromENS(
  client: PublicClient,
  name: string,
  config?: ENSResolverConfig
): Promise<MarketRecords | null> {
  const records = await getMarketRecords(client, name, config);

  if (isValidMarketRecords(records)) {
    return records;
  }

  return null;
}

