// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {OutcomeToken} from "./OutcomeToken.sol";

contract PredictionMarketHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    struct Market {
        address yesToken;
        address noToken;
        address oracle;
        uint256 expiry;
        bool resolved;
        bool outcome;
        uint256 totalCollateral;
    }

    mapping(PoolId => Market) public markets;

    event MarketCreated(
        PoolId indexed poolId,
        address yesToken,
        address noToken,
        address oracle,
        uint256 expiry
    );
    event MarketResolved(PoolId indexed poolId, bool outcome);
    event PositionMinted(PoolId indexed poolId, address indexed user, uint256 amount);
    event BetPlaced(PoolId indexed poolId, address indexed user, bool outcome, uint256 amount);
    event WinningsClaimed(PoolId indexed poolId, address indexed user, uint256 amount);

    error MarketExpired();
    error MarketNotExpired();
    error MarketAlreadyResolved();
    error MarketNotResolved();
    error OnlyOracle();
    error InvalidExpiry();
    error NoWinnings();
    error MarketNotInitialized();
    error InvalidAmount();
    error TransferFailed();

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {}

    receive() external payable {}

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: true,
            afterInitialize: true,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
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
            totalCollateral: 0
        });

        emit MarketCreated(poolId, yesToken, noToken, oracle, expiry);
    }

    function _beforeInitialize(address, PoolKey calldata, uint160) internal pure override returns (bytes4) {
        return BaseHook.beforeInitialize.selector;
    }

    function _afterInitialize(address, PoolKey calldata, uint160, int24) internal pure override returns (bytes4) {
        return BaseHook.afterInitialize.selector;
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

    function _beforeRemoveLiquidity(
        address,
        PoolKey calldata key,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal view override returns (bytes4) {
        PoolId poolId = key.toId();
        Market storage market = markets[poolId];

        if (market.yesToken == address(0)) revert MarketNotInitialized();

        return BaseHook.beforeRemoveLiquidity.selector;
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

        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function _afterSwap(
        address,
        PoolKey calldata,
        SwapParams calldata,
        BalanceDelta,
        bytes calldata
    ) internal pure override returns (bytes4, int128) {
        return (BaseHook.afterSwap.selector, 0);
    }

    function mintPosition(PoolKey calldata key) external payable {
        if (msg.value == 0) revert InvalidAmount();

        PoolId poolId = key.toId();
        Market storage market = markets[poolId];

        if (market.yesToken == address(0)) revert MarketNotInitialized();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp >= market.expiry) revert MarketExpired();

        OutcomeToken(market.yesToken).mint(msg.sender, msg.value);
        OutcomeToken(market.noToken).mint(msg.sender, msg.value);

        market.totalCollateral += msg.value;

        emit PositionMinted(poolId, msg.sender, msg.value);
    }

    function betOnOutcome(PoolKey calldata key, bool outcome) external payable {
        if (msg.value == 0) revert InvalidAmount();

        PoolId poolId = key.toId();
        Market storage market = markets[poolId];

        if (market.yesToken == address(0)) revert MarketNotInitialized();
        if (market.resolved) revert MarketAlreadyResolved();
        if (block.timestamp >= market.expiry) revert MarketExpired();

        address tokenToMint = outcome ? market.yesToken : market.noToken;
        OutcomeToken(tokenToMint).mint(msg.sender, msg.value);

        market.totalCollateral += msg.value;

        emit BetPlaced(poolId, msg.sender, outcome, msg.value);
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

    function claimWinnings(PoolKey calldata key) external {
        PoolId poolId = key.toId();
        Market storage market = markets[poolId];

        if (!market.resolved) revert MarketNotResolved();

        address winningToken = market.outcome ? market.yesToken : market.noToken;
        uint256 balance = OutcomeToken(winningToken).balanceOf(msg.sender);

        if (balance == 0) revert NoWinnings();

        OutcomeToken(winningToken).burn(msg.sender, balance);

        (bool success, ) = msg.sender.call{value: balance}("");
        if (!success) revert TransferFailed();

        emit WinningsClaimed(poolId, msg.sender, balance);
    }

    function getMarket(PoolKey calldata key) external view returns (Market memory) {
        return markets[key.toId()];
    }
}
