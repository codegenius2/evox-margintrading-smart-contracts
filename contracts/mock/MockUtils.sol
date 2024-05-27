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
    (uint256 assets, , , , ) = Datahub.ReadUserData(user, token);

    uint256 currentReateIndex = interestContract.fetchCurrentRateIndex(token);
    uint256 usersEarningRateIndex = Datahub.viewUsersEarningRateIndex(user, token);
    address orderBookProvider = Executor.fetchOrderBookProvider();
    address daoWallet = Executor.fetchDaoWallet();

    uint256 averageCumulativeDepositInterest = interestContract.calculateAverageCumulativeDepositInterest(
        usersEarningRateIndex,
        currentReateIndex,
        token
    );

    // console.log("averageCumulativeDepositInterest", averageCumulativeDepositInterest);

    (
        uint256 interestCharge,
        uint256 OrderBookProviderCharge,
        uint256 DaoInterestCharge
    ) = EVO_LIBRARY.calculateCompoundedAssets(
            currentReateIndex,
            averageCumulativeDepositInterest,
            assets,
            usersEarningRateIndex
        );
    // console.log("interest rate", interestCharge);
    return interestCharge + OrderBookProviderCharge + DaoInterestCharge;
  }
}