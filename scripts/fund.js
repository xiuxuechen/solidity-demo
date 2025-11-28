const { ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("获取到FundMe合约，合约地址为：", fundMe.address);

    const response = await fundMe.fund({ value: ethers.parseEther("0.001") });
    await response.wait(1);
    console.log("众筹成功！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })