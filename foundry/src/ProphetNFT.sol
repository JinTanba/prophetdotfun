// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProphecyNFT is ERC721, Ownable {
    IERC20 public stakeToken;
    uint256 public nextTokenId;

    struct ProphecyData {
        address creator;
        uint256 deposit;
        string text;
        uint256[] dates;
        string imageCID;
        uint256 reward;
        bool redeemed;
    }

    mapping(uint256 => ProphecyData) public prophecies;

    event ProphecyCreated(
        address indexed owner,
        uint256 indexed tokenId,
        string sentence,
        uint256 bettingAmount,
        string oracle,
        uint256[] targetDates
    );

    constructor(address _stakeToken)
        ERC721("ProphecyNFT", "PNFT")
    {
        _transferOwnership(msg.sender);  // Ownableの所有権を設定
        stakeToken = IERC20(_stakeToken);
        nextTokenId = 1;
    }

    function createProphecy(
        string memory _sentence,
        uint256 _bettingAmount,
        string memory _oracle,
        uint256[] memory _targetDates
    ) public returns (uint256 tokenId) {
        require(_bettingAmount > 0, "Betting amount must be > 0");

        // コントラクトへERC20をtransferFrom
        bool success = stakeToken.transferFrom(
            msg.sender,
            address(this),
            _bettingAmount
        );
        require(success, "ERC20 transfer failed");

        tokenId = nextTokenId;
        nextTokenId++;

        // ProphecyData 作成
        ProphecyData memory p = ProphecyData({
            creator: msg.sender,
            deposit: _bettingAmount,
            text: _sentence,
            dates: _targetDates,
            imageCID: "",
            reward: 0,
            redeemed: false
        });

        // マッピングに格納
        prophecies[tokenId] = p;

        // NFTをミントしてユーザーに付与
        _safeMint(msg.sender, tokenId);

        // イベントの発行
        emit ProphecyCreated(
            msg.sender,
            tokenId,
            _sentence,
            _bettingAmount,
            _oracle,
            _targetDates
        );

        return tokenId;
    }

    function updateReward(uint256 _tokenId, uint256 _reward) external onlyOwner {
        require(ownerOf(_tokenId) != address(0), "Nonexistent token");
        ProphecyData storage p = prophecies[_tokenId];
        require(!p.redeemed, "Already redeemed");
        p.reward = _reward;
    }

    function redeem(uint256 _tokenId) external {
        require(ownerOf(_tokenId) == msg.sender, "Not NFT owner");
        ProphecyData storage p = prophecies[_tokenId];
        require(!p.redeemed, "Already redeemed");
        require(p.reward > 0, "No reward set");

        uint256 rewardAmount = p.reward;
        p.reward = 0;
        p.redeemed = true;

        bool success = stakeToken.transfer(msg.sender, rewardAmount);
        require(success, "Reward transfer failed");
    }
}