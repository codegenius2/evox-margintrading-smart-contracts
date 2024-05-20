// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./interfaces/IDataHub.sol";
import "./interfaces/IDepositVault.sol";
import "./interfaces/IExecutor.sol";
import "@api3/airnode-protocol/contracts/rrp/requesters/RrpRequesterV0.sol";

contract Oracle is Ownable2Step, RrpRequesterV0 {
    /// @notice Keeps track of contract admins
    mapping(address => bool) public admins;

    IDataHub public Datahub;
    IExecutor public Executor;
    IDepositVault public DepositVault;

    uint256 public lastOracleFufillTime; // 10 min ago 

    bytes32 public lastRequestId;

    error Error_FufillUnSuccessful(bytes32 requestid, uint256 timeStamp);

    /** Constructor  */
    constructor(
        address initialOwner,
        address _DataHub,
        address _deposit_vault,
        address airnodeRrpAddress,
        address _executor
    ) Ownable(initialOwner) RrpRequesterV0(airnodeRrpAddress) {
        Datahub = IDataHub(_DataHub);
        DepositVault = IDepositVault(_deposit_vault);
        Executor = IExecutor(_executor);
    }

    function alterAdminRoles(
        address _ex,
        address _DataHub,
        address _deposit_vault
    ) external onlyOwner {
        admins[address(Executor)] = false;
        admins[_ex] = true;
        Datahub = IDataHub(_DataHub);
        DepositVault = IDepositVault(_deposit_vault);
        Executor = IExecutor(_ex);
    }

    function setAdminRole(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    /** Mapping's  */
    mapping(bytes32 => uint256) requestTime;
    mapping(bytes32 => bool) public incomingFulfillments;
    mapping(bytes32 => int256) public fulfilledData;

    modifier checkRoleAuthority() {
        require(admins[msg.sender] == true, "Unauthorized");
        _;
    }

    /** Struct's  */
    struct Order {
        address taker_token;
        address maker_token;
        address[] takers;
        address[] makers;
        uint256[] taker_amounts;
        uint256[] maker_amounts;
        bool[][2] trade_sides;
        uint256[] takerliabilityAmounts;
        uint256[] makerliabilityAmounts;
        string _id;
    }

    mapping(bytes32 => Order) public OrderDetails;

    /** event's  */
    event QueryCalled(string description, uint256 timestamp, bytes32 requestId);
    event TradeExecuted(uint256 blocktimestamp);

    event TradeReverted(
        bytes32 requestId,
        address taker_token,
        address maker_token,
        address[] takers,
        address[] makers,
        uint256[] taker_amounts,
        uint256[] maker_amounts
    );


    /// @notice Checks the Airnodes status, see dev notes for a link to the contract to see its return values
    /// @dev https://cardona-zkevm.polygonscan.com/address/0x9499a917cf8ca139c0e06f9728e1c6a0f7a1f5f2#code ( Line 1078 )
    /// @param requestId query lastRequestId on the contract and see if the last order was a success
    /// @return if the order queried returned success, fail, or null  --> if this returns true trades are open, if this returns false trading is closed.
    function checkAirnodeStatus(bytes32 requestId) public view returns (bool) {
        return airnodeRrp.requestIsAwaitingFulfillment(requestId);
    }

    function ProcessTrade(
        address[2] memory pair,
        address[][2] memory participants,
        uint256[][2] memory trade_amounts,
        bool[][2] memory trade_side,
        uint256[] memory TakerliabilityAmounts,
        uint256[] memory MakerliabilityAmounts,
        address[3] memory airnode_details,
        bytes32 endpointId,
        bytes calldata parameters
    ) external checkRoleAuthority {
        freezeTempBalance(pair, participants, trade_amounts, trade_side); //, trade_side

        bytes32 orderId = makeRequest(
            airnode_details[0],
            endpointId,
            airnode_details[1],
            airnode_details[2],
            parameters
        );

        OrderDetails[orderId].taker_token = pair[0];
        OrderDetails[orderId].maker_token = pair[1];
        OrderDetails[orderId].taker_amounts = trade_amounts[0];
        OrderDetails[orderId].maker_amounts = trade_amounts[1];
        OrderDetails[orderId].trade_sides = trade_side;

        OrderDetails[orderId].takers = participants[0];
        OrderDetails[orderId].makers = participants[1];
        OrderDetails[orderId].takerliabilityAmounts = TakerliabilityAmounts;
        OrderDetails[orderId].makerliabilityAmounts = MakerliabilityAmounts;

        emit QueryCalled("Query sent,", block.timestamp, orderId);
    }

    function makeRequest(
        address airnode,
        bytes32 endpointId,
        address sponsor,
        address sponsorWallet,
        bytes calldata parameters
    ) internal returns (bytes32) {
        bytes32 requestId = airnodeRrp.makeFullRequest(
            airnode, // airnode address
            endpointId, // endpointId
            sponsor, // sponsor's address
            sponsorWallet, // sponsorWallet
            address(this), // fulfillAddress
            this.fulfill.selector, // fulfillFunctionId
            parameters // encoded API parameters
        );
        incomingFulfillments[requestId] = true;
        requestTime[requestId] = block.timestamp;
        lastRequestId = requestId;

        return requestId;
    }
    // wakaki please check the fucntion that you are calling in BE.      
    function revertTrade(bytes32 requestId) external {
        if (
            incomingFulfillments[requestId] =
                true &&
                requestTime[requestId] + 1 hours > block.timestamp
        ) {
            delete incomingFulfillments[requestId];

            address[2] memory pair;
            pair[0] = OrderDetails[requestId].taker_token;
            pair[1] = OrderDetails[requestId].maker_token;

            revertTrade(
                pair,
                OrderDetails[requestId].takers,
                OrderDetails[requestId].makers,
                OrderDetails[requestId].taker_amounts,
                OrderDetails[requestId].maker_amounts
            );

            emit TradeReverted(
                requestId,
                pair[0],
                pair[1],
                OrderDetails[requestId].takers,
                OrderDetails[requestId].makers,
                OrderDetails[requestId].taker_amounts,
                OrderDetails[requestId].maker_amounts
            );
        }
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
            (uint256 assets, , , , ) = Datahub.ReadUserData(
                participants[i],
                pair
            );
            if (tradeside[i]) {} else {
                uint256 _tradeFee = Datahub.tradeFee(pair, 1);
                tradeAmounts[i] = (tradeAmounts[i] * _tradeFee) / 10 ** 18;
            }
            uint256 balanceToAdd = tradeAmounts[i] > assets
                ? assets
                : tradeAmounts[i];
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
        // Datahub.removeAssets(participant, asset, trade_amount);
        Datahub.addPendingBalances(participant, asset, trade_amount);
    }

    /// The AirnodeRrpV0.sol protocol contract will callback here.
    function fulfill(
        bytes32 requestId,
        bytes calldata data
    ) external onlyAirnodeRrp {
        require(incomingFulfillments[requestId], "No such request made");
        delete incomingFulfillments[requestId];
        lastOracleFufillTime = block.timestamp;
        int256 decodedData = abi.decode(data, (int256));
        fulfilledData[requestId] = decodedData;
        address[2] memory pair;
        pair[0] = OrderDetails[requestId].taker_token;
        pair[1] = OrderDetails[requestId].maker_token;

        if (decodedData != 1) {
            // executing revert trade if airnode responses with not 1  
             revertTrade(
                pair,
                OrderDetails[requestId].takers,
                OrderDetails[requestId].makers,
                OrderDetails[requestId].taker_amounts,
                OrderDetails[requestId].maker_amounts
            );
            revert Error_FufillUnSuccessful(requestId, block.timestamp); //
        } else {
       
            Executor.TransferBalances(
                pair,
                OrderDetails[requestId].takers,
                OrderDetails[requestId].makers,
                OrderDetails[requestId].taker_amounts,
                OrderDetails[requestId].maker_amounts,
                OrderDetails[requestId].takerliabilityAmounts,
                OrderDetails[requestId].makerliabilityAmounts,
                OrderDetails[requestId].trade_sides
            );

            if (pair[0] == DepositVault._USDT()) {
                uint256 decimals = DepositVault.fetchDecimals(pair[1]);
                Datahub.toggleAssetPrice(
                    pair[1],
                    ((OrderDetails[requestId].taker_amounts[
                        OrderDetails[requestId].taker_amounts.length - 1
                    ] * (10 ** decimals)) /
                        OrderDetails[requestId].maker_amounts[
                            OrderDetails[requestId].maker_amounts.length - 1
                        ])
                );
            } else {
                uint256 decimals = DepositVault.fetchDecimals(pair[0]);
                Datahub.toggleAssetPrice(
                    pair[0],
                    ((OrderDetails[requestId].maker_amounts[
                        OrderDetails[requestId].maker_amounts.length - 1
                    ] * (10 ** decimals)) /
                        OrderDetails[requestId].taker_amounts[
                            OrderDetails[requestId].taker_amounts.length - 1
                        ])
                );
            }
        }
    }

    function revertTrade(
        address[2] memory pair,
        address[] memory takers,
        address[] memory makers,
        uint256[] memory taker_amounts,
        uint256[] memory maker_amounts
    ) private {
        uint256 balanceToAdd;
        uint256 MakerbalanceToAdd;
       
        for (uint256 i = 0; i < takers.length; i++) {
            // (uint256 assets, , , , ) = Datahub.ReadUserData(takers[i], pair[0]);
            (, , uint256 pending, , ) = Datahub.ReadUserData(takers[i], pair[0]);
            balanceToAdd = taker_amounts[i] > pending
                ? pending
                : taker_amounts[i];

            Datahub.addAssets(takers[i], pair[0], balanceToAdd);
            Datahub.removePendingBalances(takers[i], pair[0], balanceToAdd);
        }

        for (uint256 i = 0; i < makers.length; i++) {
            // (uint256 assets, , , , ) = Datahub.ReadUserData(makers[i], pair[1]);
            (, , uint256 pending, , ) = Datahub.ReadUserData(makers[i], pair[1]);
            MakerbalanceToAdd = maker_amounts[i] > pending
                ? pending
                : maker_amounts[i];

            Datahub.addAssets(makers[i], pair[1], MakerbalanceToAdd);
            Datahub.removePendingBalances(
                makers[i],
                pair[1],
                MakerbalanceToAdd
            );
        }
    }

    function withdrawAll(address payable owner) external onlyOwner {
        uint contractBalance = address(this).balance;
        require(contractBalance > 0, "No balance to withdraw");
        payable(owner).transfer(contractBalance);

    }

    receive() external payable {}
}
