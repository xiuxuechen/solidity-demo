// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./PriceConverter.sol";

error NotOwner(bytes message);
error NotEnoughMoney(bytes message);
error FailRevert(bytes message);
contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIUM_USD = 50 * 1e18;
    address[] public funders;
    mapping(address => uint256) public addressToAmountFunded;

    address public immutable i_owner;

    constructor() {
        i_owner = msg.sender;
    }
    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    modifier onlyOwner() {
        if (i_owner != msg.sender) {
            revert NotOwner(unicode"你根本不是自己人！");
        }
        _;
    }

    function fund() public payable {
        if (msg.value.getConversionRate() < MINIUM_USD) {
            revert NotEnoughMoney(unicode"这点钱也好意思拿出来！");
        }
        funders.push(msg.sender);
        addressToAmountFunded[msg.sender] = msg.value;
    }

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
