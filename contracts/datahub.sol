// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol" as IERC20;
import "./interfaces/IInterestData.sol";
import "./interfaces/IDepositVault.sol";
import "hardhat/console.sol";

contract DataHub is Ownable {
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

    IInterestData public interestContract;
    IDepositVault public depositVault;

    /// @notice Keeps track of a users data
    /// @dev Go to IDatahub for more details
    mapping(address => UserData) public userdata;

    /// @notice Keeps track of an assets data
    /// @dev Go to IDatahub for more details
    mapping(address => AssetData) public assetdata;

    /// @notice Keeps track of contract admins
    mapping(address => bool) public admins;

    mapping(address => bool) public dao_role;

    address public DAO_WALLET;

    event LendingPoolDeposit(address indexed user, address indexed token, uint256 amount);
    event LendingPoolWithdrawal(address indexed user, address indexed token, uint256 amount);

    modifier checkRoleAuthority() {
        require(admins[msg.sender] == true, "Unauthorized");
        _;
    }
    constructor(
        address initialOwner,
        address _executor,
        address _deposit_vault,
        address _oracle,
        address _interest,
        address utils
    ) Ownable(initialOwner) {
        admins[_executor] = true;
        admins[_deposit_vault] = true;
        admins[_oracle] = true;
        admins[_interest] = true;
        admins[initialOwner] = true;
        admins[utils] = true;
        interestContract = IInterestData(_interest);
        depositVault = IDepositVault(_deposit_vault);
    }

    function viewUsersEarningRateIndex(address user, address token) public view returns (uint256) {
        return userdata[user].earningRateIndex[token] == 0 ? 1 : userdata[user].earningRateIndex[token];
    }

    /// @notice provides to the caller the users current rate epoch
    /// @dev This is to keep track of the last epoch the user paid at
    /// @param user the users address
    /// @param token the token being targetted
    function viewUsersInterestRateIndex(address user, address token) public view returns (uint256) {
        return userdata[user].interestRateIndex[token] == 0 ? 1 : userdata[user].interestRateIndex[token];
    }

    /// @notice This function returns the users tokens array ( the tokens in their portfolio)
    /// @param user the user being targetted
    function returnUsersAssetTokens(address user) external view returns (address[] memory) {
        return userdata[user].tokens;
    }

    /// @notice This returns the asset data of a given asset see Idatahub for more details on what it returns
    /// @param token the token being targetted
    /// @return returns the assets data
    function returnAssetLogs(address token) public view returns (AssetData memory) {
        // console.log("lending supply", assetdata[token].assetInfo[2], token);
        return assetdata[token];
    }

    // /// @notice This function returns the users tokens array ( the tokens in their portfolio)
    // /// @param user the user being targetted
    // function calculateIMR(address user, address token) external view returns (uint256) {
    //     uint256 liabilities = userdata[user].liability_info[token];
    //     return (assetdata[token].assetPrice * liabilities * assetdata[token].marginRequirement[0]) / 10 ** 36; // 0 -> InitialMarginRequirement
    // }

    // /// @notice This returns the asset data of a given asset see Idatahub for more details on what it returns
    // /// @param token the token being targetted
    // /// @return returns the assets data
    // function calculateMMR(address user, address token) public view returns (uint256) {
    //     uint256 liabilities = userdata[user].liability_info[token];
    //     return (assetdata[token].assetPrice * liabilities * assetdata[token].marginRequirement[1]) / 10 ** 36; // 0 -> MainternanceMarginRequirement
    // }
    
    /// @notice Returns a users data
    /// @param user being targetted
    /// @param token the users data of the token being queried
    /// @return a tuple containing their info of the token

    function ReadUserData(address user, address token) external view returns (uint256, uint256, uint256, bool, address[] memory, uint256)
    {
        uint256 assets = userdata[user].asset_info[token]; // tracks their portfolio (margined, and depositted)
        uint256 lending_pool_amount = userdata[user].lending_pool_info[token];
        uint256 liabilities = userdata[user].liability_info[token];
        uint256 pending = userdata[user].pending_balances[token];
        bool margined = userdata[user].margined;
        address[] memory tokens = userdata[user].tokens;
        return (assets, liabilities, pending, margined, tokens, lending_pool_amount);
    }

    /// @notice calculates the total dollar value of the users assets
    /// @param user the address of the user we want to query
    /// @return sumOfAssets the cumulative value of all their assets
    function calculateTotalAssetValue(address user) public view returns (uint256) {
        uint256 sumOfAssets;
        address token;
        for (uint256 i = 0; i < userdata[user].tokens.length; i++) {
            token = userdata[user].tokens[i];
            sumOfAssets += (assetdata[token].assetPrice * userdata[user].asset_info[token]) / 10 ** 18; // want to get like a whole normal number so balance and price correction
        }
        return sumOfAssets;
    }

    /// @notice calculates the total dollar value of the users liabilities
    /// @param user the address of the user we want to query
    /// @return sumOfliabilities the cumulative value of all their liabilities
    function calculateLiabilitiesValue(address user) public view returns (uint256) {
        uint256 sumOfliabilities;
        address token;
        for (uint256 i = 0; i < userdata[user].tokens.length; i++) {
            token = userdata[user].tokens[i];
            sumOfliabilities += (assetdata[token].assetPrice * userdata[user].liability_info[token]) / 10 ** 18; // want to get like a whole normal number so balance and price correction
        }
        return sumOfliabilities;
    }

    /// @notice calculates the total dollar value of the users portfolio
    /// @param user the address of the user we want to query
    /// @return returns their assets - liabilities value in dollars
    function calculateTotalPortfolioValue(address user) external view returns (uint256) {
        uint256 collateral = calculateTotalAssetValue(user);
        uint256 liabilities = calculateLiabilitiesValue(user);
        if(collateral <= liabilities) {
            return 0;
        }
        return collateral - liabilities;
    }

    function calculateTotalAssetCollateralAmount(address user) internal view returns (uint256) {
        uint256 sumOfAssets;
        address token;
        for (uint256 i = 0; i < userdata[user].tokens.length; i++) {
            token = userdata[user].tokens[i];
            sumOfAssets += (((assetdata[token].assetPrice * userdata[user].asset_info[token]) / 10 ** 18) * assetdata[token].collateralMultiplier) /
                10 ** 18; // want to get like a whole normal number so balance and price correction
        }
        return sumOfAssets;
    }

    /// @notice calculates the total dollar value of the users Collateral
    /// @param user the address of the user we want to query
    /// @return returns their assets - liabilities value in dollars
    function calculatePendingCollateralValue(address user) public view returns (uint256) {
        uint256 sumOfAssets;
        address token;
        for (uint256 i = 0; i < userdata[user].tokens.length; i++) {
            token = userdata[user].tokens[i];
            sumOfAssets +=
                (((assetdata[token].assetPrice * userdata[user].pending_balances[token]) / 10 ** 18) * assetdata[token].collateralMultiplier) / 10 ** 18; // want to get like a whole normal number so balance and price correction
        }
        return sumOfAssets;
    }

    function tradeFee(address token, uint256 feeType) public view returns (uint256) {
        return assetdata[token].tradeFees[feeType];
    }

    /// @notice calculates the total dollar value of the users Collateral
    /// @param user the address of the user we want to query
    /// @return returns their assets - liabilities value in dollars
    function calculateCollateralValue(address user) external view returns (uint256) {
        uint256 sumOfAssets;
        uint256 userLiabilities;
        sumOfAssets = calculateTotalAssetCollateralAmount(user);
        sumOfAssets += calculatePendingCollateralValue(user);
        userLiabilities = calculateLiabilitiesValue(user);
        if(sumOfAssets < userLiabilities) {
            return 0;
        }
        return sumOfAssets - userLiabilities;
    }

    /// @notice calculates the total dollar value of the users Aggregate initial margin requirement
    /// @param user the address of the user we want to query
    /// @return returns their AMMR
    function calculateAIMRForUser(address user) external view returns (uint256) {
        uint256 AIMR;
        address token;
        uint256 liabilities;
        for (uint256 i = 0; i < userdata[user].tokens.length; i++) {
                token = userdata[user].tokens[i];
                liabilities = userdata[user].liability_info[token];
                AIMR += (assetdata[token].assetPrice * liabilities * assetdata[token].marginRequirement[0]) / 10 ** 36; // 0 -> InitialMarginRequirement
            }
        return AIMR;
    }

    /// @notice calculates the total dollar value of the users Aggregate maintenance margin requirement
    /// @param user the address of the user we want to query
    /// @return returns their AMMR
    function calculateAMMRForUser(address user) external view returns (uint256) {
        uint256 AMMR;
        address token;
        uint256 liabilities;
        for (uint256 i = 0; i < userdata[user].tokens.length; i++) {
            token = userdata[user].tokens[i];
            liabilities = userdata[user].liability_info[token];
            AMMR += (assetdata[token].assetPrice * liabilities * assetdata[token].marginRequirement[1]) / 10 ** 36; // 1 -> MainternanceMarginRequirement
        }
        return AMMR;
    }
    function alterAdminRoles(
        address _deposit_vault,
        address _executor,
        address _oracle,
        address _interest,
        address _utils,
        address _liquidator
    ) public onlyOwner {
        delete admins[_executor];
        admins[_executor] = true;
        delete admins[_deposit_vault];
        admins[_deposit_vault] = true;
         delete admins[_oracle];
        admins[_oracle] = true;
         delete admins[_interest];
        admins[_interest] = true;
         delete admins[_utils];
        admins[_utils] = true;
        interestContract = IInterestData(_interest);
        admins[_liquidator] = true;
        depositVault = IDepositVault(_deposit_vault);
    }

    /// @notice Sets a new Admin role
    function setAdminRole(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    /// @notice Revokes the Admin role of the contract
    function revokeAdminRole(address _admin) external onlyOwner {
        admins[_admin] = false;
    }

    /// @notice Sets a new DAO wallet
    function setDaoWallet(address _dao) public onlyOwner {
        DAO_WALLET = _dao;
    }
    function setDaoRole(address _wallet, bool _flag) public {
        require(DAO_WALLET == msg.sender, "Only dao wallet can set the role!");
        dao_role[_wallet] = _flag;
    }

    function getTotalExchangeSupply(address token) public view returns(uint256) {
        return assetdata[token].assetInfo[0] + assetdata[token].assetInfo[1];
    }

    /// @notice Alters the users interest rate index (or epoch)
    /// @dev This is to change the users rate epoch, it would be changed after they pay interest.
    /// @param user the users address
    /// @param token the token being targetted
    function alterUsersInterestRateIndex(address user, address token) external checkRoleAuthority {
        userdata[user].interestRateIndex[token] = interestContract.fetchCurrentRateIndex(token); // updates to be the current rate index..... 1+
    }   

    function alterUsersEarningRateIndex(address user, address token) external checkRoleAuthority {
        // console.log("alterUserEarningRateIndex function");
        // console.log(
        //     "current rate index",
        //     interestContract.fetchCurrentRateIndex(token)
        // );
        userdata[user].earningRateIndex[token] = interestContract.fetchCurrentRateIndex(token);
    }

    /// @notice calculates the total dollar value of the users lending pool assets
    /// @param user the address of the user we want to query
    /// @return sumOfAssets the cumulative value of all their assets
    function CalculateUsersTotalLendingPoolAssetValue(address user) public view returns (uint256) {
        uint256 sumOfAssets;
        address token;
        for (uint256 i = 0; i < userdata[user].tokens.length; i++) {
            token = userdata[user].tokens[i];
            sumOfAssets += (assetdata[token].assetPrice * userdata[user].lending_pool_info[token]) / 10 ** 18; // want to get like a whole normal number so balance and price correction
        }
        return sumOfAssets;
    }

    /// @notice Alters lending pool asset
    /// @dev This is to change the users rate epoch, it would be changed after they pay interest.
    /// @param token the token being targetted
    function alterLendingPool(address token, uint256 amount, bool direction) public {
        address _sender = msg.sender;

        if(direction) { // deposit
            // lending pool supply
            require(amount <= assetdata[token].assetInfo[0], "this amount cannot be deposited into the lending pool cause of overflow"); // 0 -> totalSupply
            require(userdata[_sender].asset_info[token] >= amount, "Insufficient funds");
            
            depositVault.withdraw_process(_sender, token, amount);
            
            userdata[_sender].lending_pool_info[token] = userdata[_sender].lending_pool_info[token] + amount;
            assetdata[token].assetInfo[2] = assetdata[token].assetInfo[2] + amount; // 2 -> lending pool supply
            
            emit LendingPoolDeposit(_sender, token, amount);
            
        } else { // withdraw
            require(userdata[_sender].lending_pool_info[token] >= amount, "this amount cannot be withdrawn into cause of underflow");
            require(assetdata[token].assetInfo[2] >= amount, "this amount cannot be withdrawn into the lending pool"); // 1 -> totalBorrowedAmount

            depositVault.deposit_process(_sender, token, amount);

            userdata[_sender].lending_pool_info[token] = userdata[_sender].lending_pool_info[token] - amount;
            assetdata[token].assetInfo[2] = assetdata[token].assetInfo[2] - amount; // 2 -> lending pool supply

            emit LendingPoolWithdrawal(_sender, token, amount);
        }
    }

    function alterUserNegativeValue(address user) external checkRoleAuthority {
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
    
    /// @notice Alters a users liabilities
    /// @param user being targetted
    /// @param token being targetted
    /// @param amount to alter liabilities by
    function alterLiabilities(address user, address token, uint256 amount
    ) external checkRoleAuthority {
        userdata[user].liability_info[token] =
            (userdata[user].liability_info[token] * amount) /
            (10 ** 18);
    }

    /// @notice This adds to the users assets
    /// @dev this function is to add to the users assets of a token
    /// @param user the users address
    /// @param token the token being targetted
    /// @param amount the amount to be added to their balance
    function addAssets(address user, address token, uint256 amount) external checkRoleAuthority {
        // console.log("user - token - amount", user, token, amount);
        userdata[user].asset_info[token] += amount;
        // console.log("user amount", userdata[user].asset_info[token]);
    }

    /// @notice This removes balance from the users assets
    /// @dev this function is to remove assets from the users assets of a token
    /// @param user the users address
    /// @param token the token being targetted
    /// @param amount the amount to be removed to their balance
    function removeAssets(address user, address token, uint256 amount) public checkRoleAuthority {
        userdata[user].asset_info[token] -= amount;
    }

    function changeTotalBorrowedAmountOfAsset(address token, uint256 _updated_value) external {
        require((admins[msg.sender] == true) || (dao_role[msg.sender] == true), "Unauthorized");
        assetdata[token].assetInfo[1] = _updated_value; //  totalBorrowedAmount
    }

    /// @notice Adds to a users liabilities
    /// @param user being targetted
    /// @param token being targetted
    /// @param amount to alter liabilities by
    function addLiabilities(address user, address token, uint256 amount) external checkRoleAuthority {
        // console.log("amount", amount);
        userdata[user].liability_info[token] += amount;
    }

    /// @notice removes a users liabilities
    /// @param user being targetted
    /// @param token being targetted
    /// @param amount to alter liabilities by
    function removeLiabilities(address user, address token, uint256 amount) external checkRoleAuthority {
        userdata[user].liability_info[token] -= amount;
    }

    /// @notice This sets the users margin status
    /// @dev if the user does a margined trade we want to record them on the contract as having margin already
    /// @param user user address being targetted
    /// @param onOrOff this determines whether they are being turned as having margin or not
    function SetMarginStatus(address user, bool onOrOff) external checkRoleAuthority {
        userdata[user].margined = onOrOff;
    }

    /// @notice This adds a pending balance for the user on a token they are trading
    /// @dev We do this because when the oracle is called there is a gap in time where the user should not have assets because the trade is not finalized
    /// @param user being targetted
    /// @param token being targetted
    /// @param amount to add to pending balances
    function addPendingBalances(address user, address token, uint256 amount) external checkRoleAuthority {
        // check that we are not removing  balance twice 
        uint256 pendingamount;
        uint256 assets =  userdata[user].asset_info[token];

        if (amount > assets ){
            pendingamount = assets;
        }
        else{ 
            pendingamount = amount;
        }
        // cant have negative balance for the user 
        userdata[user].pending_balances[token] += pendingamount;
        // subracts from assest
        removeAssets(user , token , pendingamount);
    }
    /// @notice This removes a pending balance for the user on a token they are trading
    /// @dev We do this when the trade is cleared by the oracle and the trade is executed.
    /// @param user being targetted
    /// @param token being targetted
    /// @param amount to remove from pending balances
    function removePendingBalances(address user, address token, uint256 amount) external checkRoleAuthority {
    uint256 pendingBalances = userdata[user].pending_balances[token];
    uint256 amountToRemove = amount >  pendingBalances ? pendingBalances : amount ;
       userdata[user].pending_balances[token] -= amountToRemove;
    }

    /// @notice This checks the users margin status and if they should be in that status state, and changes it if they should not be
    /// @param user the user being targetted
    /// @param token the token being traded or targetted
    /// @param BalanceToLeave the balance leaving their account
    function checkMarginStatus(
        address user,
        address token,
        uint256 BalanceToLeave
    ) external checkRoleAuthority {
        uint256 AssetBalance = userdata[user].asset_info[token];
        //  - userdata[user].pending_balances[token];
        if (userdata[user].margined == false) {
            if (AssetBalance < BalanceToLeave) {
                userdata[user].margined = true;
            }
            return;
        }
        return;
    }

    /// @notice This changes the users margin status
    /// @dev if they don't have any margined positions this should turn them into a "spot" user
    /// @param user the user being targetted
    function changeMarginStatus(address user) external checkRoleAuthority returns (bool) {
        bool isMargined = false;
        for (uint256 j = 0; j < userdata[user].tokens.length; j++) {
            if (userdata[user].liability_info[userdata[user].tokens[j]] > 0) {
                // Token found in the array
                isMargined = true;
                break;
            }
        }

        userdata[user].margined = isMargined;
        return isMargined;
    }

    /// -----------------------------------------------------------------------
    /// Portfolio make-up  --> when a user has assets they are added to an array these function return or change that array
    /// -----------------------------------------------------------------------

    /// @notice This function removes an asset from a users portfolio
    /// @dev it removes a token address from their tokens[] array in user data so it doesnt touch their assets this is called after they have no assets or liabiltiies of the token
    /// @param user the user being targetted
    /// @param tokenToRemove the token to remove from the portfolio
    function removeAssetToken(address user, address tokenToRemove) external checkRoleAuthority {
        UserData storage userData = userdata[user];
        address token;
        for (uint256 i = 0; i < userData.tokens.length; i++) {
            token = userData.tokens[i];
            if (token == tokenToRemove) {
                userData.tokens[i] = userData.tokens[
                    userData.tokens.length - 1
                ];
                userData.tokens.pop();
                break; // Exit the loop once the token is found and removed
            }
        }
    }

    /// @notice This function rchecks if a token is present in a users potrfolio
    /// @param users the users being targetted
    /// @param token being targetted
    function checkIfAssetIsPresent(address[] memory users, address token) external checkRoleAuthority returns (bool) {
        bool tokenFound = false;
        address user;

        for (uint256 i = 0; i < users.length; i++) {
            user = users[i];

            for (uint256 j = 0; j < userdata[user].tokens.length; j++) {
                // console.log(userdata[user].tokens[j]);
                if (userdata[user].tokens[j] == token) {
                    // Token found in the array
                    tokenFound = true;
                    break; // Exit the inner loop as soon as the token is found
                }
            }
            // console.log("tokenFound", tokenFound);
            // console.log("user", user, token);
            if (!tokenFound) {
                // Token not found for the current user, add it to the array
                userdata[user].tokens.push(token);
            }
        }

        // Return true if the token is found for at least one user
        return tokenFound;
    }
    function setAssetInfo(
        uint8 id,
        address token,
        uint256 amount,
        bool pos_neg
    ) external checkRoleAuthority {
        if (pos_neg == true) {
            assetdata[token].assetInfo[id] += amount; // 0 -> totalSupply, 1 -> totalBorrowedAmount
        } else {
            if( assetdata[token].assetInfo[id] < amount) {
                assetdata[token].assetInfo[id] = 0; // 0 -> totalSupply, 1 -> totalBorrowedAmount
            } else {
                assetdata[token].assetInfo[id] -= amount; // 0 -> totalSupply, 1 -> totalBorrowedAmount
            }
        }
    }

    /// @notice This returns the asset data of a given asset see Idatahub for more details on what it returns
    /// @param token the token being targetted
    /// @param assetPrice the starting asset price of the token
    /// @param collateralMultiplier the collateral multipler for margin trading
    /// @param tradeFees the trade fees they pay while trading
    /// @param _marginRequirement 0 -> InitialMarginRequirement 1 -> MaintenanceMarginRequirement
    /// @param _borrowPosition 0 -> OptimalBorrowProportion 1 -> MaximumBorrowProportion
    /// @param _feeInfo // 0 -> initialMarginFee, 1 -> liquidationFee
    function InitTokenMarket(
        address token,
        uint256 assetPrice,
        uint256 collateralMultiplier,
        uint256[2] memory tradeFees,
        uint256[2] memory _marginRequirement,
        uint256[2] memory _borrowPosition,
        uint256[2] memory _feeInfo
    ) external onlyOwner {
        require(!assetdata[token].initialized, "token has to be not already initialized");
        require(_feeInfo[1] < _marginRequirement[1], "liq must be smaller than mmr");
        require(tradeFees[0] >= tradeFees[1], "taker fee must be bigger than maker fee");
        
        uint256[3] memory _assetInfo;

        assetdata[token] = AssetData({
            initialized: true,
            tradeFees: tradeFees,
            collateralMultiplier: collateralMultiplier,
            assetPrice: assetPrice,
            feeInfo: _feeInfo,
            marginRequirement: _marginRequirement,
            assetInfo: _assetInfo,
            borrowPosition: _borrowPosition,
            totalDepositors: 0           
        });
    }

    /// @notice Changes the assets price
    /// @param token the token being targetted
    /// @param value the new price
    function toggleAssetPrice(address token, uint256 value) external checkRoleAuthority {
        assetdata[token].assetPrice = value;
    }
    function withdrawETH(address payable owner) external onlyOwner {
        uint contractBalance = address(this).balance;
        require(contractBalance > 0, "No balance to withdraw");
        payable(owner).transfer(contractBalance);
    }

    function withdrawERC20(address tokenAddress, address to) external onlyOwner {
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
