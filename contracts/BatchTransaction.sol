// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BatchTransaction
 * @dev Execute multiple transactions in a single call
 */
contract BatchTransaction is ReentrancyGuard {

    event BatchExecuted(address indexed sender, uint256 transactionCount);
    event TransactionFailed(uint256 indexed index, bytes reason);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
    }

    /**
     * @dev Execute multiple transactions
     */
    function executeBatch(Transaction[] calldata transactions)
        external
        payable
        nonReentrant
        returns (bool[] memory results)
    {
        require(transactions.length > 0, "Empty batch");
        results = new bool[](transactions.length);

        uint256 totalValue = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            totalValue += transactions[i].value;
        }
        require(msg.value >= totalValue, "Insufficient ETH sent");

        for (uint256 i = 0; i < transactions.length; i++) {
            (bool success, bytes memory returnData) = transactions[i].to.call{
                value: transactions[i].value
            }(transactions[i].data);

            results[i] = success;

            if (!success) {
                emit TransactionFailed(i, returnData);
            }
        }

        // Refund excess ETH
        if (msg.value > totalValue) {
            payable(msg.sender).transfer(msg.value - totalValue);
        }

        emit BatchExecuted(msg.sender, transactions.length);
        return results;
    }

    /**
     * @dev Execute batch with revert on failure
     */
    function executeBatchStrict(Transaction[] calldata transactions)
        external
        payable
        nonReentrant
    {
        require(transactions.length > 0, "Empty batch");

        uint256 totalValue = 0;
        for (uint256 i = 0; i < transactions.length; i++) {
            totalValue += transactions[i].value;
        }
        require(msg.value >= totalValue, "Insufficient ETH sent");

        for (uint256 i = 0; i < transactions.length; i++) {
            (bool success, bytes memory returnData) = transactions[i].to.call{
                value: transactions[i].value
            }(transactions[i].data);

            require(success, string(returnData));
        }

        // Refund excess ETH
        if (msg.value > totalValue) {
            payable(msg.sender).transfer(msg.value - totalValue);
        }

        emit BatchExecuted(msg.sender, transactions.length);
    }

    receive() external payable {}
}
