
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

interface IRoleManager {
    function FARMER_ROLE() external view returns (bytes32);

    function hasRole(
        bytes32 role,
        address account
    ) external view returns (bool);
}

/**
 * @title MilkBatch
 * @dev Allows authorised dairy farmers to register milk batches
 */
contract MilkBatch {

    IRoleManager public immutable roleManager;
    bytes32 public immutable farmerRole;

    struct MilkBatchRecord {
        bytes32 batchId;
        address farmer;
        string origin;
        uint256 collectionDate;
        uint256 quantityLitres;
        string metadataURI;
        bool exists;
    }

    mapping(bytes32 => MilkBatchRecord) private milkBatches;

    event MilkBatchRegistered(
        bytes32 indexed batchId,
        address indexed farmer,
        string origin,
        uint256 quantityLitres
    );

    constructor(address _roleManager) {
        require(
            _roleManager != address(0),
            "Invalid RoleManager address"
        );

        roleManager = IRoleManager(_roleManager);
        farmerRole = roleManager.FARMER_ROLE();
    }

    modifier onlyFarmer() {
        require(
            roleManager.hasRole(farmerRole, msg.sender),
            "Caller is not an authorised farmer"
        );
        _;
    }

    //Register a new milk batch
    function registerMilkBatch(
        bytes32 batchId,
        string calldata origin,
        uint256 collectionDate,
        uint256 quantityLitres,
        string calldata metadataURI
    )
    external
    onlyFarmer
    {
        require(batchId != bytes32(0), "Invalid batch ID");

        require(
            !milkBatches[batchId].exists,
            "Milk batch already exists"
        );

        require(bytes(origin).length > 0, "Origin required");

        require(
            collectionDate <= block.timestamp,
            "Invalid collection date"
        );

        require(quantityLitres > 0, "Invalid milk quantity");

        milkBatches[batchId] = MilkBatchRecord({
            batchId: batchId,
            farmer: msg.sender,
            origin: origin,
            collectionDate: collectionDate,
            quantityLitres: quantityLitres,
            metadataURI: metadataURI,
            exists: true
        });

        emit MilkBatchRegistered(
            batchId,
            msg.sender,
            origin,
            quantityLitres
        );
    }

    // Retrieve milk batch information.
    // Publicly readable for traceability.
    function getMilkBatch(
        bytes32 batchId
    )
    external
    view
    returns (MilkBatchRecord memory)
    {
        require(
            milkBatches[batchId].exists,
            "Milk batch does not exist"
        );

        return milkBatches[batchId];
    }

   // Verify whether a milk batch exists.
    function milkBatchExists(
        bytes32 batchId
    )
    external
    view
    returns (bool)
    {
        return milkBatches[batchId].exists;
    }
}
