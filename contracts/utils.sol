// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol" as IERC20;
import "./interfaces/IDataHub.sol";
import "./interfaces/IDepositVault.sol";
import "./interfaces/IOracle.sol";
import "./libraries/EVO_LIBRARY.sol";
import "./interfaces/IExecutor.sol";
import "./interfaces/IInterestData.sol";
import "hardhat/console.sol";

contract Utility is Ownable {
    function alterAdminRoles(
        address _DataHub,
        address _deposit_vault,
        address _oracle,
        address _interest,
        address _liquidator,
        address _ex
    ) public onlyOwner {
        admins[address(Datahub)] = false;
        admins[_DataHub] = true;
        Datahub = IDataHub(_DataHub);

        admins[address(DepositVault)] = false;
        admins[_deposit_vault] = true;
        DepositVault = IDepositVault(_deposit_vault);

        admins[address(Oracle)] = false;
        admins[_oracle] = true;
        Oracle = IOracle(_oracle);
        
        admins[address(interestContract)] = false;
        admins[_interest] = true;
        interestContract = IInterestData(_interest);

        admins[_liquidator] = true;

        admins[address(Executor)] = false;
        admins[_ex] = true;
        Executor = IExecutor(_ex);
    }

    /// @notice Keeps track of contract admins
    mapping(address => bool) public admins;

    IDataHub public Datahub;

    IOracle public Oracle;

    IDepositVault public DepositVault;

    IExecutor public Executor;

    IInterestData public interestContract;

    /// @notice Sets a new Admin role
    function setAdminRole(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    /// @notice Revokes the Admin role of the contract
    function revokeAdminRole(address _admin) external onlyOwner {
        admins[_admin] = false;
    }

    /// @notice checks the role authority of the caller to see if they can change the state
    modifier checkRoleAuthority() {
        require(admins[msg.sender] == true, "Unauthorized");
        _;
    }

    /** Constructor  */
    constructor(
        address initialOwner,
        address _DataHub,
        address _deposit_vault,
        address oracle,
        address _executor,
        address _interest
    ) Ownable(initialOwner) {
        admins[address(this)] = true;
        Datahub = IDataHub(_DataHub);
        DepositVault = IDepositVault(_deposit_vault);
        Oracle = IOracle(oracle);
        Executor = IExecutor(_executor);
        interestContract = IInterestData(_interest);
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param user being argetted
    /// @param token being argetted
    function validateMarginStatus(
        address user,
        address token
    ) public view returns (bool) {
        (, , , bool margined, ,) = Datahub.ReadUserData(user, token);
        return margined;
    }

    /// @notice Takes a single users address and returns the amount of liabilities that are going to be issued to that user
    function calculateAmountToAddToLiabilities(
        address user,
        address token,
        uint256 amount
    ) public view returns (uint256) {
        (uint256 assets, , , , ,) = Datahub.ReadUserData(user, token);
        return amount > assets ? amount - assets : 0;
    }
    /// @notice Cycles through two lists of users and checks how many liabilities are going to be issued to each user
    function calculateTradeLiabilityAddtions(
        address[2] memory pair,
        address[][2] memory participants,
        uint256[][2] memory trade_amounts
    ) public view returns (uint256[] memory, uint256[] memory) {
        uint256[] memory TakerliabilityAmounts = new uint256[](
            participants[0].length
        );
        uint256[] memory MakerliabilityAmounts = new uint256[](
            participants[1].length
        );
        uint256 TakeramountToAddToLiabilities;
        for (uint256 i = 0; i < participants[0].length; i++) {
            TakeramountToAddToLiabilities = calculateAmountToAddToLiabilities(
                    participants[0][i],
                    pair[0],
                    trade_amounts[0][i]
                );
            TakerliabilityAmounts[i] = TakeramountToAddToLiabilities;
        }
        uint256 MakeramountToAddToLiabilities;
        for (uint256 i = 0; i < participants[1].length; i++) {
            MakeramountToAddToLiabilities = calculateAmountToAddToLiabilities(
                    participants[1][i],
                    pair[1],
                    trade_amounts[1][i]
                );
            MakerliabilityAmounts[i] = MakeramountToAddToLiabilities;
        }

        return (TakerliabilityAmounts, MakerliabilityAmounts);
    }
    /// @notice Cycles through a list of users and returns the bulk assets sum
    function returnBulkAssets(
        address[] memory users,
        address token
    ) public view returns (uint256) {
        uint256 bulkAssets;
        for (uint256 i = 0; i < users.length; i++) {
            (uint256 assets, , , , ,) = Datahub.ReadUserData(users[i], token);

            bulkAssets += assets;
        }
        return bulkAssets;
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param user being argetted
    /// @param token being argetted
    /// @return assets
    function returnAssets(
        address user,
        address token
    ) external view returns (uint256) {
        (uint256 assets, , , , ,) = Datahub.ReadUserData(user, token);
        return assets;
    }

    function returnliabilities(
        address user,
        address token
    ) public view returns (uint256) {
        (, uint256 liabilities, , , ,) = Datahub.ReadUserData(user, token);
        return liabilities;
    }

    /// @notice Explain to an end user what this does
    /// @dev Explain to a developer any extra details
    /// @param user being targetted
    /// @param token being targetted
    /// @return pending balance
    function returnPending(
        address user,
        address token
    ) external view returns (uint256) {
        (, , uint256 pending, , ,) = Datahub.ReadUserData(user, token);
        return pending;
    }

    function returnMaintenanceRequirementForTrade(
        address token,
        uint256 amount
    ) external view returns (uint256) {
        IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(token);
        uint256 maintenace = assetLogs.marginRequirement[1]; // 1 -> MaintenanceMarginRequirement
        return ((maintenace * (amount)) / 10 ** 18); //
    }

    function validateTradeAmounts(
        uint256[][2] memory trade_amounts
    ) external pure returns (bool) {
        for (uint256 i = 0; i < trade_amounts[0].length; i++) {
            if(trade_amounts[0][i] == 0 || trade_amounts[1][i] == 0) {
                return false;
            }
        }
        return true;
    }

    /// @notice Checks that the trade will not push the asset over maxBorrowProportion
    function maxBorrowCheck(
        address[2] memory pair,
        address[][2] memory participants,
        uint256[][2] memory trade_amounts
    ) public view returns (bool) {
        uint256 newLiabilitiesIssued;
        for (uint256 i = 0; i < pair.length; i++) {
            uint256 collateral = EVO_LIBRARY.calculateTotal(trade_amounts[i]);
            uint256 bulkAssets = returnBulkAssets(participants[i], pair[i]);
            newLiabilitiesIssued = collateral > bulkAssets ? collateral - bulkAssets: 0;
            if (newLiabilitiesIssued > 0) {
                IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(pair[i]);
                bool flag = EVO_LIBRARY.calculateBorrowProportionAfterTrades(
                    assetLogs,
                    newLiabilitiesIssued
                );
                return flag;
            }
        }
        return true;
    }

    /// @notice this function runs the margin checks, changes margin status if applicable and adds pending balances
    /// @param pair the pair of tokens being traded
    /// @param participants of the trade 2 nested arrays
    /// @param trade_amounts the trades amounts for each participant
    function processMargin(
        address[2] memory pair,
        address[][2] memory participants,
        uint256[][2] memory trade_amounts
    ) external returns (bool) {
        bool takerTradeConfirmation = processChecks(
            participants[0],
            trade_amounts[0],
            pair[0]
        );
        bool makerTradeConfirmation = processChecks(
            participants[1],
            trade_amounts[1],
            pair[1]
        );
        if (!makerTradeConfirmation || !takerTradeConfirmation) {
            return false;
        } else {
            return true;
        }
    }

    /// @notice Processes a trade details
    /// @param  participants the participants on the trade
    /// @param  tradeAmounts the trade amounts in the trade
    /// @param  pair the token involved in the trade
    function processChecks(
        address[] memory participants,
        uint256[] memory tradeAmounts,
        address pair
    ) internal returns (bool) {
        IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(pair);
        for (uint256 i = 0; i < participants.length; i++) {
            (uint256 assets, , , , ,) = Datahub.ReadUserData(
                participants[i],
                pair
            );

            if (tradeAmounts[i] > assets) {
                uint256 initalMarginFeeAmount = EVO_LIBRARY.calculateinitialMarginFeeAmount(assetLogs, tradeAmounts[i]);
                initalMarginFeeAmount = (initalMarginFeeAmount * assetLogs.assetPrice) / 10 ** 18;
                uint256 collateralValue = Datahub.calculateCollateralValue(participants[i]) - Datahub.calculatePendingCollateralValue(participants[i]);

                uint256 aimrForUser = Datahub.calculateAIMRForUser(participants[i]);
                if (collateralValue <= aimrForUser + initalMarginFeeAmount) {
                    return false;
                }
                bool flag = validateMarginStatus(participants[i], pair);
                if (!flag) {
                    Datahub.SetMarginStatus(participants[i], true);
                }
            }
        }
        return true;
    }
    function returnEarningProfit(address user, address token) external view returns(uint256) {
        ( , , , , , uint256 lending_pool_amount) = Datahub.ReadUserData(user, token);
        uint256 currentRateIndex = interestContract.fetchCurrentRateIndex(token);
        uint256 usersEarningRateIndex = Datahub.viewUsersEarningRateIndex(user, token);
        uint256 averageCumulativeDepositInterest;
        if(token == DepositVault._USDT()) {
            (averageCumulativeDepositInterest) = interestContract.calculateAverageCumulativeDepositInterest(
                usersEarningRateIndex,
                currentRateIndex,
                token
            );
        } else {
            (averageCumulativeDepositInterest) = interestContract.calculateAverageCumulativeDepositInterest(
                usersEarningRateIndex,
                currentRateIndex,
                token
            );
        }
        
        (uint256 interestCharge, ,) = EVO_LIBRARY.calculateCompoundedAssets(
                currentRateIndex,
                averageCumulativeDepositInterest * 95 / 100, // 0.99
                lending_pool_amount,
                usersEarningRateIndex
            );
        return interestCharge;
    }

    function debitAssetInterest(address user, address token) public checkRoleAuthority {
        (, , , , , uint256 lending_pool_amount) = Datahub.ReadUserData(user, token);

        uint256 currentRateIndex = interestContract.fetchCurrentRateIndex(token);
        uint256 usersEarningRateIndex = Datahub.viewUsersEarningRateIndex(user, token);
        address orderBookProvider = Executor.fetchOrderBookProvider();
        address daoWallet = Executor.fetchDaoWallet();

        (uint256 averageCumulativeDepositInterest) = interestContract.calculateAverageCumulativeDepositInterest(
            usersEarningRateIndex,
            currentRateIndex,
            token
        );
        (
            uint256 interestCharge,
            uint256 OrderBookProviderCharge,
            uint256 DaoInterestCharge
        ) = EVO_LIBRARY.calculateCompoundedAssets(
                currentRateIndex,
                averageCumulativeDepositInterest * 95 / 100, // 0.95,
                lending_pool_amount,
                usersEarningRateIndex
            );
        Datahub.alterUsersEarningRateIndex(user, token);
        Datahub.addAssets(user, token, interestCharge);
        Datahub.addAssets(daoWallet, token, DaoInterestCharge);
        Datahub.addAssets(orderBookProvider, token, OrderBookProviderCharge);
    }
    function fetchBorrowProportionList(
        uint256 dimension,
        uint256 startingIndex,
        uint256 endingIndex,
        address token
    ) public view returns (uint256[] memory) {
        uint256[] memory BorrowProportionsForThePeriod = new uint256[](
            (endingIndex) - startingIndex + 1
        );
        uint counter = 0;
        for (uint256 i = startingIndex; i <= endingIndex; i++) {
            BorrowProportionsForThePeriod[counter] = interestContract.fetchTimeScaledRateIndex(dimension, token, i).borrowProportionAtIndex;

            counter += 1;
        }
        return BorrowProportionsForThePeriod;
    }
    function fetchRatesList(
        uint256 dimension,
        uint256 startingIndex,
        uint256 endingIndex,
        address token
    ) external view returns (uint256[] memory) {
        uint256[] memory interestRatesForThePeriod = new uint256[](
            (endingIndex) - startingIndex + 1
        );
        uint counter = 0;
        for (uint256 i = startingIndex; i <= endingIndex; i++) {
            interestRatesForThePeriod[counter] = interestContract.fetchTimeScaledRateIndex(dimension, token, i).interestRate;
            counter += 1;
        }
        return interestRatesForThePeriod;
    }

    /// @notice Fetches the total amount borrowed of the token
    /// @param token the token being queried
    /// @return the total borrowed amount
    function fetchTotalAssetSupply(
        address token
    ) external view returns (uint256) {
        return  Datahub.returnAssetLogs(token).assetInfo[0]; // 0 -> totalAssetSupply
    }
    receive() external payable {}
}
