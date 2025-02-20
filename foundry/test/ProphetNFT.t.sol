// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {ProphecyNFT} from "../src/ProphetNFT.sol";
import {FaucetUSDC} from "../src/FaucetUSDC.sol";

contract ProphecyNFTTest is Test {
    ProphecyNFT public prophet;
    FaucetUSDC public usdc;
    address public user = address(0x1);

    function setUp() public {
        // まずFaucetUSDCをデプロイ
        usdc = new FaucetUSDC();
        
        // ProphetNFTをデプロイ
        prophet = new ProphecyNFT(address(usdc));

        // ユーザーにUSDCを付与
        vm.startPrank(user);
        usdc.mint();
        usdc.approve(address(prophet), type(uint256).max);
        vm.stopPrank();
    }

    function test_CreateProphecy() public {
        vm.startPrank(user);

        string memory sentence = "I think next iphone is se 4";
        uint256 amount = 10_000_000; // 10 USDC
        string memory oracle = "BBC";
        uint256[] memory targetDates = new uint256[](1);
        targetDates[0] = block.timestamp + 1 days;

        // 実行前の状態を確認
        console2.log("User USDC balance:", usdc.balanceOf(user));
        console2.log("Prophet allowance:", usdc.allowance(user, address(prophet)));

        // createProphecyを実行
        uint256 tokenId = prophet.createProphecy(
            sentence,
            amount,
            oracle,
            targetDates
        );

        // 結果を確認
        console2.log("Created prophecy with token ID:", tokenId);
        
        vm.stopPrank();
    }

    function test_CreateProphecyWithDateRange() public {
        vm.startPrank(user);

        string memory sentence = "I think next iphone is se 4";
        uint256 amount = 10_000_000; // 10 USDC
        string memory oracle = "BBC";
        uint256[] memory targetDates = new uint256[](2);
        targetDates[0] = block.timestamp + 1 days;
        targetDates[1] = block.timestamp + 2 days;

        // createProphecyを実行
        uint256 tokenId = prophet.createProphecy(
            sentence,
            amount,
            oracle,
            targetDates
        );

        console2.log("Created prophecy with date range, token ID:", tokenId);
        
        vm.stopPrank();
    }
} 