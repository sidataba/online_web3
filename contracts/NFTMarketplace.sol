// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMarketplace
 * @dev Decentralized marketplace for buying and selling NFTs
 */
contract NFTMarketplace is ReentrancyGuard, Ownable {

    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    struct Offer {
        address buyer;
        uint256 price;
        uint256 timestamp;
        bool active;
    }

    uint256 public listingCounter;
    uint256 public platformFee = 250; // 2.5% in basis points
    uint256 public constant FEE_DENOMINATOR = 10000;

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer[]) public offers;
    mapping(address => uint256) public earnings;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );

    event Sale(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );

    event ListingCancelled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 newPrice);
    event OfferMade(uint256 indexed listingId, address indexed buyer, uint256 price);
    event OfferAccepted(uint256 indexed listingId, uint256 offerIndex);
    event OfferCancelled(uint256 indexed listingId, uint256 offerIndex);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev List an NFT for sale
     */
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be greater than 0");
        require(
            IERC721(nftContract).ownerOf(tokenId) == msg.sender,
            "Not the owner"
        );
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        uint256 listingId = listingCounter++;

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit Listed(listingId, msg.sender, nftContract, tokenId, price);
        return listingId;
    }

    /**
     * @dev Buy an NFT
     */
    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");

        listing.active = false;

        // Calculate fees
        uint256 fee = (listing.price * platformFee) / FEE_DENOMINATOR;
        uint256 sellerAmount = listing.price - fee;

        // Transfer NFT to buyer
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Transfer payments
        earnings[listing.seller] += sellerAmount;
        earnings[owner()] += fee;

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit Sale(listingId, msg.sender, listing.seller, listing.price);
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");

        listing.active = false;
        emit ListingCancelled(listingId);
    }

    /**
     * @dev Update listing price
     */
    function updatePrice(uint256 listingId, uint256 newPrice) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");
        require(newPrice > 0, "Price must be greater than 0");

        listing.price = newPrice;
        emit PriceUpdated(listingId, newPrice);
    }

    /**
     * @dev Make an offer on a listing
     */
    function makeOffer(uint256 listingId) external payable nonReentrant {
        require(listings[listingId].active, "Listing not active");
        require(msg.value > 0, "Offer must be greater than 0");

        offers[listingId].push(Offer({
            buyer: msg.sender,
            price: msg.value,
            timestamp: block.timestamp,
            active: true
        }));

        emit OfferMade(listingId, msg.sender, msg.value);
    }

    /**
     * @dev Accept an offer
     */
    function acceptOffer(uint256 listingId, uint256 offerIndex) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Listing not active");

        Offer storage offer = offers[listingId][offerIndex];
        require(offer.active, "Offer not active");

        listing.active = false;
        offer.active = false;

        // Calculate fees
        uint256 fee = (offer.price * platformFee) / FEE_DENOMINATOR;
        uint256 sellerAmount = offer.price - fee;

        // Transfer NFT
        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            offer.buyer,
            listing.tokenId
        );

        // Transfer payments
        earnings[listing.seller] += sellerAmount;
        earnings[owner()] += fee;

        emit OfferAccepted(listingId, offerIndex);
        emit Sale(listingId, offer.buyer, listing.seller, offer.price);
    }

    /**
     * @dev Cancel an offer and refund
     */
    function cancelOffer(uint256 listingId, uint256 offerIndex) external nonReentrant {
        Offer storage offer = offers[listingId][offerIndex];
        require(offer.buyer == msg.sender, "Not the offer maker");
        require(offer.active, "Offer not active");

        offer.active = false;
        payable(msg.sender).transfer(offer.price);

        emit OfferCancelled(listingId, offerIndex);
    }

    /**
     * @dev Withdraw earnings
     */
    function withdrawEarnings() external nonReentrant {
        uint256 amount = earnings[msg.sender];
        require(amount > 0, "No earnings to withdraw");

        earnings[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    /**
     * @dev Get all offers for a listing
     */
    function getOffers(uint256 listingId) external view returns (Offer[] memory) {
        return offers[listingId];
    }

    /**
     * @dev Update platform fee (owner only)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = newFee;
    }

    /**
     * @dev Support receiving NFTs
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
