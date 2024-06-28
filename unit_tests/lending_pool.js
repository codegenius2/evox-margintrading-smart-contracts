const hre = require("hardhat");
// const {GasTracker} = require("hardhat-gas-trackooor");
const { expect } = require("chai");
const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const tokenabi = require("../scripts/token_abi.json");
const depositABI = require("../artifacts/contracts/depositvault.sol/DepositVault.json")
const OracleABI = require("../artifacts/contracts/mock/MockOracle.sol/MockOracle.json")
const ExecutorAbi = require("../artifacts/contracts/mock/MockExecutor.sol/MockExecutor.json")
const utilABI = require("../artifacts/contracts/mock/MockUtils.sol/MockUtils.json")
const DataHubAbi = require("../artifacts/contracts/mock/MockDatahub.sol/MockDatahub.json");
const InterestAbi = require("../artifacts/contracts/mock/MockInterestData.sol/MockInterestData.json")
const LiquidatorAbi = require("../artifacts/contracts/liquidator.sol/Liquidator.json")
// const MathAbi = require("../artifacts/contracts/Math.sol/Math.json")
const increaseTime =  require("./utils.js");


const fs = require('fs');
const exp = require("constants");
const { Sign } = require("crypto");
const { userInfo } = require("os");

async function getTimeStamp(provider) {
    const block = await provider.getBlock('latest');
    return block.timestamp;
}

async function setTimeStamp(provider, network, scaledTimestamp) {
    await provider.send("evm_setNextBlockTimestamp", [scaledTimestamp]);
    await network.provider.send("evm_mine");
}

async function createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN) {
    // Get borrowed amount
    let borrowed_usdt = (await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress())).assetInfo[1];
    // borrowed_usdt = borrowed_usdt.totalLiabilitiesAtIndex
    // console.log("USDT borrowed", borrowed_usdt);

    let borrowed_rexe = (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress())).assetInfo[1];
    // borrowed_rexe = borrowed_rexe.totalLiabilitiesAtIndex
    // console.log("REXE borrowed", borrowed_rexe);
    
    // Fetch current interest RATE
    let Rate_usdt = await _Interest.fetchCurrentRate(await USDT_TOKEN.getAddress());
    // console.log("USDT rate", Rate_usdt);

    let Rate_rexe = await _Interest.fetchCurrentRate(await REXE_TOKEN.getAddress());
    // console.log("REXE rate", Rate_rexe);

    // Get liability
    let userData_usdt_signer0 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
    let liabilitiesValue_usdt_signer0 = userData_usdt_signer0[1];
    // console.log("USDT liabilitiesValue_usdt_signer0", liabilitiesValue_usdt_signer0);

    let userData_rexe_signer0 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
    let liabilitiesValue_rexe_signer0 = userData_rexe_signer0[1];
    // console.log("REXE liabilitiesValue", liabilitiesValue_rexe);

    // let user_usdt_earning_rate0 = await Utils.returnEarningRateProfit(signers[0].address, await USDT_TOKEN.getAddress());
    // let user_rexe_earning_rate0 = await Utils.returnEarningRateProfit(signers[0].address, await REXE_TOKEN.getAddress());

    // Get interestadjustedliability
    let interestadjustedLiabilities_usdt_singer0 = await _Interest.returnInterestCharge(
        signers[0].address,
        await USDT_TOKEN.getAddress(),
        0
    )
    // console.log("=====================USDT interestadjustedLiabilities=========================", interestadjustedLiabilities_usdt_singer0);

    let interestadjustedLiabilities_rexe_signer0 = await _Interest.returnInterestCharge(
        signers[0].address,
        await REXE_TOKEN.getAddress(),
        0
    )
    // console.log("REXE interestadjustedLiabilities", interestadjustedLiabilities_rexe);
    let signer0_feeInfo = (await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress())).feeInfo[0];
    let singer0_liabilities = 500_000000000000000000n;
    const singer0IMF = await _Interest.calculateIMF(signer0_feeInfo, singer0_liabilities);
    // console.log(singer0IMF);

    // Get liability
    let userData_usdt_singer1 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
    let liabilitiesValue_usdt_signer1 = userData_usdt_singer1[1];
    // console.log("USDT liabilitiesValue_usdt_signer1", liabilitiesValue_usdt_signer1);

    let userData_rexe_signer1 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
    let liabilitiesValue_rexe_signer1 = userData_rexe_signer1[1];
    // console.log("REXE liabilitiesValue", liabilitiesValue_rexe);

    let user_usdt_earning_rate1 = await Utils.returnEarningRateProfit(signers[1].address, await USDT_TOKEN.getAddress());
    // console.log("=====================user_usdt_earning_rate1=========================", user_usdt_earning_rate1);
    // let user_rexe_earning_rate1 = await Utils.returnEarningRateProfit(signers[1].address, await REXE_TOKEN.getAddress());

    // Get interestadjustedliability
    let interestadjustedLiabilities_usdt_signer1 = await _Interest.returnInterestCharge(
        signers[1].address,
        await USDT_TOKEN.getAddress(),
        0
    )
    // console.log("USDT interestadjustedLiabilities", interestadjustedLiabilities_usdt);

    let interestadjustedLiabilities_rexe_signer1 = await _Interest.returnInterestCharge(
        signers[1].address,
        await REXE_TOKEN.getAddress(),
        0
    )

    // Get liability
    let userData_usdt_singer2 = await DataHub.ReadUserData(signers[2].address, await USDT_TOKEN.getAddress());
    let liabilitiesValue_usdt_signer2 = userData_usdt_singer2[1];
    // console.log("USDT liabilitiesValue", liabilitiesValue_usdt);

    let userData_rexe_signer2 = await DataHub.ReadUserData(signers[2].address, await REXE_TOKEN.getAddress());
    let liabilitiesValue_rexe_signer2 = userData_rexe_signer2[1];
    // console.log("REXE liabilitiesValue", liabilitiesValue_rexe);

    // let user_usdt_earning_rate2 = await Utils.returnEarningRateProfit(signers[2].address, await USDT_TOKEN.getAddress());
    // let user_rexe_earning_rate2 = await Utils.returnEarningRateProfit(signers[2].address, await REXE_TOKEN.getAddress());

    // Get interestadjustedliability
    let interestadjustedLiabilities_usdt_signer2 = await _Interest.returnInterestCharge(
        signers[2].address,
        await USDT_TOKEN.getAddress(),
        0
    )
    // console.log("USDT interestadjustedLiabilities", interestadjustedLiabilities_usdt);

    let interestadjustedLiabilities_rexe_signer2 = await _Interest.returnInterestCharge(
        signers[2].address,
        await REXE_TOKEN.getAddress(),
        0
    )
    // console.log("REXE interestadjustedLiabilities", interestadjustedLiabilities_rexe);

    let interestIndex_usdt = await _Interest.fetchCurrentRateIndex(await USDT_TOKEN.getAddress());
    let interestIndex_rexe = await _Interest.fetchCurrentRateIndex(await REXE_TOKEN.getAddress());
    let hourly_rate_usdt = Number(Rate_usdt.toString()) / 8736;
    let hourly_rate_rexe = Number(Rate_rexe.toString()) / 8736;
    
    let user_usdt_data_signer0 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
    let rexe_usdt_data_signer0 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

    let usdt_amount_signer0 = user_usdt_data_signer0[0];    
    let rexe_amount_signer0 = rexe_usdt_data_signer0[0];

    let user_usdt_data_signer1 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
    let rexe_usdt_data_signer1 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

    let usdt_amount_signer1 = user_usdt_data_signer1[0];    
    let rexe_amount_signer1 = rexe_usdt_data_signer1[0];

    let user_usdt_data_signer2 = await DataHub.ReadUserData(signers[2].address, await USDT_TOKEN.getAddress());
    let rexe_usdt_data_signer2 = await DataHub.ReadUserData(signers[2].address, await REXE_TOKEN.getAddress());

    let usdt_amount_signer2 = user_usdt_data_signer2[0];    
    let rexe_amount_signer2 = rexe_usdt_data_signer2[0];

    let usdt_supply = (await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress())).assetInfo[0];
    let rexe_supply = (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress())).assetInfo[0];

    // Create a data object for the current iteration
    const newData = {
        "USDT-0" : {
            "index": Number(interestIndex_usdt.toString()),
            // "loop #": i,
            "usdt_amount": Number(usdt_amount_signer0.toString()) / 10 ** 18,
            "usdt_supply" : Number(usdt_supply.toString()) / 10 ** 18,
            "total-borrowed": Number(borrowed_usdt.toString()) / 10 ** 18,
            "rate": Number(Rate_usdt.toString()) / 10 ** 18,
            "hourly-rate": Number(hourly_rate_usdt) / 10 ** 18,
            "liabilities": Number(Number(liabilitiesValue_usdt_signer0) + Number(interestadjustedLiabilities_usdt_singer0)) / 10 ** 18,
            // "earningrates": Number(Number(usdt_amount_signer0.toString()) + Number(user_usdt_earning_rate0.toString())) / 10 **18,
            "timestamp": Number(scaledTimestamp.toString()),
            "liability_charge": Number(Number(interestadjustedLiabilities_usdt_singer0)) / 10 ** 18,
        },
        "USDT-1" : {
            "index": Number(interestIndex_usdt.toString()),
            // "loop #": i,
            "usdt_amount": Number(usdt_amount_signer1.toString()) / 10 ** 18,
            "usdt_supply" : Number(usdt_supply.toString()) / 10 ** 18,
            "total-borrowed": Number(borrowed_usdt.toString()) / 10 ** 18,
            "rate": Number(Rate_usdt.toString()) / 10 ** 18,
            "hourly-rate": Number(hourly_rate_usdt) / 10 ** 18,
            "liabilities": Number(Number(liabilitiesValue_usdt_signer1) + Number(interestadjustedLiabilities_usdt_signer1)) / 10 ** 18,
            // "earningrates": Number(Number(usdt_amount_signer1.toString()) + Number(user_usdt_earning_rate1.toString())) / 10 **18,
            "timestamp": Number(scaledTimestamp.toString()),
            "earningreate_charge": Number(user_usdt_earning_rate1.toString()) / 10 **18,
        },
        "USDT-2" : {
            "index": Number(interestIndex_usdt.toString()),
            // "loop #": i,
            "usdt_amount": Number(usdt_amount_signer2.toString()) / 10 ** 18,
            "usdt_supply" : Number(usdt_supply.toString()) / 10 ** 18,
            "total-borrowed": Number(borrowed_usdt.toString()) / 10 ** 18,
            "rate": Number(Rate_usdt.toString()) / 10 ** 18,
            "hourly-rate": Number(hourly_rate_usdt) / 10 ** 18,
            "liabilities": Number(Number(liabilitiesValue_usdt_signer2) + Number(interestadjustedLiabilities_usdt_signer2)) / 10 ** 18,
            // "earningrates": Number(Number(usdt_amount_signer2.toString()) + Number(user_usdt_earning_rate2.toString())) / 10 **18,
            "timestamp": Number(scaledTimestamp.toString()),
        },
        "REXE-0" : {
            "index": Number(interestIndex_rexe.toString()),
            // "loop #": i,
            "rexe_amount" : Number(rexe_amount_signer0.toString()) / 10 ** 18,
            "rexe_supply" : Number(rexe_supply.toString()) / 10 ** 18,
            "total-borrowed": Number(borrowed_rexe.toString()) / 10 ** 18,
            "rate": Number(Rate_rexe.toString()) / 10 ** 18,
            "hourly-rate": hourly_rate_rexe / 10 ** 18,
            "liabilities": Number(Number(liabilitiesValue_rexe_signer0) + Number(interestadjustedLiabilities_rexe_signer0)) / 10 ** 18,
            // "earningrates": Number(Number(rexe_amount_signer0.toString()) + Number(user_rexe_earning_rate0.toString())) / 10 **18,
            "timestamp": Number(scaledTimestamp.toString()),
        },
        "REXE-1" : {
            "index": Number(interestIndex_rexe.toString()),
            // "loop #": i,
            "rexe_amount" : Number(rexe_amount_signer1.toString()) / 10 ** 18,
            "rexe_supply" : Number(rexe_supply.toString()) / 10 ** 18,
            "total-borrowed": Number(borrowed_rexe.toString()) / 10 ** 18,
            "rate": Number(Rate_rexe.toString()) / 10 ** 18,
            "hourly-rate": hourly_rate_rexe / 10 ** 18,
            "liabilities": Number(Number(liabilitiesValue_rexe_signer1) + Number(interestadjustedLiabilities_rexe_signer1)) / 10 ** 18,
            // "earningrates": Number(Number(rexe_amount_signer1.toString()) + Number(user_rexe_earning_rate1.toString())) / 10 **18,
            "timestamp": Number(scaledTimestamp.toString()),
        },
        "REXE-2" : {
            "index": Number(interestIndex_rexe.toString()),
            // "loop #": i,
            "rexe_amount" : Number(rexe_amount_signer2.toString()) / 10 ** 18,
            "rexe_supply" : Number(rexe_supply.toString()) / 10 ** 18,
            "total-borrowed": Number(borrowed_rexe.toString()) / 10 ** 18,
            "rate": Number(Rate_rexe.toString()) / 10 ** 18,
            "hourly-rate": hourly_rate_rexe / 10 ** 18,
            "liabilities": Number(Number(liabilitiesValue_rexe_signer2) + Number(interestadjustedLiabilities_rexe_signer2)) / 10 ** 18,
            // "earningrates": Number(Number(rexe_amount_signer2.toString()) + Number(user_rexe_earning_rate2.toString())) / 10 **18,
            "timestamp": Number(scaledTimestamp.toString()),
        }
    };
    return newData;

}

describe("Interest Test", function () {
    async function deployandInitContracts() {
        const signers = await hre.ethers.getSigners();
        // console.log("Deploying contracts with the account:", signers[0].address);

        const initialOwner = signers[0].address // insert wallet address 
        const tempAdmin = signers[1].address;
        // insert airnode address , address _executor, address _deposit_vault
        const executor = tempAdmin;
        const depositvault = tempAdmin;
        const oracle = tempAdmin;

        /////////////////////////////////Deploy REXE with singer[1]/////////////////////////////////////////
        const REXE = await hre.ethers.deployContract("REXE", [signers[1].address]);
        await REXE.waitForDeployment();

        const DAI = await hre.ethers.deployContract("DAI", [signers[0].address]);
        await DAI.waitForDeployment();

        // console.log("REXE deployed to", await connectedREXE.getAddress());
        // console.log("REXE Balance = ", await REXE.balanceOf(signers[1].address))

        /////////////////////////////////Deploy USDT with singer[1]/////////////////////////////////////////
        const USDT = await hre.ethers.deployContract("USDT", [signers[0].address]);
        await USDT.waitForDeployment();
        // console.log("USDT deployed to", await USDT.getAddress());
        // console.log("USDB balance = ", await USDT.balanceOf(signers[0].address))

        // console.log("==========================Deploy contracts===========================");
        /////////////////////////////////Deploy EVO_LIB//////////////////////////////////////
        const EVO_LIB = await hre.ethers.deployContract("EVO_LIBRARY");

        await EVO_LIB.waitForDeployment();

        // console.log("EVO Library deployed to", await EVO_LIB.getAddress());
        /////////////////////////////////Deploy Interest//////////////////////////////////////
        const Interest = await hre.ethers.getContractFactory("MockInterestData", {
            libraries: {
                EVO_LIBRARY: await EVO_LIB.getAddress(),
            },
        });

        const Deploy_interest = await Interest.deploy(initialOwner, executor, depositvault, tempAdmin, tempAdmin);

        await Deploy_interest.waitForDeployment();

        // console.log("Interest deployed to", await Deploy_interest.getAddress());


        /////////////////////////////////Deploy dataHub////////////////////////////////////////
        const Deploy_dataHub = await hre.ethers.deployContract("MockDatahub", [initialOwner, executor, depositvault, oracle, await Deploy_interest.getAddress(), tempAdmin]);

        await Deploy_dataHub.waitForDeployment();

        // console.log("Datahub deployed to", await Deploy_dataHub.getAddress());

        /////////////////////////////////Deploy depositVault////////////////////////////////////
        const depositVault = await hre.ethers.getContractFactory("DepositVault", {
            libraries: {
                EVO_LIBRARY: await EVO_LIB.getAddress(),
            },
        });
        const Deploy_depositVault = await depositVault.deploy(initialOwner, await Deploy_dataHub.getAddress(), tempAdmin, await Deploy_interest.getAddress(), tempAdmin, await USDT.getAddress());

        await Deploy_depositVault.waitForDeployment();

        // console.log("Deposit Vault deployed to", await Deploy_depositVault.getAddress());

        /////////////////////////////////Deploy Oracle///////////////////////////////////////////
        const DeployOracle = await hre.ethers.deployContract("MockOracle", [initialOwner,
            tempAdmin,
            tempAdmin,
            tempAdmin])

        // console.log("Oracle deployed to", await DeployOracle.getAddress());
        
        /////////////////////////////////Deploy Utility///////////////////////////////////////////
        const Utility = await hre.ethers.getContractFactory("MockUtils", {
            libraries: {
                EVO_LIBRARY: await EVO_LIB.getAddress(),
            },
        });
        const Deploy_Utilities = await Utility.deploy(initialOwner, Deploy_dataHub.getAddress(), Deploy_depositVault.getAddress(), DeployOracle.getAddress(), tempAdmin, await Deploy_interest.getAddress());

        // console.log("Utils deployed to", await Deploy_Utilities.getAddress());

        /////////////////////////////////Deploy liquidator/////////////////////////////////////////
        const Liquidator = await hre.ethers.getContractFactory("Liquidator", {
            libraries: {
                EVO_LIBRARY: await EVO_LIB.getAddress(),
            },
        });
        const Deploy_Liquidator = await Liquidator.deploy(initialOwner, Deploy_dataHub.getAddress(), tempAdmin); // need to alter the ex after 

        // console.log("Liquidator deployed to", await Deploy_Liquidator.getAddress());

        Deploy_Utilities
        const Exchange = await hre.ethers.getContractFactory("MockExecutor", {
            // libraries: {
            //     EVO_LIBRARY: await EVO_LIB.getAddress(),
            // },
        });

        const Deploy_Exchange = await Exchange.deploy(initialOwner, Deploy_dataHub.getAddress(), Deploy_depositVault.getAddress(), DeployOracle.getAddress(), Deploy_Utilities.getAddress(), await Deploy_interest.getAddress(), Deploy_Liquidator.getAddress());

        // console.log("Deploy_Utilities deployed to", await Deploy_Utilities.getAddress());

        // console.log("==========================Deploy Contracts Finished===========================");
        ///////////////////////////////////////////////////////////////////////////////////////////////////////
        
        ///////////////////////////////////////////////////////////////////////////////////////////////////////
        // INIT CONTRACTS
        // console.log("==========================Init contracts===========================");

        const tradeFees = [0, 0];
        /////////////////////// USDT /////////////////////////
        const USDTprice = 1_000000000000000000n
        const USDTCollValue = 1_000000000000000000n
        const USDTFeeInfo = [
            5000000000000000n, // USDTinitialMarginRequirement
            30000000000000000n // tokenTransferFee
        ];
        const USDTMarginRequirement = [
            200000000000000000n, // initialMarginRequirement
            100000000000000000n // MaintenanceMarginRequirement
        ];
        const USDTBorrowPosition = [
            700000000000000000n, // optimalBorrowProportion
            1_000000000000000000n // maximumBorrowProportion
        ];
        const USDTInterestRate = 5000000000000000n //( 5**16) was 5
        const USDT_interestRateInfo = [5000000000000000n, 150000000000000000n, 1_000000000000000000n] //( 5**16) was 5, 150**16 was 150, 1000 **16 was 1000

        /////////////////////// REX /////////////////////////
        const REXEprice = 2_000000000000000000n
        const EVOXCollValue = 1_000000000000000000n
        const REXEFeeInfo = [
            10000000000000000n, // USDTinitialMarginRequirement
            100000000000000000n, // USDTliquidationFee
        ];
        const REXEMarginRequirement = [
            500000000000000000n, // initialMarginRequirement
            250000000000000000n // MaintenanceMarginRequirement
        ];
        const REXEBorrowPosition = [
            700000000000000000n, // optimalBorrowProportion
            1000000000000000000n // maximumBorrowProportion
        ];
        const REXEInterestRate = 5000000000000000n //( 5**16) was 5
        const REXE_interestRateInfo = [5000000000000000n, 150000000000000000n, 1_000000000000000000n] //( 5**16) was 5, 150**16 was 150, 1000 **16 was 1000

        /////////////////////// DAI /////////////////////////
        const DAIprice = 2_000000000000000000n
        const DAICollValue = 1_000000000000000000n
        const DAIFeeInfo = [
            10000000000000000n, // USDTinitialMarginRequirement
            100000000000000000n, // USDTliquidationFee
        ];
        const DAIMarginRequirement = [
            500000000000000000n, // initialMarginRequirement
            250000000000000000n // MaintenanceMarginRequirement
        ];
        const DAIBorrowPosition = [
            700000000000000000n, // optimalBorrowProportion
            1000000000000000000n // maximumBorrowProportion
        ];
        const DAIInterestRate = 5000000000000000n //( 5**16) was 5
        const DAI_interestRateInfo = [5000000000000000n, 150000000000000000n, 1_000000000000000000n] //( 5**16) was 5, 150**16 was 150, 1000 **16 was 1000

        //////////////////////////////////////// Init Contracts ///////////////////////////////////////////////

        //////////////////// Init utils //////////////////////
        const Utils = new hre.ethers.Contract(await Deploy_Utilities.getAddress(), utilABI.abi, signers[0]);
        const SETUP = await Utils.alterAdminRoles(await Deploy_dataHub.getAddress(), await Deploy_depositVault.getAddress(), await DeployOracle.getAddress(), await Deploy_interest.getAddress(), await Deploy_Liquidator.getAddress(), await Deploy_Exchange.getAddress());
        await SETUP.wait()
        // console.log("util init done")

        //////////////////// Init Exchange //////////////////////
        const CurrentExchange = new hre.ethers.Contract(await Deploy_Exchange.getAddress(), ExecutorAbi.abi, signers[0]);
        const SETUPEX = await CurrentExchange.alterAdminRoles(await Deploy_dataHub.getAddress(), await Deploy_depositVault.getAddress(), await DeployOracle.getAddress(), await Deploy_Utilities.getAddress(), await Deploy_interest.getAddress(), await Deploy_Liquidator.getAddress());
        await SETUPEX.wait()
        // console.log("exchange init done")


        //////////////////// Init deposit vault //////////////////////
        const deposit_vault = new hre.ethers.Contract(await Deploy_depositVault.getAddress(), depositABI.abi, signers[0])
        const setupDV = await deposit_vault.alterAdminRoles(await Deploy_dataHub.getAddress(), await Deploy_Exchange.getAddress(), await Deploy_interest.getAddress(), await Deploy_Utilities.getAddress())
        await setupDV.wait();

        await deposit_vault.setUSDT(await USDT.getAddress());
        // console.log("deposit vault init done")

        //////////////////// Init liquidator //////////////////////
        const CurrentLiquidator = new hre.ethers.Contract(await Deploy_Liquidator.getAddress(), LiquidatorAbi.abi, signers[0]);
        const liqSetup = await CurrentLiquidator.alterAdminRoles(await Deploy_Exchange.getAddress(), await Deploy_dataHub.getAddress(), await Deploy_Utilities.getAddress(), await Deploy_interest.getAddress());
        await liqSetup.wait();
        // console.log("liquidator init done")

        //////////////////// Init Datahub //////////////////////
        const DataHub = new hre.ethers.Contract(await Deploy_dataHub.getAddress(), DataHubAbi.abi, signers[0]);
        const setup = await DataHub.alterAdminRoles(await Deploy_depositVault.getAddress(), await Deploy_Exchange.getAddress(), await DeployOracle.getAddress(), await Deploy_interest.getAddress(), await Deploy_Utilities.getAddress(), await Deploy_Liquidator.getAddress());
        await setup.wait();
        // console.log("datahub init done")

        //////////////////// Init Oracle //////////////////////
        const Oracle = new hre.ethers.Contract(await DeployOracle.getAddress(), OracleABI.abi, signers[0]);
        const oraclesetup = await Oracle.alterAdminRoles(await Deploy_Exchange.getAddress(), await Deploy_dataHub.getAddress(), await Deploy_depositVault.getAddress());
        await oraclesetup.wait();
        // console.log("oracle init done")
        
        //////////////////// Init interest //////////////////////
        const _Interest = new hre.ethers.Contract(await Deploy_interest.getAddress(), InterestAbi.abi, signers[0]);
        const interestSetup = await _Interest.alterAdminRoles(await Deploy_dataHub.getAddress(), await Deploy_Exchange.getAddress(), await Deploy_depositVault.getAddress(), await Deploy_Utilities.getAddress());
        await interestSetup.wait();
        // console.log("interest init done")
        //////////////////// Set USDT and REXE in interestData //////////////////////
        const InitRatesREXE = await _Interest.initInterest(await REXE.getAddress(), 1, REXE_interestRateInfo, REXEInterestRate)
        const InitRatesUSDT = await _Interest.initInterest(await USDT.getAddress(), 1, USDT_interestRateInfo, USDTInterestRate)
        const InitRatesDAI = await _Interest.initInterest(await DAI.getAddress(), 1, DAI_interestRateInfo, DAIInterestRate)
        await InitRatesREXE.wait();
        await InitRatesUSDT.wait();
        await InitRatesDAI.wait();
        // console.log("Set USDT and REXE in interestData done")

        //////////////////// InitTokenMarket USDT in DataHub //////////////////////
        const USDT_init_transaction = await DataHub.InitTokenMarket(await USDT.getAddress(), USDTprice, USDTCollValue, tradeFees, USDTMarginRequirement, USDTBorrowPosition, USDTFeeInfo);
        await USDT_init_transaction.wait();
        // console.log("InitTokenMarket USDT in DataHub done")

        //////////////////// InitTokenMarket REXE in DataHub //////////////////////
        const REXE_init_transaction = await DataHub.InitTokenMarket(await REXE.getAddress(), REXEprice, EVOXCollValue, tradeFees, REXEMarginRequirement, REXEBorrowPosition, REXEFeeInfo);
        await REXE_init_transaction.wait();
        // console.log("InitTokenMarket REXE in DataHub done")

        const DAI_init_transaction = await DataHub.InitTokenMarket(await DAI.getAddress(), DAIprice, DAICollValue, tradeFees, DAIMarginRequirement, DAIBorrowPosition, DAIFeeInfo);
        await DAI_init_transaction.wait();

        ///////////////////////////////// Getting Token Contracts //////////////////////////////////////
        const contractABI = tokenabi.abi; // token abi for approvals 

        // Get USDT Contract
        const USDT_TOKEN = new hre.ethers.Contract(await USDT.getAddress(), contractABI, signers[0]);

        // Get Rexe Contract
        const REXE_TOKEN = new hre.ethers.Contract(await REXE.getAddress(), contractABI, signers[0]);

        const DAI_TOKEN = new hre.ethers.Contract(await DAI.getAddress(), contractABI, signers[0]);

        // const USDT_setTokenTransferFee = await DataHub.setTokenTransferFee(await USDT_TOKEN.getAddress(), 0) // 0.003% ==> 3  // 3000 for 3% percentage of fees. 
        // await USDT_setTokenTransferFee.wait();
        // expect(await DataHub.tokenTransferFees(await USDT_TOKEN.getAddress())).to.equal(0);

        // // const REXE_setTokenTransferFee = await DataHub.setTokenTransferFee(await REXE_TOKEN.getAddress(), 0) // 0.003% ==> 3  // 3000 for 3% percentage of fees. 
        // await REXE_setTokenTransferFee.wait();
        // expect(await DataHub.tokenTransferFees(await REXE_TOKEN.getAddress())).to.equal(0);

        // // const DAI_setTokenTransferFee = await DataHub.setTokenTransferFee(await DAI_TOKEN.getAddress(), 0) // 0.003% ==> 3  // 3000 for 3% percentage of fees. 
        // await DAI_setTokenTransferFee.wait();
        // expect(await DataHub.tokenTransferFees(await DAI_TOKEN.getAddress())).to.equal(0);

        // await Oracle.setUSDT(await USDT_TOKEN.getAddress());


        // console.log("================================Init Contracts Finished=============================")

        return {signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN, DAI_TOKEN};
    }

    describe("Deployment", function () {
        it("Deploy and Init All contracts ", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);
            // Add All expect causes
            // DataHub.returnAssetLogs(USDT_TOKEN.getAddress().initialized).to.equal(true);
            expect((await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress())).initialized).to.equal(true);
            // DataHub.returnAssetLogs(REXE_TOKEN.getAddress().initialized).to.equal(true);
            expect((await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress())).initialized).to.equal(true);
        })
    })

    describe("Lending Pool Logic Test", function () {
        // it("Alter Lending Pool Function Test", async function () {
        //     const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

        //     await DataHub.addLiabilitiesTest(signers[0].address, await USDT_TOKEN.getAddress(), 502_504238073434460000n);
        //     await DataHub.settotalAssetSupplyTest(await USDT_TOKEN.getAddress(), 1500_000000000000000000n, true);
        //     await DataHub.settotalAssetSupplyTest(await REXE_TOKEN.getAddress(), 1500_000000000000000000n, true);
        //     await DataHub.settotalBorrowAmountTest(await USDT_TOKEN.getAddress(), 502_504238073434460000n, true);
        //     await DataHub.addAssetsTest(signers[1].address, await USDT_TOKEN.getAddress(), 2000_000000000000000000n);

        //     const originTimestamp = await getTimeStamp(hre.ethers.provider);

        //     const scaledTimestamp = originTimestamp + 0 * 3600;

        //     setTimeStamp(hre.ethers.provider, network, scaledTimestamp);

        //     let data = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);

        //     expect(data["USDT-0"]["total-borrowed"]).equals(Number(502.50423807343446));
        //     expect(data["USDT-0"].usdt_supply).equals(Number(1500));

        //     expect(data["USDT-0"].usdt_amount).equals(Number(0));
        //     expect(data["USDT-0"]["liabilities"]).equals(Number(502.50423807343446));

        //     expect(data["USDT-1"].usdt_amount).equals(Number(2000));
        //     expect(data["USDT-1"]["liabilities"]).equals(Number(0));

        //     DataHub.connect(signers[0]).alterLendingPool(await USDT_TOKEN.getAddress(), 100_000000000000000000n, true);
            
        //     // Deposit Functionality Test
        //     await expect(DataHub.connect(signers[0]).alterLendingPool(await USDT_TOKEN.getAddress(), 100_000000000000000000n, true)).to.be.revertedWith('Insufficient funds');
        //     await expect(DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 2000_000000000000000000n, true)).to.be.revertedWith('this amount cannot be deposited into the lending pool cause of overflow');

        //     await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 1000_000000000000000000n, true);
            
        //     data = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);

        //     expect(data["USDT-0"]["total-borrowed"]).equals(Number(502.50423807343446));
        //     expect(data["USDT-0"].usdt_supply).equals(Number(500));
        //     expect(data["USDT-0"].usdt_amount).equals(Number(0));
        //     expect(data["USDT-0"]["liabilities"]).equals(Number(502.50423807343446));

        //     expect(data["USDT-1"].usdt_amount).equals(Number(1000));
        //     expect(data["USDT-1"]["liabilities"]).equals(Number(0));

        //     let asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
        //     let user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

        //     expect(user_data[5]).equals(1000_000000000000000000n); // lending pool amount
        //     expect(asset_data[4][2]).equals(1000_000000000000000000n); // lending pool supply

        //     // Withdraw Functionality Test
        //     await expect(DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 1100_000000000000000000n, false)).to.be.revertedWith('this amount cannot be withdrawn into cause of underflow');
        //     // await expect(DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 1500_000000000000000000n, false)).to.be.revertedWith('this amount cannot be withdrawn into the lending pool');

        //     await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 400_000000000000000000n, false);
            
        //     data = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);

        //     expect(data["USDT-0"]["total-borrowed"]).equals(Number(502.50423807343446));
        //     expect(data["USDT-0"].usdt_supply).equals(Number(900));
        //     expect(data["USDT-0"].usdt_amount).equals(Number(0));
        //     expect(data["USDT-0"]["liabilities"]).equals(Number(502.50423807343446));

        //     expect(data["USDT-1"].usdt_amount).equals(Number(1400));
        //     expect(data["USDT-1"]["liabilities"]).equals(Number(0));

        //     expect(user_data[5]).equals(1000_000000000000000000n); // lending pool amount
        //     expect(asset_data[4][2]).equals(1000_000000000000000000n); // lending pool supply
        // })

        it("Test Earning rate and liability after trade ", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            // Set USDT Address in Oracle
            // await Oracle.setUSDT(await USDT_TOKEN.getAddress());

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 500_000000000000000000n
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            deposit_amount = 1_000_000000000000000000n;
            let transfer = await USDT_TOKEN.transfer(signers[1].address, deposit_amount);
            await transfer.wait();
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n;
            transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, deposit_amount);
            await transfer.wait(); 
            approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            deposit_amount = 5_000_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            const Data1 = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 2_500_000000000000000000n, // 12000000000000000000  // 2500
            }
            const trade_sides = [[true], [false]];
            const pair = [Data1.taker_out_token, Data1.maker_out_token];
            const participants = [[Data1.takers], [Data1.makers]];
            const trade_amounts = [[Data1.taker_out_token_amount], [Data1.maker_out_token_amount]];

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 600_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log(asset_data);
            // console.log(user_data);

            // asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());
            // user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log(asset_data);
            // console.log(user_data);

            expect(user_data[5]).equals(600_000000000000000000n); // lending pool amount
            expect(user_data[0]).equals(400_000000000000000000n); // usdt amount
            expect(asset_data[4][2]).equals(600_000000000000000000n); // lending pool supply

            // const EX = new hre.ethers.Contract(await Deploy_Exchange.getAddress(), ExecutorAbi.abi, signers[0]);

            const originTimestamp = await getTimeStamp(hre.ethers.provider);
            // console.log('Origin timestamp:', originTimestamp);

            // let test = await _Interest.fetchCurrentRateIndex(await USDT_TOKEN.getAddress());
            // console.log("USDT rate", test);

            ///////////////////////////////////////////////////// SUBMIT ORDER ////////////////////////////////////////////////////

            let allData = [];
            let scaledTimestamp;
            // for (let i = 0; i <= 174; i++) {
            for (let i = 0; i < 50; i++) {

                // console.log("////////////////////////////////////////////////////////// LOOP " + i + " /////////////////////////////////////////////////////////////");
                scaledTimestamp = originTimestamp + i * 3600;

                // await hre.ethers.provider.send("evm_setNextBlockTimestamp", [scaledTimestamp]);
                // await network.provider.send("evm_mine");
                setTimeStamp(hre.ethers.provider, network, scaledTimestamp);
                // await increaseTime()
                // console.log(`Loop ${i}: Set timestamp to ${scaledTimestamp}`);

                const masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
                await masscharges_usdt.wait(); // Wait for the transaction to be mined

                // const masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
                // await masscharges_rexe.wait(); // Wait for the transaction to be mined

                if (i == 0) {
                    await CurrentExchange.SubmitOrder(pair, participants, trade_amounts, trade_sides);
                    // await DataHub.removeLiabilitiesTest(signers[0].address, await USDT_TOKEN.getAddress(), 2502657312925200000n);
                    // await DataHub.settotalBorrowAmountTest(await USDT_TOKEN.getAddress(), 2502657312925200000n, false);
                }
                allData.push(await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN));
            }

            // File path for the JSON file
            const filePath = './output/data_earningrate_lending_pool.json';

            // Write all collected data to the JSON file
            fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));

            // for (let index = 1; index < 30; index++) {
            //     console.log("-=-==-=-=-= index -=-=-=-=-=-=-=", index);
            //     console.log("interest rate", (await _Interest.fetchTimeScaledRateIndex(0, await USDT_TOKEN.getAddress(), index))[5]);
            //     console.log("borrow proportion", (await _Interest.fetchTimeScaledRateIndex(0, await USDT_TOKEN.getAddress(), index))[3]);
            // }
            // console.log("bound");
            // for (let index = 1; index < 4; index++) {
            //     console.log("interest rate", (await _Interest.fetchTimeScaledRateIndex(1, await USDT_TOKEN.getAddress(), index))[5]);
            //     console.log("borrow proportion", (await _Interest.fetchTimeScaledRateIndex(1, await USDT_TOKEN.getAddress(), index))[3]);
            // }

            // console.log('All data recorded successfully.');
            const test_val = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);
            // console.log("test", test_val);
            // expect(Number(test_val["USDT-1"].earningrates) - Number(test_val["USDT-0"].liabilities)).greaterThan(Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
            // console.log("test_val", Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
            expect(test_val["USDT-1"].earningreate_charge).equals(1.3945257348511082);
            expect(test_val["USDT-0"].liability_charge).equals(1.4978219201198344);
        })

        it("Test Borrow and Repay", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 2000_000000000000000000n
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            deposit_amount = 200_000000000000000000n;
            let transfer = await USDT_TOKEN.transfer(signers[1].address, deposit_amount);
            await transfer.wait();
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // // REXE Deposit
            // deposit_amount = 1500_000000000000000000n;
            // transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, deposit_amount);
            // await transfer.wait(); 
            // approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            // await approvalTx.wait();  // Wait for the transaction to be mined
            // await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            deposit_amount = 100_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            await DataHub.connect(signers[0]).alterLendingPool(await USDT_TOKEN.getAddress(), 1500_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(1500_000000000000000000n); // lending pool amount
            expect(user_data[0]).equals(500_000000000000000000n); // usdt amount
            expect(asset_data[4][2]).equals(1500_000000000000000000n); // lending pool supply

            const originTimestamp = await getTimeStamp(hre.ethers.provider);

            let borrow_amount = 750_000000000000000000n;
            await deposit_vault.connect(signers[1]).borrow(await USDT_TOKEN.getAddress(), borrow_amount);

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 200_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(200_000000000000000000n); // lending pool amount
            expect(user_data[0]).equals(750_000000000000000000n); // usdt amount
            expect(asset_data[4][2]).equals(1700_000000000000000000n); // lending pool supply


            ///////////////////////////////////////////////////// SUBMIT ORDER ////////////////////////////////////////////////////

            let allData = [];
            let scaledTimestamp;
            // for (let i = 0; i <= 174; i++) {
            for (let i = 0; i < 50; i++) {

                // console.log("////////////////////////////////////////////////////////// LOOP " + i + " /////////////////////////////////////////////////////////////");
                scaledTimestamp = originTimestamp + i * 3600;

                // await hre.ethers.provider.send("evm_setNextBlockTimestamp", [scaledTimestamp]);
                // await network.provider.send("evm_mine");
                setTimeStamp(hre.ethers.provider, network, scaledTimestamp);
                // await increaseTime()
                // console.log(`Loop ${i}: Set timestamp to ${scaledTimestamp}`);

                const masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
                await masscharges_usdt.wait(); // Wait for the transaction to be mined
            }

            let test_val = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);
            let user0_usdt_earning_rate = await Utils.returnEarningProfit(signers[0].address, await USDT_TOKEN.getAddress());
            let user1_usdt_earning_rate = await Utils.returnEarningProfit(signers[1].address, await USDT_TOKEN.getAddress());

            // console.log("singer0 usdt amount", Number(user0_usdt_earning_rate) / 10 ** 18 + test_val["USDT-0"].usdt_amount);
            // console.log("signer1 usdt amount", Number(user1_usdt_earning_rate) / 10 ** 18 + test_val["USDT-1"].usdt_amount);
            // console.log("signer0 usdt liability", test_val["USDT-0"].liabilities);
            // console.log("signer1 usdt liability", test_val["USDT-1"].liabilities);
            

            // expect(test_val["USDT-1"].usdt_amount).equals(750);
            // expect(test_val["USDT-1"].liabilities).equals(754.1516647177815);

             deposit_amount = 200_000000000000000000n;
            transfer = await USDT_TOKEN.transfer(signers[1].address, deposit_amount);
            await transfer.wait();
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)


            let repay_amount = 754_151664717781500000n;
            await deposit_vault.connect(signers[1]).repay(await USDT_TOKEN.getAddress(), repay_amount);

            test_val = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);
            user0_usdt_earning_rate = await Utils.returnEarningProfit(signers[0].address, await USDT_TOKEN.getAddress());
            user1_usdt_earning_rate = await Utils.returnEarningProfit(signers[1].address, await USDT_TOKEN.getAddress());

            // console.log("singer0 usdt amount", Number(user0_usdt_earning_rate) / 10 ** 18 + test_val["USDT-0"].usdt_amount);
            // console.log("signer1 usdt amount", Number(user1_usdt_earning_rate) / 10 ** 18 + test_val["USDT-1"].usdt_amount);
            // console.log("signer0 usdt liability", test_val["USDT-0"].liabilities);
            // console.log("signer1 usdt liability", test_val["USDT-1"].liabilities);
            

            expect(test_val["USDT-1"].usdt_amount).equals(192.1017663807477);
            expect(test_val["USDT-1"].liabilities).equals(557.9337580500688);
        })

        it("Test Withdraw", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 100_000000000000000000n
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            deposit_amount = 200_000000000000000000n;
            let transfer = await USDT_TOKEN.transfer(signers[1].address, deposit_amount);
            await transfer.wait();
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 150_000000000000000000n, true);
            // await DataHub.connect(signers[0]).alterLendingPool(await USDT_TOKEN.getAddress(), 100_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(150_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(150_000000000000000000n); // lending pool supply

            const originTimestamp = await getTimeStamp(hre.ethers.provider);

            test_val = await createNewData(originTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);

            // console.log("singer0 usdt amount", test_val["USDT-0"].usdt_amount);
            // console.log("signer0 usdt liability", test_val["USDT-0"].liabilities);

            let borrow_amount = 100_000000000000000000n;
            await deposit_vault.connect(signers[0]).borrow(await USDT_TOKEN.getAddress(), borrow_amount);

            test_val = await createNewData(originTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);

            // console.log("singer0 usdt amount", test_val["USDT-0"].usdt_amount);
            // console.log("signer0 usdt liability", test_val["USDT-0"].liabilities);

            let aimr_signers = await DataHub.calculateAIMRForUser(signers[0].address);
            let ammr_signers = await DataHub.calculateAMMRForUser(signers[0].address);

            // console.log("aimr for user0", aimr_signers);
            // console.log("ammr for user0", ammr_signers);

            expect(aimr_signers).equals(20200830825647566713n); // lending pool amount
            expect(ammr_signers).equals(10100415412823783356n); // lending pool supply

            let withdraw_amount = 81_000000000000000000n;
            
            await expect(deposit_vault.connect(signers[0]).withdraw_token(await USDT_TOKEN.getAddress(), withdraw_amount)).revertedWith("Cannot withdraw");

            test_val = await createNewData(originTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);

            // console.log("singer0 usdt amount", test_val["USDT-0"].usdt_amount);
            // console.log("signer0 usdt liability", test_val["USDT-0"].liabilities);

            expect(test_val["USDT-0"].usdt_amount).equals(200.5);
            expect(test_val["USDT-0"].liabilities).equals(101.00415412823784);

            aimr_signers = await DataHub.calculateAIMRForUser(signers[0].address);
            ammr_signers = await DataHub.calculateAMMRForUser(signers[0].address);

            // console.log("aimr for user0", aimr_signers);
            // console.log("ammr for user0", ammr_signers);

            withdraw_amount = 79_000000000000000000n;
            expect(await deposit_vault.connect(signers[0]).withdraw_token(await USDT_TOKEN.getAddress(), withdraw_amount)).revertedWith("Cannot withdraw");

            test_val = await createNewData(originTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);

            // console.log("singer0 usdt amount", test_val["USDT-0"].usdt_amount);
            // console.log("signer0 usdt liability", test_val["USDT-0"].liabilities);

            expect(test_val["USDT-0"].usdt_amount).equals(121.5);
            expect(test_val["USDT-0"].liabilities).equals(101.00415412823784);

            aimr_signers = await DataHub.calculateAIMRForUser(signers[0].address);
            ammr_signers = await DataHub.calculateAMMRForUser(signers[0].address);

            // console.log("aimr for user0", aimr_signers);
            // console.log("ammr for user0", ammr_signers);
        })

        it("Deposit SIGNER0 100 USDT FAILURE", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            CurrentExchange.setOrderBookProviderTest(signers[2]);
            CurrentExchange.setDaoWalletTest(signers[2]);

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 500_000000000000000000n
            let transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, deposit_amount);
            await transfer.wait();
            let approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), deposit_amount)

            deposit_amount = 1000_000000000000000000n;
            transfer = await USDT_TOKEN.transfer(signers[1].address, deposit_amount);
            await transfer.wait();
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 900_000000000000000000n, true);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(100000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(0n); // usdt total supply
            expect(asset_data[4][2]).equals(900000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer0 usdt amount
            expect(user_data[1]).equals(0n); // signer0 usdt liabilities
            expect(user_data[5]).equals(0n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(100000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(900000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            let borrow_amount = 800_000000000000000000n;
            await deposit_vault.connect(signers[0]).borrow(await USDT_TOKEN.getAddress(), borrow_amount);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(100000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(808084218559218558516n); // usdt total supply
            expect(asset_data[4][2]).equals(900000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(800000000000000000000n); // signer0 usdt amount
            expect(user_data[1]).equals(808084218559218558516n); // signer0 usdt liabilities
            expect(user_data[5]).equals(0n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(100000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(900000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            await expect(DataHub.connect(signers[0]).alterLendingPool(await USDT_TOKEN.getAddress(), 200_000000000000000000n, true)).revertedWith("this amount cannot be deposited into the lending pool cause of overflow");
        })

        it("Deposit SIGNER0 100 USDT SUCCESS", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            CurrentExchange.setOrderBookProviderTest(signers[2]);
            CurrentExchange.setDaoWalletTest(signers[2]);

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 500_000000000000000000n
            let transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, deposit_amount);
            await transfer.wait();
            let approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), deposit_amount)

            deposit_amount = 1000_000000000000000000n;
            transfer = await USDT_TOKEN.transfer(signers[1].address, deposit_amount);
            await transfer.wait();
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 900_000000000000000000n, true);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(100000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(0n); // usdt total supply
            expect(asset_data[4][2]).equals(900000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer0 usdt amount
            expect(user_data[1]).equals(0n); // signer0 usdt liabilities
            expect(user_data[5]).equals(0n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(100000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(900000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            let borrow_amount = 800_000000000000000000n;
            await deposit_vault.connect(signers[0]).borrow(await USDT_TOKEN.getAddress(), borrow_amount);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(100000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(808084218559218558516n); // usdt total supply
            expect(asset_data[4][2]).equals(900000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(800000000000000000000n); // signer0 usdt amount
            expect(user_data[1]).equals(808084218559218558516n); // signer0 usdt liabilities
            expect(user_data[5]).equals(0n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(100000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(900000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            DataHub.connect(signers[0]).alterLendingPool(await USDT_TOKEN.getAddress(), 100_000000000000000000n, true);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(100000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(808084218559218558516n); // usdt total supply
            expect(asset_data[4][2]).equals(900000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(700000000000000000000n); // signer0 usdt amount
            expect(user_data[1]).equals(808084218559218558516n); // signer0 usdt liabilities
            expect(user_data[5]).equals(100000000000000000000n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(100000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(900000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
        })

        it("Withdraw SIGNER1 200 From LendingPool FAILIURE", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            CurrentExchange.setOrderBookProviderTest(signers[2]);
            CurrentExchange.setDaoWalletTest(signers[2]);

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 500_000000000000000000n
            let transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, deposit_amount);
            await transfer.wait();
            let approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), deposit_amount)

            deposit_amount = 1000_000000000000000000n;
            transfer = await USDT_TOKEN.transfer(signers[1].address, deposit_amount);
            await transfer.wait();
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 900_000000000000000000n, true);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(100000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(0n); // usdt total supply
            expect(asset_data[4][2]).equals(900000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer0 usdt amount
            expect(user_data[1]).equals(0n); // signer0 usdt liabilities
            expect(user_data[5]).equals(0n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(100000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(900000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            let borrow_amount = 800_000000000000000000n;
            await deposit_vault.connect(signers[0]).borrow(await USDT_TOKEN.getAddress(), borrow_amount);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(100000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(808084218559218558516n); // usdt total supply
            expect(asset_data[4][2]).equals(900000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(800000000000000000000n); // signer0 usdt amount
            expect(user_data[1]).equals(808084218559218558516n); // signer0 usdt liabilities
            expect(user_data[5]).equals(0n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(100000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(900000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            let withdraw_amount = 200_000000000000000000n;
            await expect(DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), withdraw_amount, true)).revertedWith("this amount cannot be deposited into the lending pool cause of overflow");

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
        })

        it("Withdraw SIGNER1 100 From LendingPool SUCCESS", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            CurrentExchange.setOrderBookProviderTest(signers[2]);
            CurrentExchange.setDaoWalletTest(signers[2]);

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 500_000000000000000000n
            let transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, deposit_amount);
            await transfer.wait();
            let approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), deposit_amount)

            deposit_amount = 1000_000000000000000000n;
            transfer = await USDT_TOKEN.transfer(signers[1].address, deposit_amount);
            await transfer.wait();
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 900_000000000000000000n, true);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(100000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(0n); // usdt total supply
            expect(asset_data[4][2]).equals(900000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer0 usdt amount
            expect(user_data[1]).equals(0n); // signer0 usdt liabilities
            expect(user_data[5]).equals(0n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(100000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(900000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            let borrow_amount = 800_000000000000000000n;
            await deposit_vault.connect(signers[0]).borrow(await USDT_TOKEN.getAddress(), borrow_amount);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(100000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(808084218559218558516n); // usdt total supply
            expect(asset_data[4][2]).equals(900000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(800000000000000000000n); // signer0 usdt amount
            expect(user_data[1]).equals(808084218559218558516n); // signer0 usdt liabilities
            expect(user_data[5]).equals(0n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(100000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(900000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            let withdraw_amount = 96_000000000000000000n;
            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), withdraw_amount, true);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< USDT >>>>>>>>>>>>>>>>>>>>>");
            // console.log("usdt total supply", asset_data[4][0]);
            // console.log("usdt total borrowed amount", asset_data[4][1]);
            // console.log("usdt total lending pool supply", asset_data[4][2]);
            expect(asset_data[4][0]).equals(4000000000000000000n); // usdt total supply
            expect(asset_data[4][1]).equals(808084218559218558516n); // usdt total supply
            expect(asset_data[4][2]).equals(996000000000000000000n); // usdt total supply

            asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());

            // console.log("<<<<<<<<<<<<<<<<<< REXE >>>>>>>>>>>>>>>>>>>>>");
            // console.log("rexe total supply", asset_data[4][0]);
            // console.log("rexe total borrowed amount", asset_data[4][1]);
            // console.log("rexe total lending pool supply", asset_data[4][2]);

            expect(asset_data[4][0]).equals(500000000000000000000n); // rexe total supply
            expect(asset_data[4][1]).equals(0n); // rexe total supply
            expect(asset_data[4][2]).equals(0n); // rexe total supply
            
            // console.log("<<<<<<<<<<<<<<<<<< signer0 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            // console.log("signer0 usdt amount", user_data[0]);
            // console.log("signer0 usdt liabilities", user_data[1]);
            // console.log("signer0 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(800000000000000000000n); // signer0 usdt amount
            expect(user_data[1]).equals(808084218559218558516n); // signer0 usdt liabilities
            expect(user_data[5]).equals(0n); // signer0 usdt lending pool amount

            user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log("signer0 rexe amount", user_data[0]);
            // console.log("signer0 rexe liabilities", user_data[1]);
            // console.log("signer0 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(500000000000000000000n); // signer0 rexe amount
            expect(user_data[1]).equals(0n); // signer0 rexe liabilities
            expect(user_data[5]).equals(0n); // signer0 rexe lending pool amount

            // console.log("<<<<<<<<<<<<<<<<<< signer1 >>>>>>>>>>>>>>>>>>>>>");
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log("signer1 usdt amount", user_data[0]);
            // console.log("signer1 usdt liabilities", user_data[1]);
            // console.log("signer1 usdt lending pool amount", user_data[5]);

            expect(user_data[0]).equals(4000000000000000000n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(996000000000000000000n); // signer1 rexe lending pool amount

            user_data = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());
            // console.log("signer1 rexe amount", user_data[0]);
            // console.log("signer1 rexe liabilities", user_data[1]);
            // console.log("signer1 rexe lending pool amount", user_data[5]);

            expect(user_data[0]).equals(0n); // signer1 rexe amount
            expect(user_data[1]).equals(0n); // signer1 rexe liabilities
            expect(user_data[5]).equals(0n); // signer1 rexe lending pool amount

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
        })
    })

    it("Test Fee Trade", async function () {
        const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

        // Set USDT Address in Oracle
        // await Oracle.setUSDT(await USDT_TOKEN.getAddress());

        await DataHub.setTradeFee(await USDT_TOKEN.getAddress(), 0, 100000000000000000n);
        await DataHub.setTradeFee(await USDT_TOKEN.getAddress(), 1, 50000000000000000n);
        await DataHub.setTradeFee(await REXE_TOKEN.getAddress(), 0, 100000000000000000n);
        await DataHub.setTradeFee(await REXE_TOKEN.getAddress(), 1, 50000000000000000n);

        await CurrentExchange.setOrderBookProviderTest(signers[3].address);
        await CurrentExchange.setDaoWalletTest(signers[4].address);

        /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
        let deposit_amount = 500_000000000000000000n
        let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
        await approvalTx.wait();  // Wait for the transaction to be mined       
        await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount);

        deposit_amount = 800_000000000000000000n;
        let transfer = await USDT_TOKEN.transfer(signers[1].address, deposit_amount);
        await transfer.wait();
        approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
        await approvalTx.wait();
        await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount);

        // REXE Deposit
        deposit_amount = 300_000000000000000000n;
        transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, deposit_amount);
        await transfer.wait(); 
        approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
        await approvalTx.wait();  // Wait for the transaction to be mined
        await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

        deposit_amount = 400_000000000000000000n;
        approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
        await approvalTx.wait();  // Wait for the transaction to be mined
        await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

        const Data1 = {
            "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
            "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
            "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
            "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
            "taker_out_token_amount": 100_000000000000000000n, // 12000000000000000000 // 1250
            "maker_out_token_amount": 10_000000000000000000n, // 12000000000000000000  // 2500
        }
        const trade_sides = [[true], [false]];
        const pair = [Data1.taker_out_token, Data1.maker_out_token];
        const participants = [[Data1.takers], [Data1.makers]];
        const trade_amounts = [[Data1.taker_out_token_amount], [Data1.maker_out_token_amount]];

        // await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 200_000000000000000000n, true);

        const test_val1 = await createNewData(0, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);
        // console.log("signer0 usdt before trade", test_val1["USDT-0"].usdt_amount);
        // console.log("signer1 usdt before trade", test_val1["USDT-1"].usdt_amount);
        // console.log("signer0 rexe before trade", test_val1["REXE-0"].rexe_amount);
        // console.log("signer1 rexe before trade", test_val1["REXE-1"].rexe_amount);

        // console.log("signer0 usdt liability before trade", test_val1["USDT-0"].liabilities);
        // console.log("signer1 usdt liability before trade", test_val1["USDT-1"].liabilities);
        // console.log("signer0 rexe liability before trade", test_val1["REXE-0"].liabilities);
        // console.log("signer0 rexe liability before trade", test_val1["REXE-1"].liabilities);

        order_data = await DataHub.ReadUserData(signers[3].address, await REXE_TOKEN.getAddress());
        dao_data = await DataHub.ReadUserData(signers[4].address, await REXE_TOKEN.getAddress());
        // console.log("order rexe", Number(order_data[0].toString()) / 10 ** 18);
        // console.log("dao rexe", Number(dao_data[0].toString()) / 10 ** 18);

        asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
        user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

        const originTimestamp = await getTimeStamp(hre.ethers.provider);
       
        let allData = [];
        let scaledTimestamp;
        scaledTimestamp = originTimestamp + 1 * 3600;

        // await hre.ethers.provider.send("evm_setNextBlockTimestamp", [scaledTimestamp]);
        // await network.provider.send("evm_mine");
        setTimeStamp(hre.ethers.provider, network, scaledTimestamp);
        // await increaseTime()
        // console.log(`Loop ${i}: Set timestamp to ${scaledTimestamp}`);

        const masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
        await masscharges_usdt.wait(); // Wait for the transaction to be mined

        await CurrentExchange.SubmitOrder(pair, participants, trade_amounts, trade_sides);

        order_data = await DataHub.ReadUserData(signers[3].address, await REXE_TOKEN.getAddress());
        dao_data = await DataHub.ReadUserData(signers[4].address, await REXE_TOKEN.getAddress());

        // console.log('All data recorded successfully.');
        const test_val = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);
        // console.log("signer0 usdt after trade", test_val["USDT-0"].usdt_amount);
        // console.log("signer1 usdt after trade", test_val["USDT-1"].usdt_amount);
        // console.log("signer0 rexe after trade", test_val["REXE-0"].rexe_amount);
        // console.log("signer1 rexe after trade", test_val["REXE-1"].rexe_amount);

        // console.log("signer0 usdt liability after trade", test_val["USDT-0"].liabilities);
        // console.log("signer1 usdt liability after trade", test_val["USDT-1"].liabilities);
        // console.log("signer0 rexe liability after trade", test_val["REXE-0"].liabilities);
        // console.log("signer0 rexe liability after trade", test_val["REXE-1"].liabilities);

        order_data = await DataHub.ReadUserData(signers[3].address, await REXE_TOKEN.getAddress());
        dao_data = await DataHub.ReadUserData(signers[4].address, await REXE_TOKEN.getAddress());
        // console.log("order rexe", Number(order_data[0].toString()) / 10 ** 18);
        // console.log("dao rexe", Number(dao_data[0].toString()) / 10 ** 18);
    })
})
