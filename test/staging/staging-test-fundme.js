const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");
require("dotenv").config();

developmentChains.includes(network.name) ?
    describe.skip :
    describe("FundMe Contract Staging Tests", async function () {
        let fundMe;
        let deployer;
        const sendValue = ethers.parseEther("0.01"); // 0.1 ETH

        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer;
            fundMe = await ethers.getContract("FundMe", deployer);
        });

        it("测试真实网络上的众筹和提现功能", async function () {
            console.log("开始众筹...");
            const fundTxResponse = await fundMe.fund({ value: sendValue });
            await fundTxResponse.wait(1);
            console.log("众筹成功！");

            console.log("开始提现...");
            const withdrawTxResponse = await fundMe.withdraw();
            await withdrawTxResponse.wait(1);
            console.log("提现成功！");
        });
    });