const { ethers } = require("hardhat");
const { assert } = require("chai");

describe("HelloWorld Contract Deployment", function () {

    let helloWorldFactory, helloWorld;

    beforeEach(async function () {
        helloWorldFactory = await ethers.getContractFactory("HelloWorld");
        helloWorld = await helloWorldFactory.deploy(1, "Hello, Hardhat!");
    });
    it("测试合约构造器", async function () {
        assert.equal(await helloWorld.name(), "Hello, Hardhat!");
        assert.equal((await helloWorld.count()).toString(), "1");
    });

    it("测试合约方法-increment", async function () {
        const txResponse = await helloWorld.incrCount(1);
        await txResponse.wait();
        assert.equal((await helloWorld.count()).toString(), "2");
    });

});