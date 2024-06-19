// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "../datahub.sol";
import "hardhat/console.sol";


contract MockDatahub is DataHub {
  constructor(
    address initialOwner,
    address _executor,
    address _deposit_vault,
    address _oracle,
    address _interest,
    address utils
) DataHub(initialOwner, _executor, _deposit_vault, _oracle, _interest, utils) {}

  function addAssetsTest(
    address user,
    address token,
    uint256 amount
  ) external {
    userdata[user].asset_info[token] += amount;
  }
  function removeAssetsTest(
    address user,
    address token,
    uint256 amount
  ) external {
    userdata[user].asset_info[token] -= amount;
  }

  function addLiabilitiesTest(
    address user,
    address token,
    uint256 amount
  ) external {
      userdata[user].liability_info[token] += amount;
  }

  /// @notice removes a users liabilities
  /// @param user being targetted
  /// @param token being targetted
  /// @param amount to alter liabilities by
  function removeLiabilitiesTest(
      address user,
      address token,
      uint256 amount
  ) external {
      // console.log("==========remove liabilities test function==========");
      // console.log("user liability", userdata[user].liability_info[token]);
      userdata[user].liability_info[token] -= amount;
      // console.log("user liability after", userdata[user].liability_info[token]);
  }
  
  function settotalAssetSupplyTest(address token, uint256 amount, bool pos_neg) public {
    if (pos_neg == true) {
      assetdata[token].assetInfo[0] += amount; // 0 -> totalAssetSupply
    } else {
      assetdata[token].assetInfo[0] -= amount; // 0 -> totalAssetSupply
    }
  }

  function settotalBorrowAmountTest(address token, uint256 amount, bool pos_neg) public {
    if (pos_neg == true) {
      assetdata[token].assetInfo[1] += amount; // 0 -> totalAssetSupply
    } else {
      assetdata[token].assetInfo[1] -= amount; // 0 -> totalAssetSupply
    }
  }

  function toggleAssetPriceTest(
    address token,
    uint256 value
  ) external {
      assetdata[token].assetPrice = value;
  }

  function alterUserNegativeValueTest(address user) public {
    uint256 sumOfAssets;
    uint256 userLiabilities;
    sumOfAssets = calculateTotalAssetCollateralAmount(user);
    userLiabilities = calculateLiabilitiesValue(user);
    if(sumOfAssets < userLiabilities) {
      userdata[user].negative_value = userLiabilities - sumOfAssets;
    } else {
      userdata[user].negative_value = 0;
    }
  }

  function setTradeFee(address token, uint256 feeType, uint256 amount) public {
    assetdata[token].tradeFees[feeType] = amount;
  }
}