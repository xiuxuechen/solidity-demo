const { verify } = require("../utils/verify");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { ethers } = require("hardhat");
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let vrfCoordinatorAddress, vrfCoordinatorMock, subscriptionId;
    if (chainId == process.env.LOCAL_CHAIN_ID) {
        vrfCoordinatorMock = await deployments.get("VRFCoordinatorV2_5Mock");
        vrfCoordinatorAddress = vrfCoordinatorMock.address;
        const response = await vrfCoordinatorMock.createSubscription();
        const receipt = await response.wait(1);
        subscriptionId = receipt.events[0].args.subId;
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, ethers.parseEther("1"));
    } else {
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinator"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    const args = [
        vrfCoordinatorAddress,
        networkConfig[chainId]["gasLane"],
        subscriptionId,
        networkConfig[chainId]["callbackGasLimit"],
        networkConfig[chainId]["entranceFee"],
    ];
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    if (!developmentChains.includes(network.name)) {
        const vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2_5Mock");
        await vrfCoordinatorMock.addConsumer(subscriptionId, raffle.address);
        if (process.env.ETHERSCAN_API_KEY) {
            await verify(raffle.address, args);
        }
    }
}