// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

interface IDataHub {
    struct UserData {
        mapping(address => uint256) asset_info; // user's asset amount
        mapping(address => uint256) lending_pool_info; // user's lending pool amount
        mapping(address => uint256) liability_info; // tracks what they owe per token * price
        mapping(address => mapping(address => uint256)) maintenance_margin_requirement; // tracks the MMR per token the user has in liabilities
        mapping(address => mapping(address => uint256)) initial_margin_requirement; // tracks the IMR per token the user has in liabilities
        mapping(address => uint256) pending_balances; // user's pending balance while trading
        mapping(address => uint256) interestRateIndex; // interest rate index for charging
        mapping(address => uint256) earningRateIndex; // earning rate index for charging
        uint256 negative_value; // display negative value if totoalCollateral < totalBorrowedAmount
        bool margined; // if user has open margin positions this is true
        address[] tokens; // these are the tokens that comprise their portfolio ( assets, and liabilites, margined funds)
    }

    struct AssetData {
        bool initialized; // flag if the token is initialized
        uint256[2] tradeFees; // first in the array is taker fee, next is maker fee
        uint256 collateralMultiplier; // collateral multiplier for check margin trading
        uint256 assetPrice; // token price
        uint256[3] assetInfo; // 0 -> totalAssetSupply, 1 -> totalBorrowedAmount, 2 -> lendingPoolSupply
        uint256[2] feeInfo; // 0 -> initialMarginFee, 1 -> liquidationFee
        uint256[2] marginRequirement; // 0 -> initialMarginRequirement, 1 -> MaintenanceMarginRequirement
        uint256[2] borrowPosition; // 0 -> optimalBorrowProportion, 1 -> maximumBorrowProportion
        uint256 totalDepositors; // reserved
    }

    function addAssets(address user, address token, uint256 amount) external;

    function fetchTotalAssetSupply(
        address token
    ) external view returns (uint256);

    function tradeFee(
        address token,
        uint256 feeType
    ) external view returns (uint256);

    function calculateAIMRForUser(
        address user,
        address trade_token,
        uint256 trade_amount
    ) external view returns (uint256);

    function removeAssets(address user, address token, uint256 amount) external;

    function alterUsersInterestRateIndex(address user, address token) external;

    function viewUsersEarningRateIndex(
        address user,
        address token
    ) external view returns (uint256);

    function alterUsersEarningRateIndex(address user, address token) external;

    function viewUsersInterestRateIndex(
        address user,
        address token
    ) external view returns (uint256);

    function alterLiabilities(
        address user,
        address token,
        uint256 amount
    ) external;

    function addLiabilities(
        address user,
        address token,
        uint256 amount
    ) external;

    function removeLiabilities(
        address user,
        address token,
        uint256 amount
    ) external;

    function divideFee(address token, uint256 amount) external;

    function addPendingBalances(
        address user,
        address token,
        uint256 amount
    ) external;

    function removePendingBalances(
        address user,
        address token,
        uint256 amount
    ) external;

    function alterUserNegativeValue(
        address user
    ) external;

    function SetMarginStatus(address user, bool onOrOff) external;

    function calculateAIMRForUser(address user) external view returns (uint256);

    function checkIfAssetIsPresent(
        address[] memory users,
        address token
    ) external returns (bool);

    function ReadUserData(
        address user,
        address token
    ) external view returns (uint256, uint256, uint256, bool, address[] memory, uint256);

    function removeAssetToken(address user, address token) external;

    function setAssetInfo(uint8 id,  address token, uint256 amount, bool pos_neg
    ) external;

    function updateInterestIndex(address token, uint256 value) external;

    function returnAssetLogs(
        address token
    ) external view returns (AssetData memory);

    function FetchAssetInitilizationStatus(
        address token
    ) external view returns (bool);

    function toggleAssetPrice(address token, uint256 value) external;

    function checkMarginStatus(
        address user,
        address token,
        uint256 BalanceToLeave
    ) external;

    function calculateAMMRForUser(address user) external view returns (uint256);

    function calculateTotalPortfolioValue(
        address user
    ) external view returns (uint256);

    function changeMarginStatus(address user) external returns (bool);

    function returnUsersAssetTokens(
        address user
    ) external view returns (address[] memory);

    function calculateCollateralValue(
        address user
    ) external view returns (uint256);

    function calculatePendingCollateralValue(
        address user
    ) external view returns (uint256);

    function setTokenTransferFee(
        address token,
        uint256 value
    ) external ;

    function tokenTransferFees(address token)external returns(uint256);

    function changeTotalBorrowedAmountOfAsset(address token, uint256 _updated_value) external;
}
