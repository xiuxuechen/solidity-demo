const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");
require("dotenv").config();

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Contract Staging Tests", function () {

        let raffle, raffleEntranceFee, deployer;
        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer;
            raffle = await ethers.getContract("Raffle", deployer);
            raffleEntranceFee = await raffle.getEntranceFee();
        });
        it("测试真实网络上的抽奖功能", async function () {
            const startTimeStamp = await raffle.getLastTimeStamp();
            const accounts = await ethers.getSigners();

            console.log("启动开奖监听器");
            await new Promise(async (resolve, reject) => {
                raffle.once("WinnerPicked", async () => {
                    console.log("天选之子出现了！");
                    try {
                        const recentWinner = await raffle.getRecentWinner();
                        const raffleState = await raffle.getRaffleState();
                        const winnerEndingBalance = await accounts[0].getBalance();
                        const endingTimeStamp = await raffle.getLastTimeStamp();

                        await expect(raffle.getPlayers(0)).to.be.reverted;
                        assert.equal(recentWinner.toString(), accounts[0].address);
                        assert.equal(raffleState, 0);
                        assert.equal(
                            winnerEndingBalance.toString(),
                            winnerStartingBalance.add(raffleEntranceFee).toString()
                        );
                        assert(endingTimeStamp > startTimeStamp);
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });

                console.log("开始参与抽奖");
                const txResponse = await raffle.enterRaffle({ value: raffleEntranceFee });
                await txResponse.wait(1);
                console.log("等待开奖");
                const winnerStartingBalance = await accounts[0].getBalance();
            });
        });
    });