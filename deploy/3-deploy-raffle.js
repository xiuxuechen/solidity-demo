const { verify } = require("../utils/verify");
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinator"];
    if (chainId == process.env.LOCAL_CHAIN_ID) {
        const vrfCoordinator = await deployments.get("VRFCoordinatorV2_5Mock");
        vrfCoordinatorAddress = vrfCoordinator.address;
    }
}