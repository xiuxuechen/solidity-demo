const { ethers } = require("hardhat");

const LOCALHOST_CHAIN_ID = parseInt(process.env.LOCAL_CHAIN_ID);
const SEPOLIA_CHAIN_ID = process.env.SEPOLIA_CHAIN_ID;
const ETH_USD_PRICE_FEED_ADDRESS = process.env.ETH_USD_PRICE_FEED_ADDRESS;
const VRF_COORDINATOR_ADDRESS = process.env.VRF_COORDINATOR_ADDRESS;
const SUBSCRIPTION_ID = process.env.SUBSCRIPTION_ID;
const GAS_LANE = process.env.GAS_LANE;

const networkConfig = {
    [LOCALHOST_CHAIN_ID]: {
        name: "localhost",
        entranceFee: ethers.utils.parseEther("0.01"),
        subscriptionId: SUBSCRIPTION_ID,
        gasLane: GAS_LANE,
        callbackGasLimit: "500000",
        interval: "30",
    },
    [SEPOLIA_CHAIN_ID]: {
        name: "sepolia",
        ethUsdPriceFeed: ETH_USD_PRICE_FEED_ADDRESS,
        vrfCoordinator: VRF_COORDINATOR_ADDRESS,
        entranceFee: ethers.utils.parseEther("0.01"),
        subscriptionId: SUBSCRIPTION_ID,
        gasLane: GAS_LANE,
        callbackGasLimit: "500000",
        interval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}