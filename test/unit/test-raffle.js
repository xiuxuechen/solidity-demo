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

    });