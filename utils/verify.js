const { run } = require("hardhat");
async function verify(contract, args) {
    console.log("正在验证合约...");
    try {
        await run("verify:verify", {
            address: contract.address,
            constructorArguments: args,
        });
        console.log("合约验证成功！");
    } catch (e) {
        if (e.message.toLowerCase().includes("already been verified")) {
            console.log("合约已验证，无需重复验证。");
        } else {
            console.log("合约验证失败:", e);
        }
    }
}

module.exports = { verify };