// SPDX-License-Identifier: MIT
pragma solidity =0.8.20;

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol" as ERC20;
import "@openzeppelin/contracts/interfaces/IERC20.sol" as IERC20;
import "./libraries/EVO_LIBRARY.sol";
import "./interfaces/IExecutor.sol";
import "./interfaces/IInterestData.sol";
import "./interfaces/IUtilityContract.sol";
import "hardhat/console.sol";

contract DepositVault is Ownable {

    address public USDT = address(0xaBAD60e4e01547E2975a96426399a5a0578223Cb);
    
    constructor(
        address initialOwner,
        address dataHub,
        address executor,
        address interest,
        address _utility,
        address _usdt
    ) Ownable(initialOwner) {
        Datahub = IDataHub(dataHub);
        Executor = IExecutor(executor);
        interestContract = IInterestData(interest);
        utility = IUtilityContract(_utility);
        admins[address(this)]= true; 
        USDT = address(_usdt);
    }

    mapping(address => bool) public admins;

    function alterAdminRoles(
        address dataHub,
        address executor,
        address interest,
        address _utility
    ) public onlyOwner {

        admins[address(Datahub)]= false; 
        admins[dataHub] = true;
        Datahub = IDataHub(dataHub);

        admins[address(Executor)] = false;
        admins[executor] = true;
        Executor = IExecutor(executor);

        admins[address(interestContract)] = false;
        admins[interest] = true;
        interestContract = IInterestData(interest);

        admins[address(utility)] = false;
        admins[_utility] = true;
        utility = IUtilityContract(_utility);
    }

    IDataHub public Datahub;
    IExecutor public Executor;
    IInterestData public interestContract;
    IUtilityContract public utility;

    /// @notice checks the role authority of the caller to see if they can change the state
    modifier checkRoleAuthority() {
        require(admins[msg.sender] == true, "Unauthorized");
        _;
    }

    // using EVO_LIBRARY for uint256;

    uint256 public WithdrawThresholdValue = 1000000 * 10 ** 18;

    mapping(address => bool) public userInitialized;
    mapping(uint256 => address) public userId;

    mapping(address => uint256) public token_withdraws_hour;
    uint256 lastWithdrawUpdateTime = block.timestamp;

    event hazard(uint256, uint256);

    error DangerousWithdraw();

    bool circuitBreakerStatus = false;

    uint256 public lastUpdateTime;

    /// @notice Sets a new Admin role
    function setAdminRole(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    /// @notice Revokes the Admin role of the contract
    function revokeAdminRole(address _admin) external onlyOwner {
        admins[_admin] = false;
    }

    function toggleCircuitBreaker(bool onOff) public onlyOwner {
        circuitBreakerStatus = onOff;
    }

    function viewcircuitBreakerStatus() external view returns (bool) {
        return circuitBreakerStatus;
    }

    // address public USDT = address(0xaBAD60e4e01547E2975a96426399a5a0578223Cb);

    function _USDT() external view returns (address) {
        return USDT;
    }

    function setUSDT(address input) external onlyOwner {
        USDT = address(input);
    }

    /// @notice fetches and returns a tokens decimals
    /// @param token the token you want the decimals for
    /// @return Token.decimals() the token decimals

    function fetchDecimals(address token) public view returns (uint256) {
        ERC20.ERC20 Token = ERC20.ERC20(token);
        return Token.decimals();
    }

    /// @notice This function checks if this user has been initilized
    /// @dev Explain to a developer any extra details
    /// @param user the user you want to fetch their status for
    /// @return bool if they are initilized or not
    function fetchstatus(address user) external view returns (bool) {
        if (userInitialized[user] == true) {
            return true;
        } else {
            return false;
        }
    }

    function alterWithdrawThresholdValue(
        uint256 _updatedThreshold
    ) public onlyOwner {
        WithdrawThresholdValue = _updatedThreshold;
    }

    function getTotalAssetSupplyValue(
        address token
    ) public view returns (uint256) {
        IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(token);

        uint256 totalValue = (assetLogs.assetPrice * assetLogs.assetInfo[0]) / 10 ** 18; // 0 -> totalSupply

        return totalValue;
    }

    /* DEPOSIT FUNCTION */
    /// @notice This deposits tokens and inits the user struct, and asset struct if new assets.
    /// @dev Explain to a developer any extra details
    /// @param token - the address of the token to be depositted
    /// @param amount - the amount of tokens to be depositted

    function deposit_token(
        address token,
        uint256 amount
    ) external returns (bool) {
        uint256 amount = deposit_token_transfer(msg.sender, token, amount);
        return deposit_token_process(msg.sender, token, amount);
    }

    function deposit_token_process(
        address user,
        address token,
        uint256 amount
    ) internal returns (bool) {
        require(Datahub.returnAssetLogs(token).initialized == true, "this asset is not available to be deposited or traded");
        require(!circuitBreakerStatus, "circuit breaker active");
        Datahub.setAssetInfo(0, token, amount, true); // 0 -> totalSupply

        interestContract.chargeMassinterest(token);

        (uint256 assets, uint256 liabilities, , , ,) = Datahub.ReadUserData(user, token);

        if(assets > 0) {
            uint256 earningRate = utility.returnEarningProfit(user, token);
            Datahub.addAssets(user, token, earningRate);
            // Datahub.setAssetInfo(0, token, earningRate, true);
            Datahub.alterUsersEarningRateIndex(user, token);
        }

        // checks to see if user is in the sytem and inits their struct if not
        if (liabilities > 0) {
            uint256 interestCharge = interestContract.returnInterestCharge(user, token, 0);
            
            if (amount <= liabilities + interestCharge) {
                Executor.chargeinterest(user, token, amount, true);
                
                return true;
            } else {
                Datahub.addAssets(user, token, amount - liabilities - interestCharge); // add to assets

                Datahub.removeLiabilities(user, token, liabilities); // remove all liabilities

                Datahub.setAssetInfo(1, token, liabilities, false); // 1 -> totalBorrowedAmount

                Datahub.changeMarginStatus(user);

                Datahub.alterUsersInterestRateIndex(user, token);
                return true;
            }
        } else {
            address[] memory users = new address[](1);
            users[0] = user;

            Datahub.checkIfAssetIsPresent(users, token);
            Datahub.addAssets(user, token, amount);

            Datahub.alterUsersInterestRateIndex(user, token);

            return true;
        }
    }

    function deposit_process(
        address user,
        address token,
        uint256 amount
    ) public checkRoleAuthority returns (bool) {
        deposit_token_process(user, token, amount);
    }


    function deposit_token_transfer(
        address user,
        address token,
        uint256 amount
    ) internal returns (uint256) {
        uint256 decimals = fetchDecimals(token);
        amount = amount * (10 ** decimals) / (10 ** 18);

        //chechking balance for contract before the token transfer 
        uint256 contractBalanceBefore = IERC20.IERC20(token).balanceOf(address(this));
        // transfering the tokens to contract
        require(IERC20.IERC20(token).transferFrom(user, address(this), amount));
        //checking the balance for the contract after the token transfer 
        uint256 contractBalanceAfter = IERC20.IERC20(token).balanceOf(address(this));
        // exactAmountTransfered is the exact value being transfer in contract
        uint256 exactAmountTransfered = contractBalanceAfter - contractBalanceBefore;
        exactAmountTransfered = exactAmountTransfered * (10 ** 18) / (10 ** decimals);
        return exactAmountTransfered;
    }

    /* WITHDRAW FUNCTION */

    /// @notice This withdraws tokens from the exchange
    /// @dev Explain to a developer any extra details
    /// @param token - the address of the token to be withdrawn
    /// @param amount - the amount of tokens to be withdrawn

    // IMPORTANT MAKE SURE USERS CAN'T WITHDRAW PAST THE LIMIT SET FOR AMOUNT OF FUNDS BORROWED
    function withdraw_token(address token, uint256 amount) external {
        withdraw_token_process(msg.sender, token, amount);
        withdraw_token_transfer(msg.sender, token, amount);
    }

    function withdraw_process(
        address user,
        address token,
        uint256 amount
    ) public checkRoleAuthority returns (bool) {
        withdraw_token_process(user, token, amount);
    }

    function withdraw_token_process(address user, address token, uint256 amount) internal {
        require(!circuitBreakerStatus);
        require(Datahub.returnAssetLogs(token).initialized == true, "this asset is not available to be deposited or traded");
        
        interestContract.chargeMassinterest(token);
        
        (uint256 assets, uint256 liabilities, uint256 pending, , ,) = Datahub.ReadUserData(user, token);
        
        uint256 earningRate = utility.returnEarningProfit(user, token);
        Datahub.addAssets(user, token, earningRate);
        // Datahub.setAssetInfo(0, token, earningRate, true);
        
        require(pending == 0, "You must have a 0 pending trade balance to withdraw, please wait for your trade to settle before attempting to withdraw");
        require(amount <= assets + earningRate, "You cannot withdraw more than your asset balance");

        Datahub.removeAssets(user, token, amount);
        Datahub.setAssetInfo(0, token, amount, false); // 0 -> totalSupply
        Datahub.alterUsersEarningRateIndex(user, token);

        if (liabilities > 0) {
            uint256 interestCharge = interestContract.returnInterestCharge(user, token, 0);
            Datahub.addLiabilities(user, token, interestCharge);
            Datahub.setAssetInfo(1, token, interestCharge, true); // 0 -> totalSupply
        }

        Datahub.alterUsersInterestRateIndex(user, token);

        uint256 usersAIMR = Datahub.calculateAIMRForUser(user);
        uint256 usersTCV = Datahub.calculateCollateralValue(user);

        require(usersAIMR < usersTCV, "Cannot withdraw");
    }

    function withdraw_token_transfer(address user, address token, uint256 amount) internal {
        IERC20.IERC20 ERC20Token = IERC20.IERC20(token);
        uint256 decimals = fetchDecimals(token);
        uint256 exactAmountToWithdraw = amount * (10 ** decimals) / (10 ** 18);
        ERC20Token.transfer(user, exactAmountToWithdraw);
    }

    /* DEPOSIT FOR FUNCTION */
    function deposit_token_for(
        address beneficiary,
        address token,
        uint256 amount
    ) external returns (bool) {
        require(
            Datahub.returnAssetLogs(token).initialized == true,
            "this asset is not available to be deposited or traded"
        );
    
        IERC20.IERC20 ERC20Token = IERC20.IERC20(token);
        //chechking balance for contract before the token transfer 
        uint256 contractBalanceBefore = ERC20Token.balanceOf(address(this));
        // transfering the tokens to contract
        uint256 decimals = fetchDecimals(token);
        amount = amount * (10 ** decimals) / (10 ** 18);
        require(ERC20Token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        //checking the balance for the contract after the token transfer 
        uint256 contractBalanceAfter = ERC20Token.balanceOf(address(this));
        // exactAmountTransfered is the exact amount being transferred in contract
        uint256 exactAmountTransfered = contractBalanceAfter - contractBalanceBefore;
        exactAmountTransfered = exactAmountTransfered * (10 ** 18) / (10 ** decimals);
        
        Datahub.setAssetInfo(0, token, exactAmountTransfered, true); // 0 -> totalAssetSupply
        
        interestContract.chargeMassinterest(token);

        (uint256 assets, uint256 liabilities, , , ,) = Datahub.ReadUserData(beneficiary, token);
        
        if (liabilities > 0) {
            
            uint256 interestCharge = interestContract.returnInterestCharge(
                beneficiary,
                token,
                0
            );
    
            Datahub.addLiabilities(beneficiary, token, interestCharge);
            liabilities = liabilities + interestCharge;

            if (exactAmountTransfered <= liabilities) {
                // modifyMMROnDeposit(beneficiary, token, exactAmountTransfered);

                // modifyIMROnDeposit(beneficiary, token, exactAmountTransfered);

                Datahub.removeLiabilities(beneficiary, token , exactAmountTransfered);

                Datahub.setAssetInfo(1, token, exactAmountTransfered, false); // 1 -> totalBorrowedexactAmountTransferedfalse); // 1 -> totalBorrowedAmount

                return true;
            } else {
                // modifyMMROnDeposit(beneficiary, token, liabilities);

                // modifyIMROnDeposit(beneficiary, token, liabilities);

                Datahub.addAssets(beneficiary, token, exactAmountTransfered - liabilities); // add to assets

                Datahub.removeLiabilities(beneficiary, token, liabilities); // remove all liabilities

                Datahub.setAssetInfo(1, token, liabilities, false); // 1 -> totalBorrowedexactAmountTransfered

                Datahub.changeMarginStatus(beneficiary);
                return true;
            }
        } else {
            address[] memory users = new address[](1);
            users[0] = beneficiary;

            Datahub.checkIfAssetIsPresent(users, token);
            Datahub.addAssets(beneficiary, token, exactAmountTransfered);

            return true;
        }
    }

    function borrow(address token, uint256 amount) external {
        IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(token);        
        require(assetLogs.initialized == true, "this asset is not available to be borrowed");
       
        interestContract.chargeMassinterest(token);
        (uint256 assets, uint256 liabilities, uint256 pending, , ,) = Datahub.ReadUserData(msg.sender, token);
        require(pending == 0, "You must have a 0 pending trade balance to borrow, please wait for your trade to settle before attempting to borrow");
        uint256 initalMarginFeeAmount = EVO_LIBRARY.calculateinitialMarginFeeAmount(assetLogs, amount);

        if (liabilities > 0) {    
            Executor.chargeinterest(msg.sender, token, amount, false);
        } else {
            Executor.chargeinterest(msg.sender, token, amount + initalMarginFeeAmount, false);
            // Datahub.addLiabilities(msg.sender, token, amount + initalMarginFeeAmount);
            // Datahub.setAssetInfo(1, token, amount + initalMarginFeeAmount, true); // 1 -> TotalBorrowedAmount
            // Datahub.alterUsersInterestRateIndex(msg.sender, token);
        }

        Executor.divideFee(token, initalMarginFeeAmount);
        
        Datahub.addAssets(msg.sender, token, amount);

        uint256 usersAIMR = Datahub.calculateAIMRForUser(msg.sender);
        uint256 usersTCV = Datahub.calculateCollateralValue(msg.sender);
        // console.log("users aimr", usersAIMR);
        // console.log("users tcv", usersTCV);
        require(usersAIMR < usersTCV, "Cannot Borrow because it reached out the limit");
    }

    function repay(address token, uint256 amount) external {
        IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(token);        
        require(assetLogs.initialized == true, "this asset is not available to be repayed");
       
        interestContract.chargeMassinterest(token);

        (uint256 assets, uint256 liabilities, , , ,) = Datahub.ReadUserData(msg.sender, token);

        require(liabilities > 0, "Already repaid");
        
        uint256 repay_amount = amount > liabilities ? liabilities : amount;

        require(repay_amount < assets, "Insufficient funds in user");

        // Executor.chargeinterest(msg.sender, token, repay_amount, true);       
        Datahub.removeAssets(msg.sender, token, repay_amount);
    }

    function withdrawETH(address payable owner) external onlyOwner {
        uint contractBalance = address(this).balance;
        uint256 usersTCV = Datahub.calculateCollateralValue(msg.sender) - Datahub.calculatePendingCollateralValue(msg.sender);
        require(contractBalance > 0, "No balance to withdraw");
        payable(owner).transfer(contractBalance);
    }
    receive() external payable {}
}
