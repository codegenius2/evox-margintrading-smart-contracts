// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol" as IERC20;
import "./interfaces/IDataHub.sol";
import "./interfaces/IDepositVault.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IUtilityContract.sol";
import "./interfaces/IInterestData.sol";
import "./libraries/EVO_LIBRARY.sol";
import "./interfaces/IExecutor.sol";

import "hardhat/console.sol";

contract Liquidator is Ownable {
    IUtilityContract public Utilities;
    IDataHub public Datahub;
    IInterestData public interestContract;
    IExecutor public Executor;

    /** Constructor  */
    constructor(
        address initialOwner,
        address _DataHub,
        address _executor
    ) Ownable(initialOwner) {
        Datahub = IDataHub(_DataHub);
        Executor = IExecutor(_executor);
    }

    mapping(address => uint256) FeesCollected; // token --> amount

    /// @notice This alters the admin roles for the contract
    /// @param _executor the address of the new executor contract
    function alterAdminRoles(address _executor, address _datahub, address _utility, address _interest) public onlyOwner {
        Executor = IExecutor(_executor);
        Datahub = IDataHub(_datahub);
        Utilities = IUtilityContract(_utility);
        interestContract = IInterestData(_interest);
    }

    /// @notice This checks if the user is liquidatable
    /// @dev add in the users address to check their Aggregate Maintenance Margin Requirement and see if its higher that their Total Portfolio value
    function CheckForLiquidation(address user) public view returns (bool) {
        if (Datahub.calculateAMMRForUser(user) > Datahub.calculateCollateralValue(user)) {
            return true;
        } else {
            return false;
        }
    }

    // TO DO when we pull TPV we need to add pending balances in here as well --> loop through pending convert to price add to tpv
    /// @notice This function is for liquidating a user
    /// @dev Explain to a developer any extra details
    /// @param user the address of the user being liquidated
    /// @param tokens the liability token (the token the liquidatee has outstanding liabilities on), liquidation token ( the tokens that are liquidated from the liquidatees account)
    /// @param spendingCap the max amount the liquidator is willing to pay to settled the liquidatee's debt
    function Liquidate(
        address user,
        address[2] memory tokens, // liability tokens first, tokens to liquidate after
        uint256 spendingCap
    ) public {
        require(CheckForLiquidation(user), "not liquidatable"); // AMMR liquidatee --> checks AMMR
        require(tokens.length == 2, "have to select a pair");
        
        uint256 user0_liabilities;
        user0_liabilities = fetchliabilities(user, tokens[0]);
        
        if(user0_liabilities > 0) {
            uint256 interestCharge = interestContract.returnInterestCharge(
                user,
                tokens[0],
                0
            );
            user0_liabilities = user0_liabilities + interestCharge;
        }

        require(
            spendingCap <= user0_liabilities,
            "cannot liquidate that amount of the users assets"
        );

        require(
            spendingCap <= fetchAssets(msg.sender, tokens[0]),
            "you do not have the assets required for this size of liquidation, please lower your spending cap"
        );

        IDataHub.AssetData memory token1_assetlogs = fetchLogs(tokens[1]);
        IDataHub.AssetData memory token0_assetlogs = fetchLogs(tokens[0]);
        uint256[] memory taker_amounts = new uint256[](1);
        uint256[] memory maker_amounts = new uint256[](1);
        
        uint256 rawLiquidationTokenAmount = spendingCap * token0_assetlogs.assetPrice / token1_assetlogs.assetPrice;

        uint256 liquidationFee = rawLiquidationTokenAmount * token1_assetlogs.feeInfo[1] / 10**18; // watch out with zero here (although no asset should ever be initialized with a 0 liquidation fee)

        Datahub.addAssets(Executor.fetchDaoWallet(), tokens[1], liquidationFee * 18 / 100);
        Datahub.addAssets(Executor.fetchOrderBookProvider(), tokens[1], liquidationFee * 2 / 100);

        uint256 totalLiquidationTokenAmountToSubtractFromLiquidatee = rawLiquidationTokenAmount + liquidationFee;

        require(totalLiquidationTokenAmountToSubtractFromLiquidatee <= fetchAssets(user, tokens[1]), "Liquidatee does not have enough of those tokens in their assets to liquidate at your requested spend amount");

        taker_amounts[0] = spendingCap;
        maker_amounts[0] = totalLiquidationTokenAmountToSubtractFromLiquidatee;

        conductLiquidation(
            user,
            msg.sender,
            tokens,
            maker_amounts,
            taker_amounts,
            liquidationFee * 20 / 100
        );
    }

    function returnMultiplier(
        bool short,
        address token
    ) private view returns (uint256) {
        if (!short) {
            return 10 ** 18 - fetchLogs(token).feeInfo[1]; // 1 -> liquidationFee 100000000000000000
        } else {
            return 10 ** 18 + fetchLogs(token).feeInfo[1]; // 1 -> liquidationFee
        }
    }

    function conductLiquidation(
        address user,
        address liquidator,
        address[2] memory tokens, // liability tokens first, tokens to liquidate after
        uint256[] memory maker_amounts,
        uint256[] memory taker_amounts,
        uint256 liquidation_fee
    ) private {
        address[][2] memory participants;
        uint256[][2] memory trade_amounts;
        participants[0] = EVO_LIBRARY.createArray(liquidator);
        participants[1] = EVO_LIBRARY.createArray(user);
        trade_amounts[0] = taker_amounts;
        trade_amounts[1] = maker_amounts;

        (uint256[] memory takerLiabilities, uint256[] memory makerLiabilities) = Utilities.calculateTradeLiabilityAddtions(tokens, participants, trade_amounts);
        require(Utilities.validateTradeAmounts(trade_amounts), "Never 0 trades");
        require(
            Utilities.maxBorrowCheck(tokens, participants, trade_amounts),
            "this liquidation would exceed max borrow proportion please lower the spending cap"
        );

        require(
            Utilities.processMargin(tokens, participants, trade_amounts),
            "This trade failed the margin checks for one or more users"
        );
        require(Datahub.calculateCollateralValue(user) < Datahub.calculateAMMRForUser(user));

        bool[] memory fee_side = new bool[](1);
        bool[] memory fee_side_2 = new bool[](1);

        fee_side[0] = true;
        fee_side_2[0] = true;

        freezeTempBalance(
            tokens,
            participants,
            trade_amounts,
            [fee_side, fee_side_2]
        );

        Executor.TransferBalances(
            tokens,
            participants[0],
            participants[1],
            taker_amounts,
            maker_amounts,
            takerLiabilities,
            makerLiabilities,
            [fee_side, fee_side_2]
        );

        Datahub.removeAssets(liquidator, tokens[1], liquidation_fee);
    }

    /// @notice This simulates an airnode call to see if it is a success or fail
    /// @param pair the pair of tokens being traded
    /// @param participants of the trade 2 nested arrays
    /// @param trade_amounts the trades amounts for each participant
    function freezeTempBalance(
        address[2] memory pair,
        address[][2] memory participants,
        uint256[][2] memory trade_amounts,
        bool[][2] memory trade_side
    ) private {
        alterPending(participants[0], trade_amounts[0], trade_side[0], pair[0]);
        alterPending(participants[1], trade_amounts[1], trade_side[1], pair[1]);
    }

    /// @notice Processes a trade details
    /// @param  participants the participants on the trade
    /// @param  tradeAmounts the trade amounts in the trade
    /// @param  pair the token involved in the trade
    function alterPending(
        address[] memory participants,
        uint256[] memory tradeAmounts,
        bool[] memory tradeside,
        address pair
    ) internal returns (bool) {
        for (uint256 i = 0; i < participants.length; i++) {
            (uint256 assets, , , , ,) = Datahub.ReadUserData(
                participants[i],
                pair
            );
             if (tradeside[i]) {} else {
                uint256 tradeFeeForTaker = Datahub.tradeFee(pair, 1);
                tradeAmounts[i] = tradeAmounts[i] - (tradeFeeForTaker * tradeAmounts[i]) / 10 ** 18;
                assets = assets - (tradeFeeForTaker * assets) / 10 ** 18;
            }
            uint256 balanceToAdd = tradeAmounts[i] > assets ? assets : tradeAmounts[i];
            AlterPendingBalances(participants[i], pair, balanceToAdd);
        }
        return true;
    }

    /// @notice Alters a users pending balance
    /// @param participant the participant being adjusted
    /// @param asset the asset being traded
    /// @param trade_amount the amount being adjusted
    function AlterPendingBalances(
        address participant,
        address asset,
        uint256 trade_amount
    ) private {
        // pay fee take less from the maker if they are a maker
        Datahub.addPendingBalances(participant, asset, trade_amount);
    }

    function fetchLogs(
        address token
    ) private view returns (IDataHub.AssetData memory) {
        IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(token);

        return assetLogs;
    }

    function fetchAssets(
        address user,
        address token
    ) private view returns (uint256) {
        (uint256 assets, , , , ,) = Datahub.ReadUserData(user, token);
        return assets;
    }

    function fetchliabilities(
        address user,
        address token
    ) private view returns (uint256) {
        (, uint256 liabilities, , , ,) = Datahub.ReadUserData(user, token);
        return liabilities;
    }
}
