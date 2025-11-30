const { ethers, deployments, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");
require("dotenv").config();

!developmentChains.includes(network.name) ?
    describe.skip :
    describe("FundMe Contract Deployment", async function () {
        let fundMe;
        let deployer;
        let mockV3Aggregator;
        const sendValue = ethers.utils.parseEther("1"); // 1 ETH
        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);

            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
            fundMe = await ethers.getContract("FundMe", deployer);
        });

        describe("constructor", async function () {
            it("测试模拟喂价合约地址", async function () {
                const response = await fundMe.priceFeed();
                assert.equal(response, mockV3Aggregator.address);
            });
            it("测试合约部署者地址", async function () {
                const response = await fundMe.i_owner();
                console.log("众筹合约部署者地址:", response);
                assert.equal(response, deployer);
            });
        });

        describe("fund", async function () {
            it("测试最低众筹金额要求", async function () {
                await expect(fundMe.fund()).to.be.revertedWith(
                    "NotEnoughMoney"
                );
            });
            it("测试众筹后记录的金额", async function () {
                await fundMe.fund({ value: sendValue });
                const response = await fundMe.addressToAmountFunded(deployer);
                assert.equal(response.toString(), sendValue.toString());
            });
            it("测试众筹后记录的众筹人", async function () {
                await fundMe.fund({ value: sendValue });
                const response = await fundMe.funders(0);
                assert.equal(response, deployer);
            });
        });

        describe("withdraw", async function () {
            beforeEach(async function () {
                await fundMe.fund({ value: sendValue });
            });

            it("测试非合约拥有者是否可以提现", async function () {
                const otherPeople = ethers.provider.getSigner(1);
                const fundMeConnectedContract = await fundMe.connect(otherPeople);
                await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
                    "NotOwner"
                );
            });

            it("测试单一众筹人提现", async function () {
                // 提现前余额，此时合约内有初始化的1ETH
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                console.log("提现前合约余额:", startingFundMeBalance.toString());
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
                console.log("提现前部署者余额:", startingDeployerBalance.toString());

                //提现
                const txResponse = await fundMe.withdraw();
                const txReceipt = await txResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = txReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                console.log("提现后合约余额:", endingFundMeBalance.toString());
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
                console.log("提现后部署者余额:", endingDeployerBalance.toString());

                // 提现后部署者余额 = 提现前合约余额 + 提现前部署者余额 - gas消耗
                assert.equal(endingDeployerBalance.toString(), startingFundMeBalance.add(startingDeployerBalance).sub(gasCost).toString());
            });

            it("测试多个众筹人提现", async function () {
                const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                console.log("提现前合约余额:", startingFundMeBalance.toString());
                const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
                console.log("提现前部署者余额:", startingDeployerBalance.toString());


                let accounts = await ethers.getSigners();
                let fundMoney = ethers.BigNumber.from("0");
                for (let i = 1; i < 6; i++) {
                    const fundMeConnectedContract = await fundMe.connect(accounts[i]);
                    await fundMeConnectedContract.fund({ value: sendValue });
                    fundMoney = fundMoney.add(sendValue);
                }
                console.log("多人众筹后合约余额：", (await fundMe.provider.getBalance(fundMe.address)).toString());
                //提现
                const txResponse = await fundMe.withdraw();
                const txReceipt = await txResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = txReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);
                console.log("gas消耗：", gasCost.toString());

                const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
                console.log("提现后合约余额:", endingFundMeBalance.toString());
                const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
                console.log("提现后部署者余额:", endingDeployerBalance.toString());

                // 判断提现后部署者余额 = 提现前合约余额 + 众筹金额 + 提现前部署者余额 - gas消耗
                assert.equal(endingDeployerBalance.toString(), startingFundMeBalance.add(fundMoney).add(startingDeployerBalance).sub(gasCost).toString());
            });
        });
    });