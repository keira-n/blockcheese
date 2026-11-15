import { network } from "hardhat";
import { describe, it } from "mocha"
import assert from "node:assert/strict";

// Deploy contracts and prepare test participants
async function deployFixture() {

    const connection = await network.create();
    const ethers = connection.ethers;

    const [
        admin,
        farmer,
        cheesemaker,
        distributor,
        retailer,
        outsider
    ] = await ethers.getSigners();

    // Deploy RoleManager
    const roleManager = await ethers.deployContract("RoleManager");
    await roleManager.waitForDeployment();

    const roleManagerAddress = await roleManager.getAddress();

    // Register participants
    await (await roleManager.registerFarmer(farmer.address)).wait();
    await (await roleManager.registerCheesemaker(cheesemaker.address)).wait();
    await (await roleManager.registerDistributor(distributor.address)).wait();
    await (await roleManager.registerRetailer(retailer.address)).wait();

    // Deploy MilkBatch
    const milkBatch = await ethers.deployContract(
        "MilkBatch",
        [roleManagerAddress]
    );

    await milkBatch.waitForDeployment();

    const milkBatchAddress = await milkBatch.getAddress();

    // Register milk batch
    const milkId = ethers.id("MILK-001");

    const farmerContract = await ethers.getContractAt(
        "MilkBatch",
        milkBatchAddress,
        farmer
    );

    await (await farmerContract.registerMilkBatch(
        milkId,
        "Green Valley Farm",
        Math.floor(Date.now() / 1000),
        500,
        "ipfs://milk-metadata"
    )).wait();

    // Deploy CheeseProduction
    const cheeseProduction = await ethers.deployContract(
        "CheeseProduction",
        [roleManagerAddress, milkBatchAddress]
    );

    await cheeseProduction.waitForDeployment();

    const cheeseProductionAddress =
        await cheeseProduction.getAddress();

    // Register cheese batch
    const cheeseId = ethers.id("CHEESE-001");

    const cheesemakerContract = await ethers.getContractAt(
        "CheeseProduction",
        cheeseProductionAddress,
        cheesemaker
    );

    await (await cheesemakerContract.registerCheese(
        cheeseId,
        milkId,
        "Cheddar",
        100
    )).wait();

    // Start aging
    await (await cheesemakerContract.startAging(
        cheeseId,
        30
    )).wait();

    // Record storage conditions
    await (await cheesemakerContract.updateStorageConditions(
        cheeseId,
        125,
        85
    )).wait();

    // Deploy Distribution
    const distribution = await ethers.deployContract(
        "Distribution",
        [roleManagerAddress, cheeseProductionAddress]
    );

    await distribution.waitForDeployment();

    const distributionAddress = await distribution.getAddress();

    // Deploy Retail
    const retail = await ethers.deployContract(
        "Retail",
        [roleManagerAddress, distributionAddress]
    );

    await retail.waitForDeployment();

    return {
        ethers,
        admin,
        farmer,
        cheesemaker,
        distributor,
        retailer,
        outsider,
        roleManager,
        milkBatch,
        milkId,
        cheeseProduction,
        cheesemakerContract,
        cheeseId,
        distribution,
        distributionAddress,
        retail
    };
}

// Supply chain test

describe("BlockCheese Supply Chain", function () {

    // TEST 1: Role registration
    it("Should register all supply chain participants", async function () {

        const { roleManager, farmer, cheesemaker, distributor, retailer } =
            await deployFixture();

        assert.equal(await roleManager.isFarmer(farmer.address), true);

        assert.equal(
            await roleManager.isCheesemaker(cheesemaker.address),
            true
        );

        assert.equal(
            await roleManager.isDistributor(distributor.address),
            true
        );

        assert.equal(
            await roleManager.isRetailer(retailer.address),
            true
        );

    });

    // TEST 2: Milk registration
    it("Should successfully register a milk batch", async function () {

        const { milkBatch, milkId } = await deployFixture();

        const exists = await milkBatch.milkBatchExists(milkId);

        assert.equal(exists, true);

    });

    // TEST 3: Cheese production
    it("Should successfully register a cheese batch", async function () {

        const { cheeseProduction, cheeseId } = await deployFixture();

        const cheese = await cheeseProduction.getCheese(cheeseId);

        assert.equal(cheese.exists, true);
        assert.equal(cheese.cheeseType, "Cheddar");
        assert.equal(cheese.quantityKg, 100n);

    });

    // TEST 4: Aging restrictions
    it("Should prevent aging completion before the required duration", async function () {

        const { cheesemakerContract, cheeseId } = await deployFixture();

        await assert.rejects(async () => {
            await cheesemakerContract.completeAging(cheeseId);
        });

    });

    // TEST 5: Successful aging
    it("Should allow aging completion after 30 days", async function () {

        const { ethers, cheesemakerContract, cheeseId } =
            await deployFixture();

        // Advance simulated blockchain time by 30 days
        await ethers.provider.send("evm_increaseTime", [
            30 * 24 * 60 * 60
        ]);

        await ethers.provider.send("evm_mine", []);

        await (await cheesemakerContract.completeAging(cheeseId)).wait();

        const cheese = await cheesemakerContract.getCheese(cheeseId);

        assert.equal(cheese.agingCompleted, true);

    });

    // TEST 6: Complete distribution and retail
    it("Should complete shipment, ownership transfer and retail receipt", async function () {

        const {
            ethers,
            distributor,
            retailer,
            cheeseId,
            cheesemakerContract,
            distribution,
            distributionAddress,
            retail
        } = await deployFixture();

        // Complete the aging period
        await ethers.provider.send("evm_increaseTime", [
            30 * 24 * 60 * 60
        ]);

        await ethers.provider.send("evm_mine", []);

        await (await cheesemakerContract.completeAging(cheeseId)).wait();

        // Register shipment
        const shipmentId = ethers.id("SHIPMENT-001");

        const distributorContract = await ethers.getContractAt(
            "Distribution",
            distributionAddress,
            distributor
        );

        await (await distributorContract.registerShipment(
            shipmentId,
            cheeseId,
            retailer.address,
            "Berlin Retail Store"
        )).wait();

        // Transfer ownership
        await (await distributorContract.transferOwnership(
            shipmentId
        )).wait();

        const owner = await distribution.productOwner(cheeseId);

        assert.equal(owner, retailer.address);

        // Retailer confirms receipt
        const retailAddress = await retail.getAddress();

        const retailerContract = await ethers.getContractAt(
            "Retail",
            retailAddress,
            retailer
        );

        await (await retailerContract.confirmReceipt(
            shipmentId,
            100
        )).wait();

        // Update availability
        await (await retailerContract.updateAvailability(
            shipmentId,
            true
        )).wait();

        const record = await retailContractRecord(
            retailerContract,
            shipmentId
        );

        assert.equal(record.received, true);
        assert.equal(record.available, true);
        assert.equal(record.quantityReceived, 100n);

    });

    // TEST 7: Unauthorised access
    it("Should prevent unauthorised users from registering milk", async function () {

        const {
            ethers,
            milkBatch,
            outsider
        } = await deployFixture();

        const milkAddress = await milkBatch.getAddress();

        const outsiderContract = await ethers.getContractAt(
            "MilkBatch",
            milkAddress,
            outsider
        );

        await assert.rejects(async () => {
            await outsiderContract.registerMilkBatch(
                ethers.id("MILK-UNAUTHORISED"),
                "Unknown Farm",
                Math.floor(Date.now() / 1000),
                100,
                "ipfs://test"
            );
        });

    });

});

// Helper to retrieve retail records
async function retailContractRecord(
    contract: any,
    shipmentId: string
) {
    return await contract.getRetailRecord(shipmentId);
}
