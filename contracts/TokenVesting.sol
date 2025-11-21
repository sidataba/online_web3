// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenVesting
 * @dev Token vesting contract with cliff and linear vesting schedule
 */
contract TokenVesting is Ownable {
    using SafeERC20 for IERC20;

    struct VestingSchedule {
        bool initialized;
        address beneficiary;
        uint256 cliff;
        uint256 start;
        uint256 duration;
        uint256 slicePeriodSeconds;
        bool revocable;
        uint256 amountTotal;
        uint256 released;
        bool revoked;
    }

    IERC20 public token;
    bytes32[] private vestingSchedulesIds;
    mapping(bytes32 => VestingSchedule) private vestingSchedules;
    uint256 private vestingSchedulesTotalAmount;
    mapping(address => uint256) private holdersVestingCount;

    event VestingScheduleCreated(
        bytes32 indexed vestingScheduleId,
        address indexed beneficiary,
        uint256 amount
    );

    event TokensReleased(
        bytes32 indexed vestingScheduleId,
        address indexed beneficiary,
        uint256 amount
    );

    event VestingRevoked(bytes32 indexed vestingScheduleId);

    constructor(address _token, address initialOwner) Ownable(initialOwner) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
    }

    /**
     * @dev Create a new vesting schedule
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 start,
        uint256 cliff,
        uint256 duration,
        uint256 slicePeriodSeconds,
        bool revocable,
        uint256 amount
    ) external onlyOwner {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(duration > 0, "Duration must be > 0");
        require(amount > 0, "Amount must be > 0");
        require(slicePeriodSeconds >= 1, "Slice period too small");

        bytes32 vestingScheduleId = computeVestingScheduleIdForAddressAndIndex(
            beneficiary,
            holdersVestingCount[beneficiary]
        );

        uint256 currentVestingAmount = vestingSchedulesTotalAmount;
        require(
            currentVestingAmount + amount <= token.balanceOf(address(this)),
            "Insufficient tokens"
        );

        vestingSchedules[vestingScheduleId] = VestingSchedule(
            true,
            beneficiary,
            cliff,
            start,
            duration,
            slicePeriodSeconds,
            revocable,
            amount,
            0,
            false
        );

        vestingSchedulesTotalAmount += amount;
        vestingSchedulesIds.push(vestingScheduleId);
        holdersVestingCount[beneficiary]++;

        emit VestingScheduleCreated(vestingScheduleId, beneficiary, amount);
    }

    /**
     * @dev Release vested tokens
     */
    function release(bytes32 vestingScheduleId) external {
        VestingSchedule storage vestingSchedule = vestingSchedules[vestingScheduleId];
        require(vestingSchedule.initialized, "Vesting schedule not found");
        require(!vestingSchedule.revoked, "Vesting revoked");

        uint256 vestedAmount = _computeReleasableAmount(vestingSchedule);
        require(vestedAmount > 0, "No tokens to release");

        vestingSchedule.released += vestedAmount;
        vestingSchedulesTotalAmount -= vestedAmount;

        token.safeTransfer(vestingSchedule.beneficiary, vestedAmount);

        emit TokensReleased(vestingScheduleId, vestingSchedule.beneficiary, vestedAmount);
    }

    /**
     * @dev Revoke vesting schedule
     */
    function revoke(bytes32 vestingScheduleId) external onlyOwner {
        VestingSchedule storage vestingSchedule = vestingSchedules[vestingScheduleId];
        require(vestingSchedule.initialized, "Vesting schedule not found");
        require(vestingSchedule.revocable, "Not revocable");
        require(!vestingSchedule.revoked, "Already revoked");

        uint256 vestedAmount = _computeReleasableAmount(vestingSchedule);
        if (vestedAmount > 0) {
            vestingSchedule.released += vestedAmount;
            token.safeTransfer(vestingSchedule.beneficiary, vestedAmount);
        }

        uint256 unreleased = vestingSchedule.amountTotal - vestingSchedule.released;
        vestingSchedulesTotalAmount -= unreleased;
        vestingSchedule.revoked = true;

        emit VestingRevoked(vestingScheduleId);
    }

    /**
     * @dev Compute releasable amount
     */
    function computeReleasableAmount(bytes32 vestingScheduleId)
        external
        view
        returns (uint256)
    {
        VestingSchedule storage vestingSchedule = vestingSchedules[vestingScheduleId];
        return _computeReleasableAmount(vestingSchedule);
    }

    /**
     * @dev Get vesting schedule
     */
    function getVestingSchedule(bytes32 vestingScheduleId)
        external
        view
        returns (
            address beneficiary,
            uint256 cliff,
            uint256 start,
            uint256 duration,
            uint256 amountTotal,
            uint256 released,
            bool revoked
        )
    {
        VestingSchedule storage vestingSchedule = vestingSchedules[vestingScheduleId];
        require(vestingSchedule.initialized, "Vesting schedule not found");
        return (
            vestingSchedule.beneficiary,
            vestingSchedule.cliff,
            vestingSchedule.start,
            vestingSchedule.duration,
            vestingSchedule.amountTotal,
            vestingSchedule.released,
            vestingSchedule.revoked
        );
    }

    /**
     * @dev Compute vesting schedule ID
     */
    function computeVestingScheduleIdForAddressAndIndex(address holder, uint256 index)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(holder, index));
    }

    /**
     * @dev Get holder vesting count
     */
    function getVestingSchedulesCountByBeneficiary(address beneficiary)
        external
        view
        returns (uint256)
    {
        return holdersVestingCount[beneficiary];
    }

    /**
     * @dev Internal compute releasable amount
     */
    function _computeReleasableAmount(VestingSchedule memory vestingSchedule)
        internal
        view
        returns (uint256)
    {
        if (block.timestamp < vestingSchedule.start + vestingSchedule.cliff) {
            return 0;
        }

        if (
            block.timestamp >= vestingSchedule.start + vestingSchedule.duration ||
            vestingSchedule.revoked
        ) {
            return vestingSchedule.amountTotal - vestingSchedule.released;
        }

        uint256 timeFromStart = block.timestamp - vestingSchedule.start;
        uint256 vestedSlicePeriods = timeFromStart / vestingSchedule.slicePeriodSeconds;
        uint256 vestedSeconds = vestedSlicePeriods * vestingSchedule.slicePeriodSeconds;
        uint256 vestedAmount = (vestingSchedule.amountTotal * vestedSeconds) /
            vestingSchedule.duration;

        return vestedAmount - vestingSchedule.released;
    }

    /**
     * @dev Withdraw excess tokens
     */
    function withdraw(uint256 amount) external onlyOwner {
        uint256 available = token.balanceOf(address(this)) - vestingSchedulesTotalAmount;
        require(amount <= available, "Insufficient available tokens");
        token.safeTransfer(owner(), amount);
    }
}
