// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FaucetUSDC is ERC20 {
    constructor() ERC20("Faucet USDC", "FUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function faucet() external {
        _mint(msg.sender, 1000 * 10**6);
    }

    function mint() public {
        _mint(msg.sender, 5000 * 10**6); // 5000 USDC (6 decimals)
    }
} 