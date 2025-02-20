// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "forge-std/Script.sol";
import "../src/FaucetUSDC.sol";

contract FaucetUSDCScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        FaucetUSDC fusdc = new FaucetUSDC();
        
        vm.stopBroadcast();

        console.log("FaucetUSDC deployed to:", address(fusdc));
    }
} 