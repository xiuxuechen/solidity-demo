// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";

error Raffle__NotEnoughEntranceFee(string message);
error Raffle__TransferFailed(string message);
error Raffle__RaffleNotOpen(string message);
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

/**
 * @title 你渴望力量吗！
 * @author xxc
 * @notice 这是一个基于链上随机数的抽奖合约
 */
contract Raffle is VRFConsumerBaseV2, AutomationCompatibleInterface {
  enum RaffleState {
    OPEN,
    CALCULATING
  }

  uint256 private immutable i_entranceFee;
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint64 private immutable i_subscriptionId;
  bytes32 private immutable i_gasLane;
  uint32 private immutable i_callbackGasLimit;
  uint256 private immutable i_interval;

  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private constant NUM_WORDS = 1;

  address payable[] private s_players;
  address private s_recentWinner;
  RaffleState private s_raffleState;
  uint256 private s_lastTimeStamp;

  event WinnerPicked(address indexed winner);

  constructor(
    address vrfCoordinatorV2,
    uint64 subscriptionId,
    bytes32 gasLane,
    uint256 interval,
    uint256 entranceFee,
    uint32 callbackGasLimit
  ) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_subscriptionId = subscriptionId;
    i_gasLane = gasLane;
    i_interval = interval;
    i_entranceFee = entranceFee;
    i_callbackGasLimit = callbackGasLimit;
    s_raffleState = RaffleState.OPEN;
    s_lastTimeStamp = block.timestamp;
  }

  /**
   * @notice 进入抽奖池
   * @dev 需要支付一定的入场费
   */
  function enterRaffle() public payable {
    if (s_raffleState != RaffleState.OPEN) {
      revert Raffle__RaffleNotOpen(unicode"奖池未开启！");
    }
    if (msg.value < i_entranceFee) {
      revert Raffle__NotEnoughEntranceFee(unicode"亲，您的入场费不够哦！");
    }
    s_players.push(payable(msg.sender));
  }

  /**
   * @notice 判断是否可以抽奖
   * @dev 触发条件：
   * 1. 抽奖池未关闭
   * 2. 抽奖池有玩家
   * 3. 抽奖池有资金
   * 4. 抽奖池间隔时间已到
   */
  function checkUpkeep(
    bytes calldata checkData
  ) public view override returns (bool upkeepNeeded, bytes memory performData) {
    bool isOpen = (s_raffleState == RaffleState.OPEN);
    bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
    bool hasPlayers = (s_players.length > 0);
    bool hasBalance = address(this).balance > 0;
    upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    performData = checkData;
  }

  /**
   * @notice 开始表演！
   */
  function performUpkeep(bytes calldata performData) external override {
    (bool upkeepNeeded, ) = checkUpkeep(performData);
    if (!upkeepNeeded) {
      revert Raffle__UpkeepNotNeeded(
        address(this).balance,
        s_players.length,
        uint256(s_raffleState)
      );
    }
    s_raffleState = RaffleState.CALCULATING;
    uint256 requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane,
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
  }

  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
    uint256 recentWinnerIndex = randomWords[0] % s_players.length;
    address payable recentWinner = s_players[recentWinnerIndex];
    s_recentWinner = recentWinner;
    s_raffleState = RaffleState.OPEN;
    s_players = new address payable[](0);
    s_lastTimeStamp = block.timestamp;
    (bool success, ) = recentWinner.call{ value: address(this).balance }("");
    if (!success) {
      revert Raffle__TransferFailed(unicode"奖金莫得了");
    }
    emit WinnerPicked(recentWinner);
  }

  function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
  }

  function getPlayers(uint256 index) public view returns (address) {
    return s_players[index];
  }

  function getRaffleState() public view returns (RaffleState) {
    return s_raffleState;
  }

  function getRecentWinner() public view returns (address) {
    return s_recentWinner;
  }

  function getLengthOfPlayers() public view returns (uint256) {
    return s_players.length;
  }
  function getNumWords() public pure returns (uint32) {
    return NUM_WORDS;
  }

  function getRequestConfirmations() public pure returns (uint16) {
    return REQUEST_CONFIRMATIONS;
  }

  function getInterval() public view returns (uint256) {
    return i_interval;
  }

  function getLastTimeStamp() public view returns (uint256) {
    return s_lastTimeStamp;
  }
}
