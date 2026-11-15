// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/**
 * @title Retail
 * @dev Gets cheese from distributors and stocks in store
 */

interface IRetailRoleManager {
    function RETAILER_ROLE() external view returns (bytes32);

    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);
}

interface IDistribution {
    function shipments(bytes32 shipmentId)
    external
    view
    returns (
        bytes32,
        bytes32,
        address,
        address,
        string memory,
        uint256,
        bool
    );

    function productOwner(bytes32 cheeseId)
    external
    view
    returns (address);
}

contract Retail {

    IRetailRoleManager public roleManager;
    IDistribution public distribution;

    struct RetailRecord {
        bytes32 shipmentId;
        bytes32 cheeseId;
        address retailer;
        uint256 quantityReceived;
        bool available;
        bool received;
    }

    mapping(bytes32 => RetailRecord) public retailRecords;

    event ProductReceived(bytes32 indexed cheeseId);
    event AvailabilityUpdated(bytes32 indexed cheeseId, bool available);

    constructor(
        address _roleManager,
        address _distribution
    ) {
        roleManager = IRetailRoleManager(_roleManager);
        distribution = IDistribution(_distribution);
    }

    modifier onlyRetailer() {
        require(
            roleManager.hasRole(
                roleManager.RETAILER_ROLE(),
                msg.sender
            ),
            "Not a retailer"
        );
        _;
    }

    // Confirm receipt of a shipment
    function confirmReceipt(
        bytes32 shipmentId,
        uint256 quantity
    ) external onlyRetailer {

        (
            ,
            bytes32 cheeseId,
            ,
            address retailer,
            ,
            ,
            bool exists
        ) = distribution.shipments(shipmentId);

        require(exists, "Shipment not found");
        require(retailer == msg.sender, "Not the assigned retailer");
        require(
            distribution.productOwner(cheeseId) == msg.sender,
            "Ownership not transferred"
        );
        require(quantity > 0, "Invalid quantity");
        require(
            !retailRecords[shipmentId].received,
            "Already received"
        );

        retailRecords[shipmentId] = RetailRecord(
            shipmentId,
            cheeseId,
            msg.sender,
            quantity,
            false,
            true
        );

        emit ProductReceived(cheeseId);
    }

    // Update product availability
    function updateAvailability(
        bytes32 shipmentId,
        bool available
    ) external onlyRetailer {

        RetailRecord storage record = retailRecords[shipmentId];

        require(record.received, "Product not received");
        require(record.retailer == msg.sender, "Not your product");

        record.available = available;

        emit AvailabilityUpdated(
            record.cheeseId,
            available
        );
    }

    // Retrieve retail information
    function getRetailRecord(bytes32 shipmentId)
    external
    view
    returns (RetailRecord memory)
    {
        require(
            retailRecords[shipmentId].received,
            "Record not found"
        );

        return retailRecords[shipmentId];
    }
}