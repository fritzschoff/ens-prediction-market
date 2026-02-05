# @hack-money/frontend

Next.js frontend for ENS Prediction Markets. Features market discovery, betting interface, privacy-preserving bets, and market creation.

## Features

- Market discovery with ENS name resolution
- Market creation with ENS registration
- Wallet connection via RainbowKit
- Real-time odds display
- Interactive demo walkthrough
- ENS data visualization

## Tech Stack

- Next.js 16 (App Router)
- React 18
- Tailwind CSS
- wagmi v2
- viem v2
- RainbowKit v2
- @tanstack/react-query

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Contract addresses are auto-generated from deployment artifacts on startup.

## Build

```bash
pnpm build
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Pages

### Home (`/`)

Browse all active prediction markets with filters and search.

### Market (`/market/[name]`)

Individual market page with:

- Current odds display
- Betting panel
- Position management
- Resolution criteria
- ENS data visualization

### Create (`/create`)

Create new prediction markets:

- Set question and ENS name
- Configure expiry
- Define resolution criteria

### Demo (`/demo`)

Interactive hackathon demo showcasing:

- Market creation flow
- Standard betting
- Winning redemption
- Toggle between mock and live modes

## Components

### Navbar

Navigation with wallet connection and demo link.

### MarketCard

Market preview with odds and volume.

### BetPanel

Standard betting interface with outcome selection and amount input.

### PositionManager

Display and manage user positions.

### ENSDataViewer

Expandable component showing how market data is stored in ENS text records.

## Hooks

### useMarketData

Fetch market data from ENS text records and on-chain state:

```typescript
const { market, isLoading, error } = useMarketData("btc-100k");
```

### useBetActions

Standard betting operations:

```typescript
const { placeBet, claimWinnings, isBetting } = useBetActions(poolKey);
```

### useCreateMarket

Market creation flow:

```typescript
const { createMarket, isLoading, marketId } = useCreateMarket();
```

## Auto-Generated Contracts

Contract addresses are automatically synced from Foundry deployment artifacts:

```bash
pnpm generate-contracts
```

This runs automatically on `pnpm dev` and `pnpm build`.

## Styling

Uses Tailwind CSS with custom theme:

- Outfit font family
- JetBrains Mono for monospace
- Indigo/purple gradient accents
- Dark slate background

## Deployment

### Vercel

```bash
vercel --prod
```

### Static Export

```bash
pnpm build
pnpm export
```

## License

MIT
