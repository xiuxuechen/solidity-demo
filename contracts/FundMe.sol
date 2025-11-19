// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PriceConverter.sol";

error NotOwner(bytes message);
error NotEnoughMoney(bytes message);
error FailRevert(bytes message);

/**
 * @title FundMe
 * @dev 一个简单的众筹合约，允许用户捐款并让所有者提取资金
 */
contract FundMe {
    /**
     * @dev 使用PriceConverter库
     */
    using PriceConverter for uint256;

    /**
     * @dev 最小众筹金额
     */
    uint256 public constant MINIUM_USD = 50 * 1e18;

    /**
     * @dev 众筹者列表
     */
    address[] public funders;

    /**
     * @dev 众筹者金额映射
     */
    mapping(address => uint256) public addressToAmountFunded;

    /**
     * @dev 合约拥有者
     */
    address public immutable i_owner;

    /**
     * @dev 汇率合约
     */
    AggregatorV3Interface public priceFeed;

    /**
     * @dev 仅允许合约拥有者调用
     */
    modifier onlyOwner() {
        if (i_owner != msg.sender) {
            revert NotOwner(unicode"你根本不是自己人！");
        }
        _;
    }

    /**
     * @dev 构造函数
     * @param priceFeedAddress 汇率合约地址
     */
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    /**
     * @dev 接收函数
     */
    receive() external payable {
        fund();
    }

    /**
     * @dev 默认函数
     */
    fallback() external payable {
        fund();
    }

    /**
     * @dev 众筹函数
     */
    function fund() public payable {
        if (msg.value.getConversionRate(priceFeed) < MINIUM_USD) {
            revert NotEnoughMoney(unicode"这点钱也好意思拿出来！");
        }
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

    /**
     * @dev 提现函数
     */
    function withdow() public onlyOwner {
        funders = new address[](0);
        // //gas最多2300，失败自动回滚
        // payable(msg.sender).transfer(address(this).balance);
        // //gas最多2300，有返回值，失败不会自动回滚
        // (bool sendStatus) = payable (msg.sender).send(address(this).balance);
        // require(sendStatus,unicode"提现失败！");

        (bool callStatus, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        if (!callStatus) {
            revert FailRevert(unicode"卷钱失败！！");
        }
    }
}
