# ENS Prediction Markets

A decentralized prediction market platform built on Uniswap v4, featuring **privacy-preserving betting** through commit-reveal mechanisms and ENS integration for human-readable market names.

## Live Demo

Visit `/demo` in the frontend to see an interactive walkthrough of all features.

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| MarketFactory | `0x5ab4d6d9c05f28bff69ad48cab9d119803ac7a16` |
| PredictionMarketHook | `0x3e59cd5f19ba3affdd77aaf2cb7a1a72282e3ac0` |
| PrivateBettingHook | `0x38498093d43e1d9b3fb86f492c64ceb9eb902880` |

## Privacy Features (Uniswap v4 Privacy DeFi Track)

This project implements **Privacy DeFi** through:

- **Commit-Reveal Betting** - Hide your bet direction (YES/NO) until the reveal phase
- **Batch Settlement** - All bets in a window execute at uniform price
- **MEV Protection** - Front-runners cannot see your position before execution
- **Fair Execution** - No information asymmetry between participants

```
COMMIT PHASE          REVEAL PHASE          SETTLEMENT
    │                     │                     │
    ▼                     ▼                     ▼
┌─────────┐          ┌─────────┐          ┌─────────┐
│ Submit  │          │ Reveal  │          │ Execute │
│ hash +  │    →     │ outcome │    →     │ at same │
│ amount  │          │ + salt  │          │ price   │
└─────────┘          └─────────┘          └─────────┘
   5 min               10 min              Instant
```

### Why Privacy Matters for Prediction Markets

| Problem             | Traditional Markets                         | Our Solution                           |
| ------------------- | ------------------------------------------- | -------------------------------------- |
| Front-running       | MEV bots see your bet and trade ahead       | Bet direction hidden until reveal      |
| Information leakage | Large bets move the market before execution | Batch settlement at uniform price      |
| Adverse selection   | Informed traders exploit visible order flow | All participants reveal simultaneously |

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
│   2. User commits hidden bet (hash only)                       │
│                         │                                       │
│                         ▼                                       │
│   ┌─────────────────────────────────────┐                      │
│   │      PRIVATE BETTING HOOK           │                      │
│   │  • Commit: hash(outcome, salt)      │                      │
│   │  • Reveal: outcome + salt           │                      │
│   │  • Batch settle at uniform price    │                      │
│   └─────────────────────────────────────┘                      │
│                         │                                       │
│                         ▼                                       │
│   3. Bets execute against Uniswap v4 pool                      │
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

Run privacy tests specifically:

```bash
forge test --match-contract PrivateBettingHookTest -vvv
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

Deploy PrivateBettingHook:

```bash
PRIVATE_KEY=your_key forge script script/DeployPrivateBettingHook.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
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
