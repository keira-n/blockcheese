
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RoleManager
 * @dev Manages authorised participants in BlockCheese
 */

contract RoleManager is AccessControl {

    bytes32 public constant FARMER_ROLE =
    keccak256("FARMER_ROLE");

    bytes32 public constant CHEESEMAKER_ROLE =
    keccak256("CHEESEMAKER_ROLE");

    bytes32 public constant DISTRIBUTOR_ROLE =
    keccak256("DISTRIBUTOR_ROLE");

    bytes32 public constant RETAILER_ROLE =
    keccak256("RETAILER_ROLE");

    event ParticipantRegistered(
        address indexed account,
        bytes32 indexed role
    );

    event ParticipantRemoved(
        address indexed account,
        bytes32 indexed role
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier validAddress(address account) {
        require(account != address(0), "Invalid address");
        _;
    }

    function registerFarmer(address account)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
    validAddress(account)
    {
        grantRole(FARMER_ROLE, account);
        emit ParticipantRegistered(account, FARMER_ROLE);
    }

    function registerCheesemaker(address account)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
    validAddress(account)
    {
        grantRole(CHEESEMAKER_ROLE, account);
        emit ParticipantRegistered(account, CHEESEMAKER_ROLE);
    }

    function registerDistributor(address account)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
    validAddress(account)
    {
        grantRole(DISTRIBUTOR_ROLE, account);
        emit ParticipantRegistered(account, DISTRIBUTOR_ROLE);
    }

    function registerRetailer(address account)
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
    validAddress(account)
    {
        grantRole(RETAILER_ROLE, account);
        emit ParticipantRegistered(account, RETAILER_ROLE);
    }

    function removeParticipant(
        address account,
        bytes32 role
    )
    external
    onlyRole(DEFAULT_ADMIN_ROLE)
    validAddress(account)
    {
        require(
            role != DEFAULT_ADMIN_ROLE,
            "Cannot remove admin through this function"
        );

        revokeRole(role, account);
        emit ParticipantRemoved(account, role);
    }

    function isFarmer(address account)
    external
    view
    returns (bool)
    {
        return hasRole(FARMER_ROLE, account);
    }

    function isCheesemaker(address account)
    external
    view
    returns (bool)
    {
        return hasRole(CHEESEMAKER_ROLE, account);
    }

    function isDistributor(address account)
    external
    view
    returns (bool)
    {
        return hasRole(DISTRIBUTOR_ROLE, account);
    }

    function isRetailer(address account)
    external
    view
    returns (bool)
    {
        return hasRole(RETAILER_ROLE, account);
    }
}
