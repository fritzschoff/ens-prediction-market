// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {OutcomeToken} from "./OutcomeToken.sol";
import {PredictionMarketHook} from "./PredictionMarketHook.sol";

contract MarketFactory {
    IPoolManager public immutable POOL_MANAGER;
    PredictionMarketHook public immutable HOOK;

    uint24 public constant DEFAULT_FEE = 3000;
    int24 public constant DEFAULT_TICK_SPACING = 60;

    struct MarketParams {
        string question;
        address oracle;
        uint256 expiry;
        string ensName;
    }

    struct MarketInfo {
        address yesToken;
        address noToken;
        PoolKey poolKey;
        string question;
        address oracle;
        uint256 expiry;
        address creator;
        string ensName;
    }

    mapping(bytes32 => MarketInfo) public marketInfos;
    bytes32[] public allMarkets;
    mapping(string => bytes32) public ensToMarketId;

    event MarketDeployed(
        bytes32 indexed marketId,
        address yesToken,
        address noToken,
        string question,
        address oracle,
        uint256 expiry,
        address creator,
        string ensName
    );

    event ENSNameUpdated(bytes32 indexed marketId, string ensName);

    error InvalidOracle();
    error InvalidExpiry();
    error EmptyQuestion();
    error NotMarketCreator();
    error ENSNameTaken();

    constructor(IPoolManager _poolManager, PredictionMarketHook _hook) {
        POOL_MANAGER = _poolManager;
        HOOK = _hook;
    }

    function createMarket(
        MarketParams calldata params
    ) external returns (bytes32 marketId) {
        if (params.oracle == address(0)) revert InvalidOracle();
        if (params.expiry <= block.timestamp) revert InvalidExpiry();
        if (bytes(params.question).length == 0) revert EmptyQuestion();
        if (bytes(params.ensName).length > 0 && ensToMarketId[params.ensName] != bytes32(0)) revert ENSNameTaken();

        marketId = keccak256(
            abi.encodePacked(
                params.question,
                params.oracle,
                params.expiry,
                block.timestamp
            )
        );

        string memory yesName = string(
            abi.encodePacked("YES-", params.question)
        );
        string memory noName = string(abi.encodePacked("NO-", params.question));

        OutcomeToken yesToken = new OutcomeToken(
            yesName,
            "YES",
            address(HOOK),
            true
        );
        OutcomeToken noToken = new OutcomeToken(
            noName,
            "NO",
            address(HOOK),
            false
        );

        (address token0, address token1) = address(yesToken) < address(noToken)
            ? (address(yesToken), address(noToken))
            : (address(noToken), address(yesToken));

        PoolKey memory poolKey = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: DEFAULT_FEE,
            tickSpacing: DEFAULT_TICK_SPACING,
            hooks: IHooks(address(HOOK))
        });

        HOOK.initializeMarket(
            poolKey,
            address(yesToken),
            address(noToken),
            params.oracle,
            params.expiry
        );

        uint160 sqrtPriceX96 = 79228162514264337593543950336;
        POOL_MANAGER.initialize(poolKey, sqrtPriceX96);

        marketInfos[marketId] = MarketInfo({
            yesToken: address(yesToken),
            noToken: address(noToken),
            poolKey: poolKey,
            question: params.question,
            oracle: params.oracle,
            expiry: params.expiry,
            creator: msg.sender,
            ensName: params.ensName
        });

        if (bytes(params.ensName).length > 0) {
            ensToMarketId[params.ensName] = marketId;
        }

        allMarkets.push(marketId);

        emit MarketDeployed(
            marketId,
            address(yesToken),
            address(noToken),
            params.question,
            params.oracle,
            params.expiry,
            msg.sender,
            params.ensName
        );
    }

    function setENSName(bytes32 marketId, string calldata ensName) external {
        MarketInfo storage market = marketInfos[marketId];
        if (market.creator != msg.sender) revert NotMarketCreator();
        if (bytes(ensName).length > 0 && ensToMarketId[ensName] != bytes32(0) && ensToMarketId[ensName] != marketId) revert ENSNameTaken();

        if (bytes(market.ensName).length > 0) {
            delete ensToMarketId[market.ensName];
        }

        market.ensName = ensName;
        if (bytes(ensName).length > 0) {
            ensToMarketId[ensName] = marketId;
        }

        emit ENSNameUpdated(marketId, ensName);
    }

    function getMarketByENS(string calldata ensName) external view returns (bytes32) {
        return ensToMarketId[ensName];
    }

    function getMarketInfo(
        bytes32 marketId
    ) external view returns (MarketInfo memory) {
        return marketInfos[marketId];
    }

    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }

    function getMarketIdAt(uint256 index) external view returns (bytes32) {
        return allMarkets[index];
    }
}
