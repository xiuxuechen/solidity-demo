// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title HelloWorld
 * @author xxc
 * @notice 这是一个简单的合约
 */
contract HelloWorld {
    /**
     * @notice 获取当前计数
     */
    uint256 public count;

    /**
     * @notice 获取当前名称
     */
    string public name;

    /**
     * @notice 构造函数
     * @param _iniCount 初始计数
     * @param _name 初始名称
     */
    constructor(uint256 _iniCount, string memory _name) {
        count = _iniCount;
        name = _name;
    }

    /**
     * @notice 计数增加
     * @param _num 要增加的数量
     */
    function incrCount(uint256 _num) public virtual {
        count = count + _num;
    }
}
