// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FaucetUSDC is ERC20 {
    constructor() ERC20("Faucet USDC", "FUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function faucet() external {
        _mint(msg.sender, 1000 * 10**6);
    }
} 