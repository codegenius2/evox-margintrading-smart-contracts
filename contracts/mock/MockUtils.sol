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

  function returnEarningRateProfit(address user, address token) public view returns(uint256) {
    // console.log("=============== returnEarningReateProfit ==================");
    ( , , , , , uint256 lending_pool_amount) = Datahub.ReadUserData(user, token);

    uint256 currentRateIndex = interestContract.fetchCurrentRateIndex(token);
    uint256 usersEarningRateIndex = Datahub.viewUsersEarningRateIndex(user, token);
    uint256 averageCumulativeDepositInterest;
    // address orderBookProvider = Executor.fetchOrderBookProvider();
    // address daoWallet = Executor.fetchDaoWallet();
    if(token == DepositVault._USDT()) {
      // console.log("========================================= USDT ================================================");
      (averageCumulativeDepositInterest) = interestContract.calculateAverageCumulativeDepositInterest(
          usersEarningRateIndex,
          currentRateIndex,
          token
      );
      // console.log("endindex-startindex", currentRateIndex, usersEarningRateIndex);
      // console.log("averageCumulativeDepositInterest", averageCumulativeDepositInterest);
      // console.log("lending_pool_amount", lending_pool_amount);
      // console.log("===============================================================================================");
    } else {
      (averageCumulativeDepositInterest) = interestContract.calculateAverageCumulativeDepositInterest(
          usersEarningRateIndex,
          currentRateIndex,
          token
      );
    }
    
    (
        uint256 interestCharge,
        uint256 OrderBookProviderCharge,
        uint256 DaoInterestCharge
    ) = EVO_LIBRARY.calculateCompoundedAssets(
            currentRateIndex,
            averageCumulativeDepositInterest * 95 / 100, // 0.99
            lending_pool_amount,
            usersEarningRateIndex
        );
    // console.log("interest rate", interestCharge + OrderBookProviderCharge + DaoInterestCharge);
    return interestCharge + OrderBookProviderCharge + DaoInterestCharge;
  }
}