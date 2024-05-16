// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IDataHub.sol";
import "../interfaces/IDepositVault.sol";
import "../interfaces/IExecutor.sol";
import "../utils.sol";
import "hardhat/console.sol";

contract MockUtils is Utility {
  constructor(address initialOwner, address _DataHub, address _deposit_vault, address oracle, address _executor, address _interest) Utility(initialOwner, _DataHub, _deposit_vault, oracle, _executor, _interest) {}
}