// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ProphetNFT.sol";

contract ProphetNFTScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("ADMIN_PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS"); // デプロイしたFaucetUSDCのアドレス
        
        vm.startBroadcast(deployerPrivateKey);
        
        ProphetNFT prophet = new ProphetNFT(usdcAddress);
        
        vm.stopBroadcast();

        console.log("ProphetNFT deployed to:", address(prophet));
    }
} 