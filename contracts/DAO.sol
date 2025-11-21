// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DAO
 * @dev Decentralized Autonomous Organization with governance and voting
 */
contract DAO is ReentrancyGuard {

    IERC20 public governanceToken;

    enum ProposalState {
        Pending,
        Active,
        Cancelled,
        Defeated,
        Succeeded,
        Executed
    }

    enum VoteType {
        Against,
        For,
        Abstain
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => VoteType) votes;
    }

    uint256 public proposalCount;
    uint256 public votingDelay = 1; // 1 block
    uint256 public votingPeriod = 50400; // ~7 days in blocks
    uint256 public proposalThreshold = 1000 * 10**18; // 1000 tokens to propose
    uint256 public quorumVotes = 4; // 4% of total supply

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public latestProposalIds;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 startBlock,
        uint256 endBlock
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        VoteType voteType,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    constructor(address _governanceToken) {
        governanceToken = IERC20(_governanceToken);
    }

    /**
     * @dev Create a new proposal
     */
    function propose(
        string memory title,
        string memory description
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= proposalThreshold,
            "Insufficient tokens to propose"
        );

        uint256 proposalId = proposalCount++;
        Proposal storage newProposal = proposals[proposalId];

        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.startBlock = block.number + votingDelay;
        newProposal.endBlock = block.number + votingDelay + votingPeriod;

        latestProposalIds[msg.sender] = proposalId;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            title,
            newProposal.startBlock,
            newProposal.endBlock
        );

        return proposalId;
    }

    /**
     * @dev Cast a vote on a proposal
     */
    function castVote(uint256 proposalId, VoteType voteType) external nonReentrant {
        Proposal storage proposal = proposals[proposalId];
        require(state(proposalId) == ProposalState.Active, "Voting is closed");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;
        proposal.votes[msg.sender] = voteType;

        if (voteType == VoteType.For) {
            proposal.forVotes += weight;
        } else if (voteType == VoteType.Against) {
            proposal.againstVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }

        emit VoteCast(msg.sender, proposalId, voteType, weight);
    }

    /**
     * @dev Execute a successful proposal
     */
    function execute(uint256 proposalId) external nonReentrant {
        require(
            state(proposalId) == ProposalState.Succeeded,
            "Proposal not succeeded"
        );

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal
     */
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(msg.sender == proposal.proposer, "Not proposer");
        require(state(proposalId) == ProposalState.Pending, "Cannot cancel");

        proposal.executed = true; // Use executed flag to mark as cancelled

        emit ProposalCancelled(proposalId);
    }

    /**
     * @dev Get proposal state
     */
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.number <= proposal.startBlock) {
            return ProposalState.Pending;
        }

        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 quorum = (governanceToken.totalSupply() * quorumVotes) / 100;

        if (totalVotes < quorum || proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.Defeated;
        }

        return ProposalState.Succeeded;
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 proposalId)
        external
        view
        returns (
            address proposer,
            string memory title,
            string memory description,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 abstainVotes,
            uint256 startBlock,
            uint256 endBlock,
            ProposalState currentState
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.abstainVotes,
            proposal.startBlock,
            proposal.endBlock,
            state(proposalId)
        );
    }

    /**
     * @dev Check if user has voted
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    /**
     * @dev Get user vote
     */
    function getVote(uint256 proposalId, address voter) external view returns (VoteType) {
        require(proposals[proposalId].hasVoted[voter], "Has not voted");
        return proposals[proposalId].votes[voter];
    }
}
