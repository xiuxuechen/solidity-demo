
const LOCALHOST_CHAIN_ID = parseInt(process.env.LOCAL_CHAIN_ID);
const SEPOLIA_CHAIN_ID = process.env.SEPOLIA_CHAIN_ID;
const ETH_USD_PRICE_FEED_ADDRESS = process.env.ETH_USD_PRICE_FEED_ADDRESS;
const VRF_COORDINATOR_ADDRESS = process.env.VRF_COORDINATOR_ADDRESS;

const networkConfig = {
    [LOCALHOST_CHAIN_ID]: {
        name: "localhost",
    },
    [SEPOLIA_CHAIN_ID]: {
        name: "sepolia",
        ethUsdPriceFeed: ETH_USD_PRICE_FEED_ADDRESS,
        vrfCoordinator: VRF_COORDINATOR_ADDRESS
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}