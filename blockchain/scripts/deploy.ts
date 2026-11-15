
import { network } from "hardhat";
import { mkdirSync, writeFileSync } from "node:fs";

async function main() {
    const connection = await network.create();
    const ethers = connection.ethers;

    const [admin] = await ethers.getSigners();
    const networkInfo = await ethers.provider.getNetwork();

    console.log("\n\x1b[94mDeploying BlockCheese...\n");
    console.log("Admin wallet:", admin.address);

    // Deploy RoleManager
    const roleManager = await ethers.deployContract("RoleManager");

    await roleManager.waitForDeployment();

    const roleManagerAddress = await roleManager.getAddress();

    console.log("RoleManager:", roleManagerAddress);

    // Deploy MilkBatch
    const milkBatch = await ethers.deployContract(
        "MilkBatch",
        [roleManagerAddress]
    );

    await milkBatch.waitForDeployment();

    const milkBatchAddress = await milkBatch.getAddress();

    console.log("MilkBatch:", milkBatchAddress);

    // Deploy CheeseProduction
    const cheeseProduction = await ethers.deployContract(
        "CheeseProduction",
        [roleManagerAddress, milkBatchAddress]
    );

    await cheeseProduction.waitForDeployment();

    const cheeseProductionAddress =
        await cheeseProduction.getAddress();

    console.log("\nCheeseProduction:", cheeseProductionAddress);

    // Deploy Distribution
    const distribution = await ethers.deployContract(
        "Distribution",
        [roleManagerAddress, cheeseProductionAddress]
    );

    await distribution.waitForDeployment();

    const distributionAddress = await distribution.getAddress();

    console.log("\nDistribution:", distributionAddress);

    // Deploy Retail
    const retail = await ethers.deployContract(
        "Retail",
        [roleManagerAddress, distributionAddress]
    );

    await retail.waitForDeployment();

    const retailAddress = await retail.getAddress();

    console.log("\nRetail:", retailAddress);

    // Save deployment information
    const deployment = {
        network: {
            name: connection.networkName,
            chainId: networkInfo.chainId.toString(),
        },
        admin: admin.address,
        contracts: {
            RoleManager: roleManagerAddress,
            MilkBatch: milkBatchAddress,
            CheeseProduction: cheeseProductionAddress,
            Distribution: distributionAddress,
            Retail: retailAddress,
        },
    };

    mkdirSync("deployments", { recursive: true });

    writeFileSync(
        `deployments/${connection.networkName}.json`,
        JSON.stringify(deployment, null, 2)
    );

    // Deployment summary
    console.log("\n\x1b[92mBlockCheese deployment completed\n");
    console.log('\x1b[94mSummary:');

    console.log("RoleManager:", roleManagerAddress);
    console.log("MilkBatch:", milkBatchAddress);
    console.log("CheeseProduction:", cheeseProductionAddress);
    console.log("Distribution:", distributionAddress);
    console.log("Retail:", retailAddress);

    console.log("\nNetwork:", connection.networkName);
    console.log("Chain ID:", networkInfo.chainId.toString());

    console.log('\x1b[0m');
}

main().catch((error) => {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
});