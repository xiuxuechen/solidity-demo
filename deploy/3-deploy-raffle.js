const { verify } = require("../utils/verify");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { ethers } = require("hardhat");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let vrfCoordinatorAddress, vrfCoordinatorMock, subscriptionId;
    if (chainId == process.env.LOCAL_CHAIN_ID) {
        vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2_5Mock", deployer);
        vrfCoordinatorAddress = vrfCoordinatorMock.address;
        const response = await vrfCoordinatorMock.createSubscription();
        const receipt = await response.wait(1);
        subscriptionId = receipt.events[0].args.subId;
        await vrfCoordinatorMock.fundSubscription(subscriptionId, ethers.utils.parseEther("30"));
    } else {
        vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinator"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    const args = [
        vrfCoordinatorAddress,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["interval"],
        networkConfig[chainId]["entranceFee"],
        networkConfig[chainId]["callbackGasLimit"]
    ];
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2_5Mock", deployer);
        await vrfCoordinatorMock.addConsumer(subscriptionId, raffle.address);
        log("添加消费者成功！");
    }
    log("抽奖合约部署成功！");
    log("----------------------------------------------------");
    if (developmentChains.includes(network.name)) {

        return;
    }
    await verify(raffle, args);
}

module.exports.tags = ["all", "raffle"];