const { ethers, deployments, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains, networkConfig } = require("../../helper-hardhat-config");
require("dotenv").config();

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Contract Deployment", function () {
        const { log } = deployments;
        let raffle, vrfCoordinatorMock, player, interval;
        const chainId = network.config.chainId;
        beforeEach(async function () {
            accounts = await ethers.getSigners();
            player = accounts[1];
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["mocks", "raffle"]);
            vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2_5Mock", deployer);
            raffle = await ethers.getContract("Raffle", deployer);
            interval = await raffle.getInterval();
        });

        describe("Raffle-构造器", function () {
            it("Raffle-test-构造器参数", async function () {
                assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
                const raffleState = await raffle.getRaffleState();
                assert.equal(raffleState.toString(), "0");
            })
        });

        describe("Raffle-enterRaffle-加入抽奖", function () {
            it("Raffle-test-入场费不够", async function () {
                expect(raffle.enterRaffle({ value: ethers.utils.parseEther("0.001") })).to.be.revertedWith(
                    "Raffle__NotEnoughEntranceFee"
                );
            });
            it("Raffle-test-入场成功", async function () {
                const playerRaffle = await ethers.getContract("Raffle", player);
                await playerRaffle.enterRaffle({ value: ethers.utils.parseEther("0.01") });
                const playerFromContract = await raffle.getPlayers(0);
                assert.equal(playerFromContract, player.address);
            });
            it("Raffle-test-入场成功事件", async function () {
                await expect(raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") })).to.emit(
                    raffle,
                    "RaffleEnter"
                );
            });
            it("Raffle-test-关闭入场后不能加入抽奖", async function () {
                await raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                await raffle.performUpkeep("0x");
                expect(raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") })).to.be.revertedWith(
                    "Raffle__RaffleNotOpen"
                );
            });
        });

        describe("Raffle-checkUpkeep-时机未到！", function () {
            //开奖 = isOpen + 时间 + 玩家
            it("Raffle-test-没有玩家不能开奖", async function () {
                //满足时间条件，以准确校验玩家条件
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                const checkUpkeep = await raffle.callStatic.checkUpkeep("0x");
                assert.equal(checkUpkeep[0], false);
            });
            it("Raffle-test-未到时间不能开奖", async function () {
                //满足玩家条件，以准确校验时间条件
                await raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") });
                const checkUpkeep = await raffle.callStatic.checkUpkeep("0x");
                assert.equal(checkUpkeep[0], false);
            });
            it("Raffle-test-摇色子中不能开奖", async function () {
                //满足时间条件+玩家条件，以准确校验isOpen条件
                await raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                //满足时间条件+玩家条件，通过调用performUpkeep方法，改变isOpen条件=计算中
                await raffle.performUpkeep("0x");
                const checkUpkeep = await raffle.callStatic.checkUpkeep("0x");
                assert.equal(checkUpkeep[0], false);
            })
        });

        describe("Raffle-checkUpkeep-苏醒吧！猎杀时刻到了！", function () {
            it("Raffle-test-可以开奖", async function () {
                await raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                const checkUpkeep = await raffle.callStatic.checkUpkeep("0x");
                assert.equal(checkUpkeep[0], true);
            });
        });

        describe("Raffle-performUpkeep-准备动手准备动手！", function () {
            it("Raffle-test-苍蝇搓手", async function () {
                await raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                assert(await raffle.performUpkeep("0x"));
            });
            it("Raffle-test-被回滚了", async function () {
                await expect(raffle.performUpkeep("0x")).to.be.revertedWith("Raffle__UpkeepNotNeeded");
            });
            it("Raffle-test-苍蝇搓手+1", async function () {
                await raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                const txResponse = await raffle.performUpkeep("0x");
                const txReceipt = await txResponse.wait(1);
                const raffleState = await raffle.getRaffleState();
                const requestId = txReceipt.events[1].args.requestId;
                assert.equal(raffleState.toString(), "1");
                assert(requestId.toNumber() > 0);
            });
        });

        describe("Raffle-fulfillRandomWords-摇色子ing", function () {
            beforeEach(async function () {
                await raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
            });
            it("Raffle-test-未发出随机数请求时要求开奖被回滚", async function () {
                await expect(vrfCoordinatorMock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith(
                    "InvalidRequest"
                );
                await expect(vrfCoordinatorMock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith(
                    "InvalidRequest"
                );
            });

            it.only("Raffle-test-开奖成功！", async function () {
                const startPlayerIndex = 1;
                const endPlayerIndex = 5;
                for (let i = startPlayerIndex; i < endPlayerIndex; i++) {
                    raffle = raffle.connect(accounts[i]);
                    await raffle.enterRaffle({ value: ethers.utils.parseEther("0.01") });
                }
                const lastTimeStamp = await raffle.getLastTimeStamp();

                await new Promise(async (resolve, reject) => {
                    raffle.once("WinnerPicked", async () => {
                        const recentWinner = await raffle.getRecentWinner();
                        console.log("天选之子出现了！", recentWinner);
                        console.log(accounts[1].address);
                        console.log(accounts[2].address);
                        console.log(accounts[3].address);
                        console.log(accounts[4].address);
                        try {
                            const raffleState = await raffle.getRaffleState();
                            const winnerBalance = await accounts[2].getBalance();
                            const endingTimeStamp = await raffle.getLastTimeStamp();



                            resolve();
                        } catch (error) {
                            reject(error);
                        };


                    });
                    const tx = await raffle.performUpkeep("0x");
                    const txReceipt = await tx.wait(1);
                    await vrfCoordinatorMock.fulfillRandomWords(
                        txReceipt.events[1].args.requestId,
                        raffle.address
                    );
                });



            });
        });
    });