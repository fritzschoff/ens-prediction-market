# @hack-money/uniswap-v4

Uniswap v4 smart contracts for prediction markets. This package implements custom Hooks for decentralized prediction markets.

## Deployed Contracts (Sepolia)

| Contract             | Address                                      |
| -------------------- | -------------------------------------------- |
| MarketFactory        | `0xC8e9fB7E459F9E684D1416e021C28Ae155151447` |
| PredictionMarketHook | `0xC8AF775a8C11B217581d4850d1d02296C953bAC0` |
| SubdomainRegistrar   | `0x377ab09a61f16333e68733f85cdc6D54d729AC48` |

## Contracts

### PredictionMarketHook (Standard)

Basic prediction market Hook without privacy features.

### OutcomeToken

ERC20 tokens representing YES/NO outcomes.

### MarketFactory

Factory for deploying new prediction markets.

## Installation

```bash
forge install
```

## Build

```bash
forge build
```

## Test

```bash
forge test
```

## Usage

### Place a Bet

```solidity
hook.betOnOutcome(poolKey, true); // Bet on YES
```

### Claim Winnings

After market resolution:

```solidity
hook.claimWinnings(poolKey);
```

## Deployment

Deploy main contracts (MarketFactory + PredictionMarketHook):

```bash
PRIVATE_KEY=your_key forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

## License

MIT
