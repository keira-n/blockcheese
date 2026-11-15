import { network } from "hardhat";
import { readFileSync } from "node:fs";
import { demoConfig } from "../config/demo.js";

async function main() {
    const connection = await network.create();
    const ethers = connection.ethers;

    // Load deployed contract addresses
    const deployment = JSON.parse(
        readFileSync(
            `deployments/${connection.networkName}.json`,
            "utf-8"
        )
    );

    const contracts = deployment.contracts;

    // Get demo participants
    const signers = await ethers.getSigners();

    const farmer = signers[demoConfig.participants.farmer];
    const cheesemaker = signers[demoConfig.participants.cheesemaker];
    const distributor = signers[demoConfig.participants.distributor];
    const retailer = signers[demoConfig.participants.retailer];

    // Connect to deployed contracts
    const roleManager = await ethers.getContractAt(
        "RoleManager",
        contracts.RoleManager
    );

    const milkBatch = await ethers.getContractAt(
        "MilkBatch",
        contracts.MilkBatch,
        farmer
    );

    const production = await ethers.getContractAt(
        "CheeseProduction",
        contracts.CheeseProduction,
        cheesemaker
    );

    const distribution = await ethers.getContractAt(
        "Distribution",
        contracts.Distribution,
        distributor
    );

    const retail = await ethers.getContractAt(
        "Retail",
        contracts.Retail,
        retailer
    );

    console.log("\n\x1b[94mRunning BlockCheese demo...\n");

    console.log("Farmer:", farmer.address);
    console.log("Cheesemaker:", cheesemaker.address);
    console.log("Distributor:", distributor.address);
    console.log("Retailer:", retailer.address);

    // Register participants
    console.log("\nRegistering participants...");

    await (await roleManager.registerFarmer(farmer.address)).wait();
    await (await roleManager.registerCheesemaker(cheesemaker.address)).wait();
    await (await roleManager.registerDistributor(distributor.address)).wait();
    await (await roleManager.registerRetailer(retailer.address)).wait();

    console.log("All participants registered.");

    // Register milk batch
    const milkId = ethers.id(demoConfig.milk.id);
    const collectionDate = Math.floor(Date.now() / 1000);

    await (await milkBatch.registerMilkBatch(
        milkId,
        demoConfig.milk.farmName,
        collectionDate,
        demoConfig.milk.quantity,
        demoConfig.milk.metadataURI
    )).wait();

    console.log("\nMilk batch successfully registered");

    const milk = await milkBatch.getMilkBatch(milkId);
    console.log("\nRetrieved milk batch:", milk);

    // Register cheese batch
    const cheeseId = ethers.id(demoConfig.cheese.id);

    await (await production.registerCheese(
        cheeseId,
        milkId,
        demoConfig.cheese.type,
        demoConfig.cheese.quantity
    )).wait();

    console.log("\nCheese batch successfully registered");

    // Start aging
    await (await production.startAging(
        cheeseId,
        demoConfig.cheese.agingDuration
    )).wait();

    console.log(
        `Cheese aging started: ${demoConfig.cheese.agingDuration} days`
    );

    // Record storage conditions
    await (await production.updateStorageConditions(
        cheeseId,
        demoConfig.storage.temperature,
        demoConfig.storage.humidity
    )).wait();

    console.log("Storage conditions recorded");

    const cheese = await production.getCheese(cheeseId);
    console.log("\nRetrieved cheese batch:", cheese);

    // Verify participant roles
    console.log("\n\x1b[93mParticipant verification\n");
    console.log('\x1b[0m');

    console.log("Farmer:", await roleManager.isFarmer(farmer.address));
    console.log("Cheesemaker:", await roleManager.isCheesemaker(cheesemaker.address));
    console.log("Distributor:", await roleManager.isDistributor(distributor.address));
    console.log("Retailer:", await roleManager.isRetailer(retailer.address));

    // Demo completion
    console.log("\n\x1b[92mBlockCheese demo completed\n");
    console.log('\x1b[94mSummary:');

    console.log("Milk batch:", demoConfig.milk.id);
    console.log("Cheese batch:", demoConfig.cheese.id);
    console.log("Cheese type:", demoConfig.cheese.type);
    console.log("Aging duration:", demoConfig.cheese.agingDuration, "days");

    console.log("Distribution contract:", await distribution.getAddress());
    console.log("Retail contract:", await retail.getAddress());

    console.log('\x1b[0m');
}

main().catch((error) => {
    console.error("Demo failed:", error);
    process.exitCode = 1;
});