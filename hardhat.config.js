require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("./tasks/block-number");
require("dotenv").config();
require('hardhat-deploy');
const { remapImportPaths } = require("./remappings-helper.js");


/** @type import('hardhat/config').HardhatUserConfig */
const LOCALHOST_CHAIN_ID = parseInt(process.env.LOCAL_CHAIN_ID);
const SEPOLIA_CHAIN_ID = parseInt(process.env.SEPOLIA_CHAIN_ID);
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;


module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./build/cache",
    artifacts: "./build/artifacts",
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [SEPOLIA_PRIVATE_KEY],
      chainId: SEPOLIA_CHAIN_ID,
      timeout: 300000,
      blockConfirmations: 6
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: LOCALHOST_CHAIN_ID
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    timeout: 300000
  },
  gasReporter: {
    enabled: true,
    currency: "CNY",
    token: "ETH",
    outputFile: "gas-report.txt",
    coinmarketcap: COINMARKETCAP_API_KEY,
    etherscan: ETHERSCAN_API_KEY
  },
  namedAccounts: {
    deployer: {
      default: 0,
      [SEPOLIA_CHAIN_ID]: 0
    }
  },
  mocha: {
    timeout: 500000
  },
  preprocess: remapImportPaths()
};
