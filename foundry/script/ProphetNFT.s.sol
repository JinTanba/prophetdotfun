// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.1;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import {ProphecyNFT} from "../src/ProphetNFT.sol";
import {FaucetUSDC} from "../src/FaucetUSDC.sol";

contract ProphetNFTScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // まずFaucetUSDCをデプロイ
        FaucetUSDC usdc = new FaucetUSDC();
        console.log("FaucetUSDC deployed at:", address(usdc));

        // ProphetNFTをデプロイ（USDCアドレスを渡す）
        ProphecyNFT prophet = new ProphecyNFT(address(usdc));
        console.log("ProphecyNFT deployed at:", address(prophet));

        vm.stopBroadcast();
    }
} 