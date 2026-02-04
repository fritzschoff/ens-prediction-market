// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PrivateBettingHook} from "../src/PrivateBettingHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";

contract DeployPrivateBettingHookScript is Script {
    address constant SEPOLIA_POOL_MANAGER =
        0x8C4BcBE6b9eF47855f97E675296FA3F6fafa5F1A;

    address constant CREATE2_DEPLOYER =
        address(0x4e59b44847b379578588920cA78FbF26c0B4956C);

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        IPoolManager poolManager = IPoolManager(SEPOLIA_POOL_MANAGER);

        uint160 flags = uint160(
            Hooks.BEFORE_INITIALIZE_FLAG |
                Hooks.BEFORE_ADD_LIQUIDITY_FLAG |
                Hooks.BEFORE_SWAP_FLAG
        );

        bytes memory constructorArgs = abi.encode(poolManager);
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            type(PrivateBettingHook).creationCode,
            constructorArgs
        );

        console.log("Deployer address:", deployer);
        console.log("CREATE2 Deployer:", CREATE2_DEPLOYER);
        console.log("Target hook address:", hookAddress);
        console.log("Salt:", vm.toString(salt));

        if (hookAddress.code.length > 0) {
            console.log("Hook already deployed at:", hookAddress);
            vm.stopBroadcast();
            return;
        }

        PrivateBettingHook hook = new PrivateBettingHook{salt: salt}(
            poolManager
        );

        console.log("Actual hook address:", address(hook));
        require(address(hook) == hookAddress, "Hook address mismatch");

        console.log("\n=== Deployment Summary ===");
        console.log("PrivateBettingHook:", address(hook));

        vm.stopBroadcast();
    }
}

