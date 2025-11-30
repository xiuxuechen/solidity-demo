const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config")
require("dotenv").config();

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let ethUsdPriceFeedAddress = process.env.ETH_USD_PRICE_FEED_ADDRESS;
    if (chainId == process.env.LOCAL_CHAIN_ID) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    }


    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log("众筹合约部署成功！");
    log("----------------------------------------------------");
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe, [ethUsdPriceFeedAddress])
    }
}
module.exports.tags = ["all", "fundme"];