// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleStorage
 * @dev A simple contract for storing and retrieving values
 */
contract SimpleStorage {
    uint256 private storedValue;
    mapping(address => uint256) private userValues;

    event ValueChanged(address indexed user, uint256 newValue);

    /**
     * @dev Store a value
     * @param value The value to store
     */
    function set(uint256 value) public {
        storedValue = value;
        userValues[msg.sender] = value;
        emit ValueChanged(msg.sender, value);
    }

    /**
     * @dev Retrieve the stored value
     * @return The stored value
     */
    function get() public view returns (uint256) {
        return storedValue;
    }

    /**
     * @dev Retrieve the value stored by a specific user
     * @param user The user address
     * @return The value stored by the user
     */
    function getUserValue(address user) public view returns (uint256) {
        return userValues[user];
    }
}
