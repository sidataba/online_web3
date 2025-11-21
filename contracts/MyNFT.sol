// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MyNFT
 * @dev A simple ERC721 NFT contract with minting capabilities
 */
contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public mintPrice = 0.01 ether;
    bool public publicMintEnabled = true;

    event NFTMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);

    constructor(address initialOwner) ERC721("MyNFT", "MNFT") Ownable(initialOwner) {
        // Start token IDs at 1
        _tokenIdCounter.increment();
    }

    /**
     * @dev Mint a new NFT
     * @param tokenURI The metadata URI for the NFT
     */
    function mint(string memory tokenURI) public payable returns (uint256) {
        require(publicMintEnabled, "Public minting is disabled");
        require(_tokenIdCounter.current() <= MAX_SUPPLY, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit NFTMinted(msg.sender, tokenId, tokenURI);

        return tokenId;
    }

    /**
     * @dev Owner can mint NFTs for free
     * @param to Recipient address
     * @param tokenURI The metadata URI for the NFT
     */
    function ownerMint(address to, string memory tokenURI) public onlyOwner returns (uint256) {
        require(_tokenIdCounter.current() <= MAX_SUPPLY, "Max supply reached");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit NFTMinted(to, tokenId, tokenURI);

        return tokenId;
    }

    /**
     * @dev Set the mint price (only owner)
     * @param newPrice New mint price in wei
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }

    /**
     * @dev Toggle public minting (only owner)
     */
    function togglePublicMint() public onlyOwner {
        publicMintEnabled = !publicMintEnabled;
    }

    /**
     * @dev Get total number of minted NFTs
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current() - 1;
    }

    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
