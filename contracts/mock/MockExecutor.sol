// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IDataHub.sol";
import "../interfaces/IDepositVault.sol";
import "../interfaces/IExecutor.sol";
import "../executor.sol";
import "hardhat/console.sol";


contract MockExecutor is EVO_EXCHANGE {
  constructor(
        address initialOwner,
        address _DataHub,
        address _deposit_vault,
        address oracle,
        address _utility,
        address _interest,
        address _liquidator
    ) EVO_EXCHANGE(initialOwner, _DataHub, _deposit_vault, oracle, _utility, _interest, _liquidator) {}

    /// @notice Sets a new orderbook provider wallet
    function setOrderBookProviderTest(address _newwallet) public {
        OrderBookProviderWallet = _newwallet;
    }

    /// @notice Sets a new DAO wallet
    function setDaoWalletTest(address _dao) public {
        DAO = _dao;
    }

}