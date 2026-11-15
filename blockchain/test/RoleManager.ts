import { network } from "hardhat";
import { expect } from "chai";

describe("RoleManager", function () {
    async function deployRoleManager() {
        const connection = await network.create();
        const ethers = connection.ethers;

        const [admin, farmer, cheesemaker, distributor, retailer, stranger] =
            await ethers.getSigners();

        const roleManager = await ethers.deployContract("RoleManager") as any;

        await roleManager.waitForDeployment();

        return {
            roleManager,
            admin,
            farmer,
            cheesemaker,
            distributor,
            retailer,
            stranger,
            ethers
        };
    }

    it("Should assign the admin role to the deployer", async function () {
        const { roleManager, admin } = await deployRoleManager();

        const adminRole = await roleManager.DEFAULT_ADMIN_ROLE();

        expect(await roleManager.hasRole(adminRole, admin.address))
            .to.equal(true);
    });

    it("Should register a dairy farmer", async function () {
        const { roleManager, farmer } = await deployRoleManager();

        await roleManager.registerFarmer(farmer.address);

        expect(await roleManager.isFarmer(farmer.address))
            .to.equal(true);
    });

    it("Should register a cheesemaker", async function () {
        const { roleManager, cheesemaker } = await deployRoleManager();

        await roleManager.registerCheesemaker(cheesemaker.address);

        expect(await roleManager.isCheesemaker(cheesemaker.address))
            .to.equal(true);
    });

    it("Should register a distributor", async function () {
        const { roleManager, distributor } = await deployRoleManager();

        await roleManager.registerDistributor(distributor.address);

        expect(await roleManager.isDistributor(distributor.address))
            .to.equal(true);
    });

    it("Should register a retailer", async function () {
        const { roleManager, retailer } = await deployRoleManager();

        await roleManager.registerRetailer(retailer.address);

        expect(await roleManager.isRetailer(retailer.address))
            .to.equal(true);
    });

    it("Should prevent unauthorised registration", async function () {
        const { roleManager, stranger, farmer, ethers } =
            await deployRoleManager();

        await expect(
            roleManager.connect(stranger).registerFarmer(farmer.address)
        ).to.be.revert(ethers);
    });

    it("Should allow the admin to revoke a participant role", async function () {
        const { roleManager, farmer } = await deployRoleManager();

        await roleManager.registerFarmer(farmer.address);
        await roleManager.removeParticipant(
            farmer.address,
            await roleManager.FARMER_ROLE()
        );

        expect(await roleManager.isFarmer(farmer.address))
            .to.equal(false);
    });
});
