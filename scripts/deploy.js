const { ethers, network, run } = require("hardhat");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();
    const helloWorldFactory = await ethers.getContractFactory("HelloWorld");
    console.log("部署合约中，请等待...");
    const helloWorld = await helloWorldFactory.deploy(1, "Hello, Hardhat!");
    console.log("等待区块确认...");
    await helloWorld.deployTransaction.wait(1);
    console.log("合约已部署到地址:", helloWorld.address);
    if (network.config.chainId == process.env.SEPOLIA_CHAIN_ID && process.env.ETHERSCAN_API_KEY) {
        await verify(helloWorld, [1, "Hello, Hardhat!"]);
    }
    let currentCount = await helloWorld.count();
    let currentName = await helloWorld.name();

    console.log("当前 count:", currentCount.toString());
    console.log("当前 name: ", currentName);

    // 调用合约函数
    console.log("\n🔄 调用 incrCount 函数...");
    const txResponse = await helloWorld.incrCount(12, { gasLimit: 300000 });
    await txResponse.wait(); // 等待交易确认

    console.log("✅ 函数调用成功！");

    // 再次读取状态查看变化
    let updatedCount = await helloWorld.count();
    console.log("更新后的 count: ", updatedCount);

    console.log("\n🎉 所有操作完成！");
}

async function verify(contract, args) {
    console.log("正在验证合约...");
    try {
        await run("verify:verify", {
            address: contract.address,
            constructorArguments: args,
        });
        console.log("合约验证成功！");
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("合约已验证，无需重复验证。");
        } else {
            console.log("合约验证失败:", e);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });