// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/**
 * @title CheeseProduction
 * @dev Handles cheesemaking and aging
 */

interface ICheeseRoleManager {
    function CHEESEMAKER_ROLE()
    external
    view
    returns (bytes32);

    function hasRole(
        bytes32 role,
        address account
    )
    external
    view
    returns (bool);
}

interface IMilkBatch {
    function milkBatchExists(
        bytes32 batchId
    )
    external
    view
    returns (bool);
}

contract CheeseProduction {

    ICheeseRoleManager public roleManager;
    IMilkBatch public milkBatch;

    struct Cheese {
        bytes32 id;
        bytes32 milkBatchId;
        address cheesemaker;

        string cheeseType;

        uint256 productionDate;
        uint256 quantityKg;

        uint256 agingStartDate;
        uint256 agingDurationDays;

        int256 storageTemperature;
        uint256 storageHumidity;

        bool agingCompleted;
        bool exists;
    }

    mapping(bytes32 => Cheese) public cheeses;

    event CheeseRegistered(
        bytes32 indexed cheeseId,
        bytes32 indexed milkBatchId,
        address indexed cheesemaker,
        string cheeseType
    );

    event AgingStarted(
        bytes32 indexed cheeseId,
        uint256 startDate,
        uint256 durationDays
    );

    event StorageConditionsUpdated(
        bytes32 indexed cheeseId,
        int256 temperature,
        uint256 humidity
    );

    event AgingCompleted(
        bytes32 indexed cheeseId
    );

    constructor(
        address _roleManager,
        address _milkBatch
    ) {
        require(
            _roleManager != address(0),
            "Invalid RoleManager"
        );

        require(
            _milkBatch != address(0),
            "Invalid MilkBatch"
        );

        roleManager = ICheeseRoleManager(_roleManager);
        milkBatch = IMilkBatch(_milkBatch);
    }

    modifier onlyCheesemaker() {
        require(
            roleManager.hasRole(
                roleManager.CHEESEMAKER_ROLE(),
                msg.sender
            ),
            "Not an authorised cheesemaker"
        );
        _;
    }

    // Register cheese production.
    function registerCheese(
        bytes32 cheeseId,
        bytes32 milkBatchId,
        string calldata cheeseType,
        uint256 quantityKg
    )
    external
    onlyCheesemaker
    {
        require(
            cheeseId != bytes32(0),
            "Invalid cheese ID"
        );

        require(
            !cheeses[cheeseId].exists,
            "Cheese already exists"
        );

        require(
            milkBatch.milkBatchExists(milkBatchId),
            "Milk batch does not exist"
        );

        require(
            bytes(cheeseType).length > 0,
            "Cheese type required"
        );

        require(
            quantityKg > 0,
            "Invalid quantity"
        );

        cheeses[cheeseId] = Cheese({
            id: cheeseId,
            milkBatchId: milkBatchId,
            cheesemaker: msg.sender,
            cheeseType: cheeseType,
            productionDate: block.timestamp,
            quantityKg: quantityKg,
            agingStartDate: 0,
            agingDurationDays: 0,
            storageTemperature: 0,
            storageHumidity: 0,
            agingCompleted: false,
            exists: true
        });

        emit CheeseRegistered(
            cheeseId,
            milkBatchId,
            msg.sender,
            cheeseType
        );
    }

    //Start cheese aging
    function startAging(
        bytes32 cheeseId,
        uint256 durationDays
    )
    external
    onlyCheesemaker
    {
        Cheese storage cheese = cheeses[cheeseId];

        require(cheese.exists, "Cheese not found");

        require(
            cheese.cheesemaker == msg.sender,
            "Not the original cheesemaker"
        );

        require(
            cheese.agingStartDate == 0,
            "Aging already started"
        );

        require(
            durationDays > 0,
            "Invalid aging duration"
        );

        cheese.agingStartDate = block.timestamp;
        cheese.agingDurationDays = durationDays;

        emit AgingStarted(
            cheeseId,
            block.timestamp,
            durationDays
        );
    }

    /**
     * Record aging storage conditions
     * Temperature is stored in tenths of a degree Celsius
     * Humidity is stored as a percentage (0-100)
     */
    function updateStorageConditions(
        bytes32 cheeseId,
        int256 temperature,
        uint256 humidity
    )
    external
    onlyCheesemaker
    {
        Cheese storage cheese = cheeses[cheeseId];

        require(cheese.exists, "Cheese not found");

        require(
            cheese.cheesemaker == msg.sender,
            "Not the original cheesemaker"
        );

        require(
            cheese.agingStartDate != 0,
            "Aging has not started"
        );

        require(
            !cheese.agingCompleted,
            "Aging already completed"
        );

        require(
            humidity <= 100,
            "Invalid humidity"
        );

        cheese.storageTemperature = temperature;
        cheese.storageHumidity = humidity;

        emit StorageConditionsUpdated(
            cheeseId,
            temperature,
            humidity
        );
    }

    //Mark cheese aging as completed.
    function completeAging(
        bytes32 cheeseId
    )
    external
    onlyCheesemaker
    {
        Cheese storage cheese = cheeses[cheeseId];

        require(cheese.exists, "Cheese not found");

        require(
            cheese.cheesemaker == msg.sender,
            "Not the original cheesemaker"
        );

        require(
            cheese.agingStartDate != 0,
            "Aging has not started"
        );

        require(
            !cheese.agingCompleted,
            "Already completed"
        );

        require(
            block.timestamp >=
            cheese.agingStartDate +
            (cheese.agingDurationDays * 1 days),
            "Aging period not finished"
        );

        cheese.agingCompleted = true;

        emit AgingCompleted(cheeseId);
    }

    //Retrieve cheese production and aging information
    function getCheese(
        bytes32 cheeseId
    )
    external
    view
    returns (Cheese memory)
    {
        require(
            cheeses[cheeseId].exists,
            "Cheese not found"
        );

        return cheeses[cheeseId];
    }
}
