// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IFlashLoanReceiver {
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata params
    ) external returns (bool);
}

/**
 * @title FlashLoan
 * @dev Flash loan protocol for uncollateralized loans
 */
contract FlashLoan is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant FLASH_LOAN_FEE = 9; // 0.09% fee
    uint256 public constant FEE_DENOMINATOR = 10000;

    event FlashLoanExecuted(
        address indexed receiver,
        address indexed token,
        uint256 amount,
        uint256 fee
    );

    /**
     * @dev Execute flash loan
     */
    function flashLoan(
        address receiverAddress,
        address token,
        uint256 amount,
        bytes calldata params
    ) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        IERC20 loanToken = IERC20(token);
        uint256 availableBalance = loanToken.balanceOf(address(this));
        require(availableBalance >= amount, "Insufficient liquidity");

        uint256 fee = (amount * FLASH_LOAN_FEE) / FEE_DENOMINATOR;
        uint256 amountToReturn = amount + fee;

        // Transfer tokens to receiver
        loanToken.safeTransfer(receiverAddress, amount);

        // Execute receiver's logic
        require(
            IFlashLoanReceiver(receiverAddress).executeOperation(
                token,
                amount,
                fee,
                params
            ),
            "Flash loan execution failed"
        );

        // Ensure tokens + fee are returned
        uint256 currentBalance = loanToken.balanceOf(address(this));
        require(
            currentBalance >= availableBalance + fee,
            "Flash loan not repaid"
        );

        emit FlashLoanExecuted(receiverAddress, token, amount, fee);
    }

    /**
     * @dev Deposit tokens to provide liquidity
     */
    function deposit(address token, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @dev Get available liquidity
     */
    function getAvailableLiquidity(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}

/**
 * @title FlashLoanArbitrage
 * @dev Example flash loan arbitrage contract
 */
contract FlashLoanArbitrage is IFlashLoanReceiver {
    using SafeERC20 for IERC20;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /**
     * @dev Execute arbitrage with flash loan
     */
    function executeOperation(
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata params
    ) external override returns (bool) {
        // Decode params (e.g., DEX addresses, swap paths)
        // (address dex1, address dex2) = abi.decode(params, (address, address));

        // Execute arbitrage logic here
        // 1. Swap on DEX1
        // 2. Swap on DEX2
        // 3. Profit should be > fee

        // Approve flash loan contract to take back tokens + fee
        uint256 amountToRepay = amount + fee;
        IERC20(token).safeApprove(msg.sender, amountToRepay);

        return true;
    }

    /**
     * @dev Withdraw profits
     */
    function withdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner, amount);
    }
}
