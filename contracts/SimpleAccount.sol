// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SimpleAccount (Account Abstraction inspired)
 * @dev Smart contract wallet with meta-transaction support
 */
contract SimpleAccount is ReentrancyGuard {
    using ECDSA for bytes32;

    address public owner;
    uint256 public nonce;

    event Executed(address indexed target, uint256 value, bytes data);
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);
    event Deposited(address indexed sender, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    /**
     * @dev Execute a transaction
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwner nonReentrant returns (bytes memory) {
        require(target != address(0), "Invalid target");

        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Execution failed");

        emit Executed(target, value, data);
        return result;
    }

    /**
     * @dev Execute transaction with signature (meta-transaction)
     */
    function executeWithSignature(
        address target,
        uint256 value,
        bytes calldata data,
        bytes calldata signature
    ) external nonReentrant returns (bytes memory) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(address(this), target, value, data, nonce)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);

        require(signer == owner, "Invalid signature");

        nonce++;

        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Execution failed");

        emit Executed(target, value, data);
        return result;
    }

    /**
     * @dev Batch execute multiple transactions
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external onlyOwner nonReentrant {
        require(
            targets.length == values.length && values.length == datas.length,
            "Length mismatch"
        );

        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, ) = targets[i].call{value: values[i]}(datas[i]);
            require(success, "Batch execution failed");
            emit Executed(targets[i], values[i], datas[i]);
        }
    }

    /**
     * @dev Change owner
     */
    function changeOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnerChanged(previousOwner, newOwner);
    }

    /**
     * @dev Deposit ETH
     */
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @dev Get message hash for signing
     */
    function getMessageHash(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 _nonce
    ) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), target, value, data, _nonce));
    }
}

/**
 * @title AccountFactory
 * @dev Factory to deploy smart wallets
 */
contract AccountFactory {
    event AccountCreated(address indexed owner, address indexed account);

    mapping(address => address[]) public accountsByOwner;

    function createAccount(address owner) external returns (address) {
        SimpleAccount account = new SimpleAccount(owner);
        accountsByOwner[owner].push(address(account));
        emit AccountCreated(owner, address(account));
        return address(account);
    }

    function getAccounts(address owner) external view returns (address[] memory) {
        return accountsByOwner[owner];
    }
}
