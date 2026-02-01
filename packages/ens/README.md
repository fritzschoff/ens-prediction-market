# @hack-money/ens

ENS integration for prediction markets. This package provides utilities for reading and writing ENS text records that store prediction market metadata.

## Prize Track: ENS

This package demonstrates creative use of ENS for DeFi by:

1. Using ENS names as human-readable identifiers for prediction markets
2. Storing market metadata (pool address, oracle, expiry, etc.) in text records
3. Enabling market discovery through ENS resolution

## Installation

```bash
pnpm add @hack-money/ens
```

## Usage

### Reading Market Records

```typescript
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { resolveMarketFromENS } from "@hack-money/ens";

const client = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const market = await resolveMarketFromENS(client, "btc-100k.predict.eth");

if (market) {
  console.log("Pool:", market.pool);
  console.log("Oracle:", market.oracle);
  console.log("Expiry:", new Date(market.expiry * 1000));
}
```

### Writing Market Records

```typescript
import { encodeSetMarketRecords } from "@hack-money/ens";

const tx = encodeSetMarketRecords({
  name: "btc-100k.predict.eth",
  records: {
    pool: "0x...",
    oracle: "0x...",
    expiry: 1735689600,
    criteria: "ipfs://Qm...",
    yesToken: "0x...",
    noToken: "0x...",
    creator: "vitalik.eth",
  },
});

await walletClient.sendTransaction(tx);
```

## Text Record Schema

| Key | Type | Description |
|-----|------|-------------|
| `pool` | Address | Uniswap v4 pool address |
| `oracle` | Address | Market resolution oracle |
| `expiry` | Number | Unix timestamp for market expiry |
| `criteria` | String | IPFS hash of resolution criteria |
| `yesToken` | Address | YES outcome token address |
| `noToken` | Address | NO outcome token address |
| `creator` | String | ENS name of market creator |

## API Reference

### Functions

#### `resolveMarketFromENS(client, name, config?)`

Resolves all market records from an ENS name.

#### `getTextRecord(client, name, key, config?)`

Reads a single text record from an ENS name.

#### `getMarketRecords(client, name, config?)`

Reads all market-related text records.

#### `encodeSetTextRecord(params)`

Encodes a transaction to set a single text record.

#### `encodeSetMarketRecords(params)`

Encodes a multicall transaction to set multiple market records.

## Constants

```typescript
import { MARKET_RECORD_KEYS, ENS_PUBLIC_RESOLVER_SEPOLIA } from "@hack-money/ens";
```

## License

MIT

