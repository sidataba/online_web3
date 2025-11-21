// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SoulBoundToken (SBT)
 * @dev Non-transferable NFT for reputation and identity
 */
contract SoulBoundToken is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct SBTData {
        string category; // e.g., "Achievement", "Reputation", "Certification"
        string metadata;
        uint256 issuedAt;
        uint256 expiresAt; // 0 for no expiration
        bool revoked;
    }

    mapping(uint256 => SBTData) public sbtData;
    mapping(address => uint256[]) public userTokens;

    event SBTIssued(
        address indexed to,
        uint256 indexed tokenId,
        string category,
        string metadata
    );
    event SBTRevoked(uint256 indexed tokenId);

    constructor(address initialOwner) ERC721("SoulBoundToken", "SBT") Ownable(initialOwner) {
        _tokenIdCounter.increment(); // Start at 1
    }

    /**
     * @dev Issue a Soul Bound Token
     */
    function issue(
        address to,
        string memory category,
        string memory metadata,
        uint256 expiresAt
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid address");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);

        sbtData[tokenId] = SBTData({
            category: category,
            metadata: metadata,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false
        });

        userTokens[to].push(tokenId);

        emit SBTIssued(to, tokenId, category, metadata);
        return tokenId;
    }

    /**
     * @dev Revoke a Soul Bound Token
     */
    function revoke(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        sbtData[tokenId].revoked = true;
        emit SBTRevoked(tokenId);
    }

    /**
     * @dev Check if token is valid (not revoked or expired)
     */
    function isValid(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) return false;

        SBTData memory data = sbtData[tokenId];

        if (data.revoked) return false;
        if (data.expiresAt != 0 && block.timestamp > data.expiresAt) return false;

        return true;
    }

    /**
     * @dev Get all tokens owned by an address
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return userTokens[owner];
    }

    /**
     * @dev Get token data
     */
    function getTokenData(uint256 tokenId)
        external
        view
        returns (
            string memory category,
            string memory metadata,
            uint256 issuedAt,
            uint256 expiresAt,
            bool revoked,
            bool valid
        )
    {
        require(_exists(tokenId), "Token does not exist");
        SBTData memory data = sbtData[tokenId];
        return (
            data.category,
            data.metadata,
            data.issuedAt,
            data.expiresAt,
            data.revoked,
            isValid(tokenId)
        );
    }

    /**
     * @dev Override transfer functions to make non-transferable
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        require(from == address(0), "Soul Bound Tokens cannot be transferred");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Disable approvals
     */
    function approve(address, uint256) public virtual override {
        revert("Soul Bound Tokens cannot be approved");
    }

    function setApprovalForAll(address, bool) public virtual override {
        revert("Soul Bound Tokens cannot be approved");
    }
}
