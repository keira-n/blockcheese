// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/**
 * @title Distribution
 * @dev Acts as middle man for cheesemakers and retails
 */

interface IDistributionRoleManager {
    function DISTRIBUTOR_ROLE() external view returns (bytes32);

    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);
}

interface ICheeseProduction {
    function cheeses(bytes32 cheeseId)
    external
    view
    returns (
        bytes32,
        bytes32,
        address,
        string memory,
        uint256,
        uint256,
        uint256,
        uint256,
        int256,
        uint256,
        bool,
        bool
    );
}

contract Distribution {

    IDistributionRoleManager public roleManager;
    ICheeseProduction public cheeseProduction;

    struct Shipment {
        bytes32 shipmentId;
        bytes32 cheeseId;
        address distributor;
        address retailer;
        string destination;
        uint256 dispatchDate;
        bool exists;
    }

    mapping(bytes32 => Shipment) public shipments;
    mapping(bytes32 => address) public productOwner;

    event ShipmentRegistered(bytes32 indexed shipmentId);
    event OwnershipTransferred(bytes32 indexed cheeseId, address retailer);

    constructor(address _roleManager, address _cheeseProduction) {
        roleManager = IDistributionRoleManager(_roleManager);
        cheeseProduction = ICheeseProduction(_cheeseProduction);
    }

    modifier onlyDistributor() {
        require(
            roleManager.hasRole(
                roleManager.DISTRIBUTOR_ROLE(),
                msg.sender
            ),
            "Not a distributor"
        );
        _;
    }

    // Register a shipment
    function registerShipment(
        bytes32 shipmentId,
        bytes32 cheeseId,
        address retailer,
        string calldata destination
    ) external onlyDistributor {

        require(shipmentId != bytes32(0), "Invalid shipment ID");
        require(!shipments[shipmentId].exists, "Shipment exists");
        require(retailer != address(0), "Invalid retailer");
        require(bytes(destination).length > 0, "Destination required");

        (
            ,,,,,,,,,, bool agingCompleted, bool exists
        ) = cheeseProduction.cheeses(cheeseId);

        require(exists, "Cheese not found");
        require(agingCompleted, "Aging not completed");
        require(productOwner[cheeseId] == address(0), "Already shipped");

        shipments[shipmentId] = Shipment(
            shipmentId,
            cheeseId,
            msg.sender,
            retailer,
            destination,
            block.timestamp,
            true
        );

        emit ShipmentRegistered(shipmentId);
    }

    // Transfer ownership to retailer
    function transferOwnership(bytes32 shipmentId)
    external
    onlyDistributor
    {
        Shipment storage shipment = shipments[shipmentId];

        require(shipment.exists, "Shipment not found");
        require(shipment.distributor == msg.sender, "Not your shipment");
        require(
            productOwner[shipment.cheeseId] == address(0),
            "Already transferred"
        );

        productOwner[shipment.cheeseId] = shipment.retailer;

        emit OwnershipTransferred(
            shipment.cheeseId,
            shipment.retailer
        );
    }

    // Retrieve shipment
    function getShipment(bytes32 shipmentId)
    external
    view
    returns (Shipment memory)
    {
        require(shipments[shipmentId].exists, "Shipment not found");

        return shipments[shipmentId];
    }
}
