const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const DECIMALS = "8"
const INITIAL_PRICE = "200000000000" // 2000
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    if (developmentChains.includes(network.name)) {
        log("检测到本地网络，开始部署模拟喂价合约...")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        });
        log("模拟喂价合约部署完成！");
        log("----------------------------------------------------");

        log("开始部署模拟随机数合约...");
        await deploy("VRFCoordinatorV2_5Mock", {
            contract: "VRFCoordinatorV2_5Mock",
            from: deployer,
            log: true,
            args: [
                ethers.utils.parseEther("0.5"), // baseFee
                1e9,
                ethers.utils.parseEther("0.25"),
            ]
        });
        log("模拟随机数合约部署完成！");
        log("----------------------------------------------------");
    }
}
module.exports.tags = ["all", "mocks"];