// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {
    BeforeSwapDelta,
    BeforeSwapDeltaLibrary
} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {
    ModifyLiquidityParams,
    SwapParams
} from "@uniswap/v4-core/src/types/PoolOperation.sol";

contract PrivateBettingHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    uint256 public constant BATCH_DURATION = 5 minutes;
    uint256 public constant REVEAL_WINDOW = 10 minutes;

    struct Commitment {
        bytes32 commitHash;
        uint256 amount;
        uint256 batchId;
        bool revealed;
        bool executed;
    }

    struct Batch {
        uint256 startTime;
        uint256 totalYesAmount;
        uint256 totalNoAmount;
        uint256 yesCount;
        uint256 noCount;
        bool settled;
    }

    struct Market {
        address yesToken;
        address noToken;
        address oracle;
        uint256 expiry;
        bool resolved;
        bool outcome;
        uint256 currentBatchId;
    }

    mapping(PoolId => Market) public markets;
    mapping(PoolId => mapping(uint256 => Batch)) public batches;
    mapping(PoolId => mapping(address => Commitment)) public commitments;

    event MarketCreated(
        PoolId indexed poolId,
        address yesToken,
        address noToken,
        address oracle,
        uint256 expiry
    );
    event BetCommitted(
        PoolId indexed poolId,
        address indexed user,
        bytes32 commitHash,
        uint256 amount,
        uint256 batchId
    );
    event BetRevealed(
        PoolId indexed poolId,
        address indexed user,
        bool outcome,
        uint256 amount,
        uint256 batchId
    );
    event BatchSettled(
        PoolId indexed poolId,
        uint256 batchId,
        uint256 clearingPrice,
        uint256 totalYes,
        uint256 totalNo
    );
    event MarketResolved(PoolId indexed poolId, bool outcome);
    event WinningsClaimed(
        PoolId indexed poolId,
        address indexed user,
        uint256 amount
    );

    error MarketNotInitialized();
    error MarketExpired();
    error MarketNotExpired();
    error MarketAlreadyResolved();
    error MarketNotResolved();
    error OnlyOracle();
    error InvalidExpiry();
    error CommitmentAlreadyExists();
    error NoCommitment();
    error AlreadyRevealed();
    error RevealWindowNotOpen();
    error RevealWindowClosed();
    error InvalidReveal();
    error BatchNotSettled();
    error AlreadyExecuted();
    error NoWinnings();
    error InsufficientAmount();
    error TransferFailed();

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    receive() external payable {}

    function getHookPermissions()
        public
        pure
        override
        returns (Hooks.Permissions memory)
    {
        return
            Hooks.Permissions({
                beforeInitialize: true,
                afterInitialize: false,
                beforeAddLiquidity: true,
                afterAddLiquidity: false,
                beforeRemoveLiquidity: false,
                afterRemoveLiquidity: false,
                beforeSwap: true,
                afterSwap: false,
                beforeDonate: false,
                afterDonate: false,
                beforeSwapReturnDelta: false,
                afterSwapReturnDelta: false,
                afterAddLiquidityReturnDelta: false,
                afterRemoveLiquidityReturnDelta: false
            });
    }

    function initializeMarket(
        PoolKey calldata key,
        address yesToken,
        address noToken,
        address oracle,
        uint256 expiry
    ) external {
        if (expiry <= block.timestamp) revert InvalidExpiry();

        PoolId poolId = key.toId();

        markets[poolId] = Market({
            yesToken: yesToken,
            noToken: noToken,
            oracle: oracle,
            expiry: expiry,
            resolved: false,
            outcome: false,
            currentBatchId: 1
        });

        batches[poolId][1] = Batch({
            startTime: block.timestamp,
            totalYesAmount: 0,
            totalNoAmount: 0,
            yesCount: 0,
            noCount: 0,
            settled: false
        });

        emit MarketCreated(poolId, yesToken, noToken, oracle, expiry);
    }

    function _beforeInitialize(
        address,
        PoolKey calldata,
        uint160
    ) internal pure override returns (bytes4) {
        return BaseHook.beforeInitialize.selector;
    }

    function _beforeAddLiquidity(
        address,
        PoolKey calldata key,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal view override returns (bytes4) {
        PoolId poolId = key.toId();
        Market storage market = markets[poolId];

        if (market.yesToken == address(0)) revert MarketNotInitialized();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp >= market.expiry) revert MarketExpired();

        return BaseHook.beforeAddLiquidity.selector;
    }

    function _beforeSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata,
        bytes calldata
    ) internal view override returns (bytes4, BeforeSwapDelta, uint24) {
        PoolId poolId = key.toId();
        Market storage market = markets[poolId];

        if (market.yesToken == address(0)) revert MarketNotInitialized();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp >= market.expiry) revert MarketExpired();

        return (
            BaseHook.beforeSwap.selector,
            BeforeSwapDeltaLibrary.ZERO_DELTA,
            0
        );
    }

    function commitBet(
        PoolKey calldata key,
        bytes32 commitHash
    ) external payable {
        if (msg.value == 0) revert InsufficientAmount();

        PoolId poolId = key.toId();
        Market storage market = markets[poolId];

        if (market.yesToken == address(0)) revert MarketNotInitialized();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp >= market.expiry) revert MarketExpired();

        Commitment storage existing = commitments[poolId][msg.sender];
        if (existing.commitHash != bytes32(0) && !existing.executed) {
            revert CommitmentAlreadyExists();
        }

        uint256 currentBatchId = market.currentBatchId;
        Batch storage batch = batches[poolId][currentBatchId];

        if (block.timestamp >= batch.startTime + BATCH_DURATION) {
            currentBatchId++;
            market.currentBatchId = currentBatchId;
            batches[poolId][currentBatchId] = Batch({
                startTime: block.timestamp,
                totalYesAmount: 0,
                totalNoAmount: 0,
                yesCount: 0,
                noCount: 0,
                settled: false
            });
        }

        commitments[poolId][msg.sender] = Commitment({
            commitHash: commitHash,
            amount: msg.value,
            batchId: currentBatchId,
            revealed: false,
            executed: false
        });

        emit BetCommitted(
            poolId,
            msg.sender,
            commitHash,
            msg.value,
            currentBatchId
        );
    }

    function revealBet(
        PoolKey calldata key,
        bool outcome,
        bytes32 salt
    ) external {
        PoolId poolId = key.toId();
        Commitment storage commitment = commitments[poolId][msg.sender];

        if (commitment.commitHash == bytes32(0)) revert NoCommitment();
        if (commitment.revealed) revert AlreadyRevealed();

        Batch storage batch = batches[poolId][commitment.batchId];
        uint256 revealStart = batch.startTime + BATCH_DURATION;
        uint256 revealEnd = revealStart + REVEAL_WINDOW;

        if (block.timestamp < revealStart) revert RevealWindowNotOpen();
        if (block.timestamp > revealEnd) revert RevealWindowClosed();

        bytes32 expectedHash = keccak256(
            abi.encodePacked(outcome, salt, msg.sender)
        );
        if (commitment.commitHash != expectedHash) revert InvalidReveal();

        commitment.revealed = true;

        if (outcome) {
            batch.totalYesAmount += commitment.amount;
            batch.yesCount++;
        } else {
            batch.totalNoAmount += commitment.amount;
            batch.noCount++;
        }

        emit BetRevealed(
            poolId,
            msg.sender,
            outcome,
            commitment.amount,
            commitment.batchId
        );
    }

    function settleBatch(PoolKey calldata key, uint256 batchId) external {
        PoolId poolId = key.toId();
        Batch storage batch = batches[poolId][batchId];

        uint256 revealEnd = batch.startTime + BATCH_DURATION + REVEAL_WINDOW;
        if (block.timestamp < revealEnd) revert RevealWindowNotOpen();
        if (batch.settled) return;

        batch.settled = true;

        uint256 totalAmount = batch.totalYesAmount + batch.totalNoAmount;
        uint256 clearingPrice = 0;

        if (totalAmount > 0 && batch.totalYesAmount > 0) {
            clearingPrice = (batch.totalYesAmount * 1e18) / totalAmount;
        }

        emit BatchSettled(
            poolId,
            batchId,
            clearingPrice,
            batch.totalYesAmount,
            batch.totalNoAmount
        );
    }

    function resolveMarket(PoolKey calldata key, bool outcome) external {
        PoolId poolId = key.toId();
        Market storage market = markets[poolId];

        if (market.yesToken == address(0)) revert MarketNotInitialized();
        if (msg.sender != market.oracle) revert OnlyOracle();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp < market.expiry) revert MarketNotExpired();

        market.resolved = true;
        market.outcome = outcome;

        emit MarketResolved(poolId, outcome);
    }

    function claimWinnings(
        PoolKey calldata key,
        bool bettedOutcome,
        bytes32 salt
    ) external {
        PoolId poolId = key.toId();
        Market storage market = markets[poolId];
        Commitment storage commitment = commitments[poolId][msg.sender];

        if (!market.resolved) revert MarketNotResolved();
        if (commitment.commitHash == bytes32(0)) revert NoCommitment();
        if (commitment.executed) revert AlreadyExecuted();

        bytes32 expectedHash = keccak256(
            abi.encodePacked(bettedOutcome, salt, msg.sender)
        );
        if (commitment.commitHash != expectedHash) revert InvalidReveal();

        Batch storage batch = batches[poolId][commitment.batchId];
        if (!batch.settled) revert BatchNotSettled();

        commitment.executed = true;

        if (bettedOutcome != market.outcome) {
            return;
        }

        uint256 totalWinningPool = bettedOutcome
            ? batch.totalYesAmount
            : batch.totalNoAmount;
        uint256 totalLosingPool = bettedOutcome
            ? batch.totalNoAmount
            : batch.totalYesAmount;

        uint256 winnings = commitment.amount;
        if (totalWinningPool > 0) {
            winnings +=
                (commitment.amount * totalLosingPool) /
                totalWinningPool;
        }

        (bool success, ) = payable(msg.sender).call{value: winnings}("");
        if (!success) revert TransferFailed();

        emit WinningsClaimed(poolId, msg.sender, winnings);
    }

    function generateCommitHash(
        bool outcome,
        bytes32 salt,
        address user
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(outcome, salt, user));
    }

    function getCurrentBatchId(
        PoolKey calldata key
    ) external view returns (uint256) {
        return markets[key.toId()].currentBatchId;
    }

    function getBatchInfo(
        PoolKey calldata key,
        uint256 batchId
    ) external view returns (Batch memory) {
        return batches[key.toId()][batchId];
    }

    function getCommitment(
        PoolKey calldata key,
        address user
    ) external view returns (Commitment memory) {
        return commitments[key.toId()][user];
    }

    function getMarket(
        PoolKey calldata key
    ) external view returns (Market memory) {
        return markets[key.toId()];
    }
}
