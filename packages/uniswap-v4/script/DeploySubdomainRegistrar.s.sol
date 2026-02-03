// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/SubdomainRegistrar.sol";

contract DeploySubdomainRegistrar is Script {
    bytes32 constant PREDICT_ETH_NODE =
        0x7d43886d34dd05f70d0169e3dd874a6daa2350f498a1dcd2ea5b5a30ca7f1933;

    address constant NAME_WRAPPER_SEPOLIA =
        0x0635513f179D50A207757E05759CbD106d7dFcE8;
    address constant PUBLIC_RESOLVER_SEPOLIA =
        0x8FADE66B79cC9f707aB26799354482EB93a5B7dD;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        SubdomainRegistrar registrar = new SubdomainRegistrar(
            PREDICT_ETH_NODE,
            NAME_WRAPPER_SEPOLIA,
            PUBLIC_RESOLVER_SEPOLIA
        );

        console.log("SubdomainRegistrar deployed at:", address(registrar));

        vm.stopBroadcast();
    }
}
