# @hack-money/uniswap-v4

Uniswap v4 smart contracts for privacy-preserving prediction markets. This package implements custom Hooks that enable private betting with MEV protection through commit-reveal mechanisms.

## Deployed Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| MarketFactory | `0x5ab4d6d9c05f28bff69ad48cab9d119803ac7a16` |
| PredictionMarketHook | `0x3e59cd5f19ba3affdd77aaf2cb7a1a72282e3ac0` |
| PrivateBettingHook | `0x38498093d43e1d9b3fb86f492c64ceb9eb902880` |

## Prize Track: Uniswap v4 Privacy DeFi

This package demonstrates privacy-enhancing DeFi by:

1. **Commit-Reveal Betting** - Users commit hashed bets, hiding their position until reveal
2. **Batch Settlement** - All bets in a batch settle at uniform price, preventing front-running
3. **MEV Protection** - Hidden bet direction and amounts until execution
4. **Fair Execution** - Time-windowed reveals ensure equal information access

## Privacy Features

### The Problem

Traditional on-chain prediction markets expose:

- Which outcome you're betting on (YES/NO)
- How much you're betting
- When you're betting

This enables:

- Front-running by MEV bots
- Adverse selection by informed traders
- Price manipulation through visible order flow

### Our Solution: Commit-Reveal Batched Betting

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIVACY FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMMIT PHASE (5 minutes)                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ User submits: hash(outcome, salt, address) + amount     │   │
│  │ Observers see: ??? amount committed                      │   │
│  │ Cannot determine: YES or NO position                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                       │
│                         ▼                                       │
│  REVEAL PHASE (10 minutes)                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ User reveals: outcome + salt                             │   │
│  │ Contract verifies: hash matches commitment               │   │
│  │ Batch aggregates: total YES and NO amounts               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                       │
│                         ▼                                       │
│  SETTLEMENT                                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ All bets execute at uniform clearing price               │   │
│  │ No front-running possible (positions were hidden)        │   │
│  │ Fair execution for all participants                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Contracts

### PrivateBettingHook (Privacy-Preserving)

The main Hook implementing commit-reveal privacy:

| Function                                  | Description                        |
| ----------------------------------------- | ---------------------------------- |
| `commitBet(key, hash, amount)`            | Submit hidden bet commitment       |
| `revealBet(key, outcome, salt)`           | Reveal bet after commit window     |
| `settleBatch(key, batchId)`               | Settle batch at uniform price      |
| `claimWinnings(key, outcome, salt)`       | Claim winnings after resolution    |
| `generateCommitHash(outcome, salt, user)` | Helper to generate commitment hash |

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

Run privacy tests specifically:

```bash
forge test --match-contract PrivateBettingHookTest -vvv
```

## Usage

### Create a Private Bet

```solidity
bytes32 salt = keccak256("my_secret_salt");
bool myOutcome = true;
uint256 amount = 100e18;

bytes32 commitment = hook.generateCommitHash(myOutcome, salt, msg.sender);

collateral.approve(address(hook), amount);
hook.commitBet(poolKey, commitment, amount);
```

### Reveal Your Bet

After the commit window closes:

```solidity
hook.revealBet(poolKey, myOutcome, salt);
```

### Settle the Batch

Anyone can trigger settlement after reveal window:

```solidity
hook.settleBatch(poolKey, batchId);
```

### Claim Winnings

After market resolution:

```solidity
hook.claimWinnings(poolKey, myOutcome, salt);
```

## Privacy Guarantees

| Property        | Guarantee                                            |
| --------------- | ---------------------------------------------------- |
| Bet Direction   | Hidden until reveal phase                            |
| Bet Amount      | Visible (could be hidden with additional encryption) |
| Execution Price | Uniform for all bets in batch                        |
| Front-running   | Prevented by hidden direction                        |
| MEV Extraction  | Minimized through batch settlement                   |

## Configuration

| Parameter        | Default    | Description                     |
| ---------------- | ---------- | ------------------------------- |
| `BATCH_DURATION` | 5 minutes  | Time window for committing bets |
| `REVEAL_WINDOW`  | 10 minutes | Time window for revealing bets  |

## Events

```solidity
event BetCommitted(PoolId indexed poolId, address indexed user, bytes32 commitHash, uint256 amount, uint256 batchId);
event BetRevealed(PoolId indexed poolId, address indexed user, bool outcome, uint256 amount, uint256 batchId);
event BatchSettled(PoolId indexed poolId, uint256 batchId, uint256 clearingPrice, uint256 totalYes, uint256 totalNo);
event MarketResolved(PoolId indexed poolId, bool outcome);
event WinningsClaimed(PoolId indexed poolId, address indexed user, uint256 amount);
```

## Deployment

Deploy main contracts (MarketFactory + PredictionMarketHook):

```bash
PRIVATE_KEY=your_key forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

Deploy PrivateBettingHook:

```bash
PRIVATE_KEY=your_key forge script script/DeployPrivateBettingHook.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast
```

## License

MIT
