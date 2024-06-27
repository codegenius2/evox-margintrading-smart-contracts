// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol" as IERC20;
import "./interfaces/IDataHub.sol";
import "./interfaces/IDepositVault.sol";
import "./interfaces/IOracle.sol";
import "./interfaces/IUtilityContract.sol";
import "./libraries/EVO_LIBRARY.sol";
import "./interfaces/IInterestData.sol";

/// @title This is the EVO Exchange contract
/// @author EVO X Labs.
/// @notice This contract is responsible for sending trade requests to the Oracle
/// contract to be validated by the API3 Airnodes and executing the trades once confirmed

contract EVO_EXCHANGE is Ownable {
    /** Address's  */

    /// @notice Datahub contract
    IDataHub public Datahub;

    /// @notice Oracle contract
    IOracle public Oracle;

    /// @notice Deposit vaultcontract
    IDepositVault public DepositVault;

    /// @notice Interest contract
    IInterestData public interestContract;

    /// @notice The Utilities contract
    IUtilityContract public Utilities;
    /// @notice The Order book provider wallet address
    address public OrderBookProviderWallet;
    /// @notice The Liquidator contract address
    address public Liquidator;
    /// @notice The DAO wallet address
    address public DAO;

    /// @notice The current Airnode address
    address private airnodeAddress =
        address(0xbb9094538DfBB7949493D3E1E93832F36c3fBE8a);

    /// @notice Alters the Admin roles for the contract
    /// @param _datahub  the new address for the datahub
    /// @param _deposit_vault the new address for the deposit vault
    /// @param _oracle the new address for oracle
    /// @param _util the new address for the utility contract
    /// @param  _int the new address for the interest contract
    /// @param _liquidator the liquidator addresss
    function alterAdminRoles(
        address _datahub,
        address _deposit_vault,
        address _oracle,
        address _util,
        address _int,
        address _liquidator
    ) public {
        admins[address(Datahub)] = false;
        admins[_datahub] = true;
        Datahub = IDataHub(_datahub);
        
        admins[address(DepositVault)] = false;
        admins[_deposit_vault] = true;
        DepositVault = IDepositVault(_deposit_vault);

        admins[address(Oracle)] = false;
        admins[_oracle] = true;
        Oracle = IOracle(_oracle);

        admins[address(Utilities)] = false;
        admins[_util] = true;
        Utilities = IUtilityContract(_util);

        admins[address(interestContract)] = false;
        admins[_int] = true;
        interestContract = IInterestData(_int);

        admins[address(Liquidator)]= false;
        admins[_liquidator] = true;
        Liquidator = _liquidator;
    }

    /** Constructor  */
    constructor(
        address initialOwner,
        address _DataHub,
        address _deposit_vault,
        address oracle,
        address _utility,
        address _interest,
        address _liquidator
    ) Ownable(initialOwner) {
        alterAdminRoles(
            _DataHub,
            _deposit_vault,
            oracle,
            _utility,
            _interest,
            _liquidator
        );
        Datahub = IDataHub(_DataHub);
        DepositVault = IDepositVault(_deposit_vault);
        Oracle = IOracle(oracle);
        Utilities = IUtilityContract(_utility);
        interestContract = IInterestData(_interest);
        OrderBookProviderWallet = msg.sender;
        DAO = msg.sender;
        Liquidator = _liquidator;
    }

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

    /// @notice Keeps track of contract admins
    mapping(address => bool) public admins;

    /// @notice Fetches the current orderbook provider wallet
    function fetchOrderBookProvider() public view returns (address) {
        return OrderBookProviderWallet;
    }

    /// @notice Fetches the current DAO wallet
    function fetchDaoWallet() public view returns (address) {
        return DAO;
    }

    /// @notice Sets a new Airnode Address
    function setAirnodeAddress(address airnode) public onlyOwner {
        airnodeAddress = airnode;
    }

    /// @notice Sets a new orderbook provider wallet
    function setOrderBookProvider(address _newwallet) public onlyOwner {
        OrderBookProviderWallet = _newwallet;
    }

    /// @notice Sets a new DAO wallet
    function setDaoWallet(address _dao) public onlyOwner {
        DAO = _dao;
    }

    /// @notice This is the function users need to submit an order to the exchange
    /// @dev It first goes through some validation by checking if the circuit breaker is on, or if the airnode address is the right one
    /// @dev It calculates the amount to add to their liabilities by fetching their current assets and seeing the difference between the trade amount and assets
    /// @dev it then checks that the trade will not exceed the max borrow proportion, and that the user can indeed take more margin
    /// @dev it then calls the oracle
    /// @param pair the pair of tokens being traded
    /// @param participants of the trade 2 nested arrays
    /// @param trade_amounts the trades amounts for each participant
    function SubmitOrder(
        address[2] memory pair,
        address[][2] memory participants,
        uint256[][2] memory trade_amounts,
        bool[][2] memory trade_side
    ) external {
        // console.log("========================submit order function==========================");
        require(DepositVault.viewcircuitBreakerStatus() == false);
        // require(airnode address == airnode address set on deployment )
        // (bool success, ) = payable(airnode_details[2]).call{value: msg.value}(
        //     ""
        //  );
        //  require(success);

        (uint256[] memory takerLiabilities, uint256[] memory makerLiabilities) = Utilities.calculateTradeLiabilityAddtions(pair, participants, trade_amounts);

        // console.log("taker liabilities", takerLiabilities[0]);
        // console.log("maker liabilities", makerLiabilities[0]);

        // this checks if the asset they are trying to trade isn't pass max borrow

        require(Utilities.validateTradeAmounts(trade_amounts), "Never 0 trades");
        require(
            Utilities.maxBorrowCheck(pair, participants, trade_amounts),
            "This trade puts the protocol above maximum borrow proportion and cannot be completed"
        );

        require(
            Utilities.processMargin(pair, participants, trade_amounts),
            "This trade failed the margin checks for one or more users"
        );

        Oracle.ProcessTrade(
            pair,
            participants,
            trade_amounts,
            takerLiabilities,
            makerLiabilities,
            trade_side
        );
    }

    /// @notice This called the execute trade functions on the particpants and checks if the assets are already in their portfolio
    /// @param pair the pair of assets involved in the trade
    /// @param takers the taker wallet addresses
    /// @param makers the maker wallet addresses
    /// @param taker_amounts the taker amounts in the trade
    /// @param maker_amounts the maker amounts in the trade
    /// @param TakerliabilityAmounts the new liabilities being issued to the takers
    /// @param MakerliabilityAmounts the new liabilities being issued to the makers
    function TransferBalances(
        address[2] memory pair,
        address[] memory takers,
        address[] memory makers,
        uint256[] memory taker_amounts,
        uint256[] memory maker_amounts,
        uint256[] memory TakerliabilityAmounts,
        uint256[] memory MakerliabilityAmounts,
        bool[][2] memory trade_side
    ) external checkRoleAuthority {

        require(DepositVault.viewcircuitBreakerStatus() == false);
        Datahub.checkIfAssetIsPresent(takers, pair[1]);
        Datahub.checkIfAssetIsPresent(takers, pair[0]);
        Datahub.checkIfAssetIsPresent(makers, pair[1]);
        Datahub.checkIfAssetIsPresent(makers, pair[0]);

        executeTrade(
            takers,
            trade_side[0],
            maker_amounts,
            taker_amounts,
            TakerliabilityAmounts,
            pair[0],
            pair[1]
        );

        executeTrade(
            makers,
            trade_side[1],
            taker_amounts,
            maker_amounts,
            MakerliabilityAmounts,
            pair[1],
            pair[0]
        );
    }

    /// @notice This is called to execute the trade
    /// @dev Read the code comments to follow along on the logic
    /// @param users the users involved in the trade
    /// @param amounts_in_token the amounts coming into the users wallets
    /// @param amounts_out_token the amounts coming out of the users wallets
    /// @param  liabilityAmounts new liabilities being issued
    /// @param  out_token the token leaving the users wallet
    /// @param  in_token the token coming into the users wallet
    function executeTrade(
        address[] memory users,
        bool[] memory trade_side,
        uint256[] memory amounts_in_token,
        uint256[] memory amounts_out_token,
        uint256[] memory liabilityAmounts,
        address out_token,
        address in_token
    ) private {
        // console.log("===========================executeTrade Function===========================");
        uint256 amountToAddToLiabilities;
        uint256 usersLiabilities;
        for (uint256 i = 0; i < users.length; i++) {
            amountToAddToLiabilities = liabilityAmounts[i];

            if (amountToAddToLiabilities != 0) {
                chargeinterest(users[i], out_token, amountToAddToLiabilities, false);

                IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(in_token);
            }
            
            usersLiabilities = Utilities.returnliabilities(users[i], in_token);
            if(usersLiabilities > 0) {
                uint256 interestCharge = interestContract.returnInterestCharge(
                    msg.sender,
                    in_token,
                    0
                );
                usersLiabilities = usersLiabilities + interestCharge;
            }            

            // console.log("amount in - liability", amounts_in_token[i], usersLiabilities);
            if ( amounts_in_token[i] <= usersLiabilities ) {
                // charge interest and subtract from their liabilities, do not add to assets just subtract from liabilities
                chargeinterest(users[i], in_token, amounts_in_token[i], true);

                // edit inital margin requirement, and maintenance margin requirement of the user
                // modifyMarginValues(users[i], in_token, out_token, amounts_in_token[i]);
            } else {
                // This will check to see if they are technically still margined and turn them off of margin status if they are eligable
                Datahub.changeMarginStatus(msg.sender);

                uint256 input_amount = amounts_in_token[i];

                if (msg.sender != address(Liquidator)) {
                    // below we charge trade fees it is not called if the msg.sender is the liquidator
                    uint256 tradeFeeForTaker = Datahub.tradeFee(in_token, 0);
                    uint256 tradeFeeForMaker = Datahub.tradeFee(in_token, 1);
                    if (!trade_side[i]) {} else {
                        divideFee(in_token, input_amount * (tradeFeeForTaker - tradeFeeForMaker) / 10 ** 18);
                        input_amount = input_amount - input_amount * tradeFeeForTaker / 10 ** 18;
                    }
                }

                if (usersLiabilities > 0) {
                    input_amount = input_amount - usersLiabilities;
                    chargeinterest(users[i], in_token, usersLiabilities, true);
                    // edit inital margin requirement, and maintenance margin requirement of the user
                    // modifyMarginValues(users[i], in_token, out_token, input_amount);
                }
                // remove their pending balances
                Datahub.removePendingBalances(users[i], out_token, amounts_out_token[i]);
                // add remaining amount not subtracted from liabilities to assets
                Datahub.addAssets(users[i], in_token, input_amount);
            }
        }
    }
    function divideFee(address token, uint256 amount) public {
        address daoWallet = fetchDaoWallet();
        address orderBookProvider = fetchOrderBookProvider();

        Datahub.addAssets(daoWallet, token, amount * 90 / 100);
        Datahub.addAssets(orderBookProvider, token, amount * 10 / 100);
    }

    /// @notice This will charge interest to a user if they are accuring new liabilities
    /// @param user the address of the user beign confirmed
    /// @param token the token being targetted
    /// @param liabilitiesAccrued the new liabilities being issued
    /// @param minus determines if we are adding to the liability pool or subtracting
    function chargeinterest(
        address user,
        address token,
        uint256 liabilitiesAccrued,
        bool minus
    ) public {
        //Step 1) charge mass interest on outstanding liabilities
        interestContract.chargeMassinterest(token);
        IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(token);
        if (!minus) {
            //Step 2) calculate the trade's liabilities + interest
            uint256 interestCharge = interestContract.returnInterestCharge(
                user,
                token,
                liabilitiesAccrued
            );
            // require(interestCharge + liabilitiesAccrued + assetLogs.assetInfo[1] <= assetLogs.assetInfo[2], "TBA should be smaller than LPS in ChargeInterest Minus");
            Datahub.addLiabilities(
                user,
                token,
                liabilitiesAccrued + interestCharge
            );
            Datahub.setAssetInfo(
                1, // 1 -> totalBorrowedAmount
                token,
                (liabilitiesAccrued + interestCharge),
                true
            );
            Datahub.alterUsersInterestRateIndex(user, token);
        } else {
            uint256 interestCharge = interestContract.returnInterestCharge(
                user,
                token,
                0
            );
            Datahub.addLiabilities(user, token, interestCharge);
            Datahub.removeLiabilities(user, token, liabilitiesAccrued);
            require(assetLogs.assetInfo[1] - liabilitiesAccrued + interestCharge <= assetLogs.assetInfo[2], "TBA should be smaller than LPS in ChargeInterest Plus");
            uint256 debtAmount;
            if( liabilitiesAccrued > interestCharge ) {
                debtAmount = liabilitiesAccrued - interestCharge;
            } else {
                debtAmount =  interestCharge - liabilitiesAccrued;
            }
            Datahub.setAssetInfo(1, token, debtAmount, false); // 1 -> totalBorrowedAmount
            Datahub.alterUsersInterestRateIndex(user, token);
        }
        IDataHub.AssetData memory finalAssetLogs = Datahub.returnAssetLogs(token);
        if(finalAssetLogs.assetInfo[1] > finalAssetLogs.assetInfo[2]) {
            Datahub.changeTotalBorrowedAmountOfAsset(token, finalAssetLogs.assetInfo[2]);
        }
    }

    function withdrawETH(address payable owner) external onlyOwner {
        uint contractBalance = address(this).balance;
        require(contractBalance > 0, "No balance to withdraw");
        payable(owner).transfer(contractBalance);
    }

    function withdrawERC20(
        address tokenAddress,
        address to
    ) external onlyOwner {
        // Ensure the tokenAddress is valid
        require(tokenAddress != address(0), "Invalid token address");
        // Ensure the recipient address is valid
        require(to != address(0), "Invalid recipient address");

        // Get the balance of the token held by the contract
        IERC20.IERC20 token = IERC20.IERC20(tokenAddress);
        uint256 contractBalance = token.balanceOf(address(this));

        // Ensure the contract has enough tokens to transfer
        require(contractBalance > 0, "Insufficient token balance");

        // Transfer the tokens
        require(token.transfer(to, contractBalance), "Token transfer failed");
    }

    receive() external payable {}
}
