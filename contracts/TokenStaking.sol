// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenStaking
 * @dev Staking contract with rewards mechanism
 */
contract TokenStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    IERC20 public stakingToken;
    IERC20 public rewardToken;

    uint256 public rewardRate = 100; // 100 tokens per day per token staked
    uint256 public constant REWARD_PRECISION = 1e18;
    uint256 public constant SECONDS_PER_DAY = 86400;

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }

    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    uint256 public minStakingAmount = 100 * 10**18; // 100 tokens minimum
    uint256 public lockPeriod = 7 days; // 7 days lock period

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate);

    constructor(
        address _stakingToken,
        address _rewardToken,
        address initialOwner
    ) Ownable(initialOwner) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    /**
     * @dev Stake tokens
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount >= minStakingAmount, "Amount below minimum");

        // Claim any pending rewards first
        if (stakes[msg.sender].amount > 0) {
            _claimRewards();
        }

        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 amount) external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");
        require(
            block.timestamp >= userStake.timestamp + lockPeriod,
            "Lock period not ended"
        );

        // Claim rewards first
        _claimRewards();

        userStake.amount -= amount;
        totalStaked -= amount;

        stakingToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @dev Claim rewards
     */
    function claimRewards() external nonReentrant {
        _claimRewards();
    }

    /**
     * @dev Internal claim rewards logic
     */
    function _claimRewards() internal {
        uint256 reward = calculateReward(msg.sender);
        if (reward > 0) {
            stakes[msg.sender].rewardDebt += reward;
            stakes[msg.sender].timestamp = block.timestamp;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    /**
     * @dev Calculate pending rewards
     */
    function calculateReward(address user) public view returns (uint256) {
        Stake memory userStake = stakes[user];
        if (userStake.amount == 0) return 0;

        uint256 stakingDuration = block.timestamp - userStake.timestamp;
        uint256 reward = (userStake.amount * rewardRate * stakingDuration) /
                        (SECONDS_PER_DAY * REWARD_PRECISION);

        return reward;
    }

    /**
     * @dev Get user staking info
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 timestamp,
        uint256 pendingReward,
        uint256 unlockTime
    ) {
        Stake memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.timestamp,
            calculateReward(user),
            userStake.timestamp + lockPeriod
        );
    }

    /**
     * @dev Update reward rate (owner only)
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    /**
     * @dev Update minimum staking amount
     */
    function setMinStakingAmount(uint256 amount) external onlyOwner {
        minStakingAmount = amount;
    }

    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}
