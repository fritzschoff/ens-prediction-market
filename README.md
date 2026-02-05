# ENS Prediction Markets

A decentralized prediction market platform built on Uniswap v4 with ENS integration for human-readable market names.

## Live Demo

Visit `/demo` in the frontend to see an interactive walkthrough of all features.

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| MarketFactory | `0xC8e9fB7E459F9E684D1416e021C28Ae155151447` |
| PredictionMarketHook | `0xC8AF775a8C11B217581d4850d1d02296C953bAC0` |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│   1. User looks up "btc-100k.predict.eth"                      │
│                         │                                       │
│                         ▼                                       │
│   ┌─────────────────────────────────────┐                      │
│   │            ENS RECORDS              │                      │
│   │  • Pool address                     │                      │
│   │  • Resolution oracle                │                      │
│   │  • Expiry timestamp                 │                      │
│   │  • Resolution criteria (IPFS)       │                      │
│   └─────────────────────────────────────┘                      │
│                         │                                       │
│                         ▼                                       │
│   2. User places bet against Uniswap v4 pool                   │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Foundry

### Installation

```bash
pnpm install
```

### Build Contracts

```bash
cd packages/uniswap-v4
forge build
```

### Run Tests

```bash
cd packages/uniswap-v4
forge test
```


### Start Frontend

```bash
pnpm dev
```

## Packages

- [ENS Integration](./packages/ens/README.md) - Text record schema and utilities
- [Uniswap v4 Hook](./packages/uniswap-v4/README.md) - Smart contracts with privacy features
- [Frontend](./packages/frontend/README.md) - Next.js application

## Environment Variables

Create a `.env` file:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
SEPOLIA_RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
```

## Deployment

### Contracts (Sepolia)

Deploy main contracts:

```bash
cd packages/uniswap-v4
PRIVATE_KEY=your_key forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```


### Frontend (Vercel)

```bash
cd packages/frontend
vercel --prod
```

## Tech Stack

- **Frontend**: Next.js 16, React 18, Tailwind CSS
- **Web3**: wagmi, viem, RainbowKit
- **Contracts**: Solidity 0.8.26, Foundry
- **Protocols**: Uniswap v4, ENS

## License

MIT
