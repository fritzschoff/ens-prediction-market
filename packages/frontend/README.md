# @hack-money/frontend

Next.js frontend for ENS Prediction Markets. Features market discovery, betting interface, and market creation.

## Features

- Market discovery with ENS name resolution
- Gasless betting via Yellow Network sessions
- Market creation with ENS registration
- Wallet connection via RainbowKit
- Real-time odds display

## Tech Stack

- Next.js 14 (App Router)
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

### Create (`/create`)

Create new prediction markets:

- Set question and ENS name
- Configure expiry
- Define resolution criteria

## Components

### Navbar

Navigation with wallet connection.

### MarketCard

Market preview with odds and volume.

### BetPanel

Betting interface with outcome selection and amount input.

### PositionManager

Display and manage user positions.

## Hooks

### useMarketFromENS

Fetch market data from ENS text records:

```typescript
const { market, isLoading, error } = useMarketFromENS("btc-100k.predict.eth");
```

### useYellowSession

Manage Yellow Network betting sessions:

```typescript
const {
  currentSession,
  createSession,
  placeBet,
  settleBets,
} = useYellowSession();
```

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

