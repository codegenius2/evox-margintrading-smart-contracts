const hre = require("hardhat");
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

         // console.log("Deploy_Utilities deployed to", await Deploy_Utilities.getAddress());

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

    describe("Trading Test", function () {
        it("Submit Order Function Test", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            // Set USDT Address in Oracle
            // await Oracle.setUSDT(await USDT_TOKEN.getAddress());

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 500_000000000000000000n
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            const transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait();        
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 1_000_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 510_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log(asset_data);
            // console.log(user_data);

            // asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());
            // user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log(asset_data);
            // console.log(user_data);

            expect(user_data[5]).equals(510_000000000000000000n); // lending pool amount
            expect(user_data[0]).equals(490_000000000000000000n); // usdt amount
            expect(asset_data[4][2]).equals(510_000000000000000000n); // lending pool supply

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            const Data = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 2_500_000000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides = [[true], [false]];
            const pair = [Data.taker_out_token, Data.maker_out_token];
            const participants = [[Data.takers], [Data.makers]];
            const trade_amounts = [[Data.taker_out_token_amount], [Data.maker_out_token_amount]];

            // const EX = new hre.ethers.Contract(await Deploy_Exchange.getAddress(), ExecutorAbi.abi, signers[0]);

            const originTimestamp = await getTimeStamp(hre.ethers.provider);
            // console.log('Origin timestamp:', originTimestamp);

            // let test = await _Interest.fetchCurrentRateIndex(await USDT_TOKEN.getAddress());
            // // console.log("USDT rate", test);

            ///////////////////////////////////////////////////// SUBMIT ORDER ////////////////////////////////////////////////////
            let scaledTimestamp;
            let allData = [];
            // for (let i = 0; i <= 174; i++) {
            for (let i = 0; i < 2; i++) {

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

                if (i == 1) {
                    await CurrentExchange.SubmitOrder(pair, participants, trade_amounts, trade_sides)
                }

                // Add the data object to the array
                // allData.push(await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN));
            }

            // // File path for the JSON file
            // const filePath = './output/data.json';

            // // Write all collected data to the JSON file
            // fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));

            // // console.log('All data recorded successfully.');

            const test_val = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);
            // console.log("test", test_val);
            // expect(Number(test_val["USDT-1"].earningrates) - Number(test_val["USDT-0"].liabilities)).greaterThan(Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
            // console.log("test_val", Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
            expect(test_val["USDT-0"].usdt_amount).equals(0);
            expect(test_val["USDT-0"].usdt_supply).equals(990);
            expect(test_val["USDT-0"].liabilities).equals(502.55405474155475);

            expect(test_val["USDT-1"].usdt_amount).equals(1490);
            expect(test_val["USDT-1"].usdt_supply).equals(990);
            expect(test_val["USDT-1"].liabilities).equals(0);

            expect(test_val["USDT-1"]["total-borrowed"]).equals(502.55405474155475);
        })

        it("Test margin trade that makes the users have assets with a greater value than the liabilities", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            let deposit_amount = 500_000000000000000000n;
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            const transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait();
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 1_000_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            const Data_First = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 2_500_000000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides_first = [[true], [false]];
            const pair_first = [Data_First.taker_out_token, Data_First.maker_out_token];
            const participants_first = [[Data_First.takers], [Data_First.makers]];
            const trade_amounts_first = [[Data_First.taker_out_token_amount], [Data_First.maker_out_token_amount]];

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 510_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            // console.log(asset_data);
            // console.log(user_data);

            // asset_data = await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress());
            // user_data = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());
            // console.log(asset_data);
            // console.log(user_data);

            expect(user_data[5]).equals(510_000000000000000000n); // lending pool amount
            expect(user_data[0]).equals(490_000000000000000000n); // usdt amount
            expect(asset_data[4][2]).equals(510_000000000000000000n); // lending pool supply

            const originTimestamp = await getTimeStamp(hre.ethers.provider);
            let scaledTimestamp = originTimestamp + 3600;
            setTimeStamp(hre.ethers.provider, network, scaledTimestamp);

            let masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
            await masscharges_usdt.wait(); // Wait for the transaction to be mined

            // let masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
            // await masscharges_rexe.wait(); // Wait for the transaction to be mined

            await CurrentExchange.SubmitOrder(pair_first, participants_first, trade_amounts_first, trade_sides_first);

            // let test = await _Interest.fetchCurrentRateIndex(await USDT_TOKEN.getAddress());
            // console.log("USDT rate", test);

            // scaledTimestamp = originTimestamp + 3600 * 2;

            // setTimeStamp(hre.ethers.provider, network, scaledTimestamp);
            // // // await increaseTime()
            // // console.log(`Set timestamp to ${scaledTimestamp}`);

            // // console.log("///////////////usdt address/////////////////", await USDT_TOKEN.getAddress());

            // masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
            // await masscharges_usdt.wait(); // Wait for the transaction to be mined

            // masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
            // await masscharges_rexe.wait(); // Wait for the transaction to be mined

            ////////////////////////////////////////// Token Info /////////////////////////////////////////////////
            // Get borrowed amount
            // let usdt_borrowed_amount = (await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress())).assetInfo[1];
            // console.log("usdt_borrowed_amount", usdt_borrowed_amount);

            // let usdt_totalSupply = (await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress())).assetInfo[0];
            // console.log("usdt_totalSupply", usdt_totalSupply);

            // let rexe_borrowed_amount = (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress())).assetInfo[1];
            // console.log("rexe_borrowed_amount", rexe_borrowed_amount);

            // let rexe_totalSupply = (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress())).assetInfo[0];
            // console.log("rexe_totalSupply", rexe_totalSupply);

            ////////////////////////////////////////// User Info /////////////////////////////////////////////////
            let userData_usdt_signer0 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer0 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer0_amount", userData_usdt_signer0[0]);
            // console.log("userData_rexe_signer0_amount", userData_rexe_signer0[0]);

            // console.log("userData_usdt_signer0_liabilities", userData_usdt_signer0[1]);
            // console.log("userData_rexe_signer0_liabilities", userData_rexe_signer0[1]);

            let userData_usdt_signer1 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer1 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer1_amount", userData_usdt_signer1[0]);
            // console.log("userData_rexe_signer1_amount", userData_rexe_signer1[0]);

            // console.log("userData_usdt_signer1_liabilities", userData_usdt_signer1[1]);
            // console.log("userData_rexe_signer1_liabilities", userData_rexe_signer1[1]);

            let collateral_value_singer0 = await DataHub.calculateCollateralValue(signers[0].address);
            let collateral_value_singer1 = await DataHub.calculateCollateralValue(signers[1].address);

            // console.log("collateral_value_singer0", collateral_value_singer0.toString());
            // console.log("collateral_value_singer1", collateral_value_singer1.toString());
            expect(collateral_value_singer0).equals(497445945258445258500n);
            expect(collateral_value_singer1).equals(249_0000000000000000000n);

            // let rexe_supply = (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress())).assetInfo[0];

            const Data_Second = {
                "taker_out_token": await REXE_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await USDT_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 500_000000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides_second = [[true], [false]];
            const pair_second = [Data_Second.taker_out_token, Data_Second.maker_out_token];
            const participants_second = [[Data_Second.takers], [Data_Second.makers]];
            const trade_amounts_second = [[Data_Second.taker_out_token_amount], [Data_Second.maker_out_token_amount]];

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 590_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(1100_000000000000000000n); // lending pool amount
            // expect(user_data[0]).equals(490_000000000000000000n); // usdt amount
            expect(asset_data[4][2]).equals(1100_000000000000000000n); // lending pool supply

            await CurrentExchange.SubmitOrder(pair_second, participants_second, trade_amounts_second, trade_sides_second);

            ////////////////////////////////////////// User Info /////////////////////////////////////////////////
            userData_usdt_signer0 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            userData_rexe_signer0 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer0_amount", userData_usdt_signer0[0]);
            // console.log("userData_rexe_signer0_amount", userData_rexe_signer0[0]);

            // console.log("userData_usdt_signer0_liabilities", userData_usdt_signer0[1]);
            // console.log("userData_rexe_signer0_liabilities", userData_rexe_signer0[1]);

            userData_usdt_signer1 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            userData_rexe_signer1 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer1_amount", userData_usdt_signer1[0]);
            // console.log("userData_rexe_signer1_amount", userData_rexe_signer1[0]);

            // console.log("userData_usdt_signer1_liabilities", userData_usdt_signer1[1]);
            // console.log("userData_rexe_signer1_liabilities", userData_rexe_signer1[1]);

            collateral_value_singer0 = await DataHub.calculateCollateralValue(signers[0].address);
            collateral_value_singer1 = await DataHub.calculateCollateralValue(signers[1].address);

            // console.log("collateral_value_singer0", collateral_value_singer0);
            // console.log("collateral_value_singer1", collateral_value_singer1);
            expect(Number(collateral_value_singer0)).equals(1.2474459452584454e+21);
            expect(collateral_value_singer1).greaterThan(400_000000000000000000n);

        })

        it("Test margin trade that makes the users have assets with a less value than the liabilities", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            let deposit_amount = 500_000000000000000000n;
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            const transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait();           
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be min
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 1_000_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            const Data_First = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 2_500_000000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides_first = [[true], [false]];
            const pair_first = [Data_First.taker_out_token, Data_First.maker_out_token];
            const participants_first = [[Data_First.takers], [Data_First.makers]];
            const trade_amounts_first = [[Data_First.taker_out_token_amount], [Data_First.maker_out_token_amount]];

            const originTimestamp = await getTimeStamp(hre.ethers.provider);
            // console.log('Origin timestamp:', originTimestamp);

            let scaledTimestamp = originTimestamp + 3600;
            setTimeStamp(hre.ethers.provider, network, scaledTimestamp);

            let masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
            await masscharges_usdt.wait(); // Wait for the transaction to be mined

            let masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
            await masscharges_rexe.wait(); // Wait for the transaction to be mined

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 510_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(510_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(510_000000000000000000n); // lending pool supply

            await CurrentExchange.SubmitOrder(pair_first, participants_first, trade_amounts_first, trade_sides_first);

            // let test = await _Interest.fetchCurrentRateIndex(await USDT_TOKEN.getAddress());
            // console.log("USDT rate", test);

            // scaledTimestamp = originTimestamp + 3600 * 2;

            // setTimeStamp(hre.ethers.provider, network, scaledTimestamp);
            // // // await increaseTime()
            // // console.log(`Set timestamp to ${scaledTimestamp}`);

            // // console.log("///////////////usdt address/////////////////", await USDT_TOKEN.getAddress());

            // masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
            // await masscharges_usdt.wait(); // Wait for the transaction to be mined

            // masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
            // await masscharges_rexe.wait(); // Wait for the transaction to be mined

            ////////////////////////////////////////// Token Info /////////////////////////////////////////////////
            // Get borrowed amount
            // let usdt_borrowed_amount = (await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress())).assetInfo[1];
            // console.log("usdt_borrowed_amount", usdt_borrowed_amount);

            // let usdt_totalSupply = (await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress())).assetInfo[0];
            // console.log("usdt_totalSupply", usdt_totalSupply);

            // let rexe_borrowed_amount = (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress())).assetInfo[1];
            // console.log("rexe_borrowed_amount", rexe_borrowed_amount);

            // let rexe_totalSupply = (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress())).assetInfo[0];
            // console.log("rexe_totalSupply", rexe_totalSupply);

            ////////////////////////////////////////// User Info /////////////////////////////////////////////////
            let userData_usdt_signer0 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer0 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer0_amount", userData_usdt_signer0[0]);
            // console.log("userData_rexe_signer0_amount", userData_rexe_signer0[0]);

            // console.log("userData_usdt_signer0_liabilities", userData_usdt_signer0[1]);
            // console.log("userData_rexe_signer0_liabilities", userData_rexe_signer0[1]);

            let userData_usdt_signer1 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer1 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer1_amount", userData_usdt_signer1[0]);
            // console.log("userData_rexe_signer1_amount", userData_rexe_signer1[0]);

            // console.log("userData_usdt_signer1_liabilities", userData_usdt_signer1[1]);
            // console.log("userData_rexe_signer1_liabilities", userData_rexe_signer1[1]);

            let collateral_value_singer0 = await DataHub.calculateCollateralValue(signers[0].address);
            let collateral_value_singer1 = await DataHub.calculateCollateralValue(signers[1].address);

            // console.log("collateral_value_singer0", collateral_value_singer0);
            // console.log("collateral_value_singer1", collateral_value_singer1);
            expect(collateral_value_singer0).equals(497_445945258445258500n);
            expect(collateral_value_singer1).equals(2490000000000000000000n);

            await DataHub.toggleAssetPriceTest(await REXE_TOKEN.getAddress(), 1);

            let collateral_value_singer0_withprice = await DataHub.calculateCollateralValue(signers[0].address);
            expect(collateral_value_singer0_withprice).equal(0);

            // let rexe_supply = (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress())).assetInfo[0];

            const Data_Second = {
                "taker_out_token": await REXE_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await USDT_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 500_000000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides_second = [[true], [false]];
            const pair_second = [Data_Second.taker_out_token, Data_Second.maker_out_token];
            const participants_second = [[Data_Second.takers], [Data_Second.makers]];
            const trade_amounts_second = [[Data_Second.taker_out_token_amount], [Data_Second.maker_out_token_amount]];

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 590_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(1100_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(1100_000000000000000000n); // lending pool supply

            await CurrentExchange.SubmitOrder(pair_second, participants_second, trade_amounts_second, trade_sides_second);

            ////////////////////////////////////////// User Info /////////////////////////////////////////////////
            userData_usdt_signer0 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            userData_rexe_signer0 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer0_amount", userData_usdt_signer0[0]);
            // console.log("userData_rexe_signer0_amount", userData_rexe_signer0[0]);

            // console.log("userData_usdt_signer0_liabilities", userData_usdt_signer0[1]);
            // console.log("userData_rexe_signer0_liabilities", userData_rexe_signer0[1]);

            userData_usdt_signer1 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            userData_rexe_signer1 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer1_amount", userData_usdt_signer1[0]);
            // console.log("userData_rexe_signer1_amount", userData_rexe_signer1[0]);

            // console.log("userData_usdt_signer1_liabilities", userData_usdt_signer1[1]);
            // console.log("userData_rexe_signer1_liabilities", userData_rexe_signer1[1]);

            collateral_value_singer0 = await DataHub.calculateCollateralValue(signers[0].address);
            collateral_value_singer1 = await DataHub.calculateCollateralValue(signers[1].address);

            // console.log("collateral_value_singer0", collateral_value_singer0);
            // console.log("collateral_value_singer1", collateral_value_singer1);
            expect(collateral_value_singer0).equals(1247445945258445258500n);
            expect(collateral_value_singer1).equals(2150000000000000000000n);

        })

        it("Test AIMR, AMMR during the deposit and trade", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN, DAI_TOKEN } = await loadFixture(deployandInitContracts);

            let transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait();

            let deposit_amount = 500_000000000000000000n;
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 2_000_000000000000000000n
            usdt = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await usdt.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            deposit_amount = 600_000000000000000000n
            transfer = await DAI_TOKEN.transfer(signers[1].address, deposit_amount);
            await transfer.wait();

            usdt = await DAI_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await usdt.wait();  // Wait for the transaction to be mined

            await deposit_vault.connect(signers[1]).deposit_token(await DAI_TOKEN.getAddress(), deposit_amount);

            const Data_First = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n,
                "maker_out_token_amount": 2_500_000000000000000000n
            }

            const trade_sides_first = [[true], [false]];
            const pair_first = [Data_First.taker_out_token, Data_First.maker_out_token];
            const participants_first = [[Data_First.takers], [Data_First.makers]];
            const trade_amounts_first = [[Data_First.taker_out_token_amount], [Data_First.maker_out_token_amount]];

            const originTimestamp = await getTimeStamp(hre.ethers.provider);

            let scaledTimestamp = originTimestamp + 3600;

            setTimeStamp(hre.ethers.provider, network, scaledTimestamp);

            let masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
            await masscharges_usdt.wait(); // Wait for the transaction to be mined

            let masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
            await masscharges_rexe.wait(); // Wait for the transaction to be mined

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 1900_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data_usdt = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data_usdt[5]).equals(1900_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(1900_000000000000000000n); // lending pool supply

            await CurrentExchange.SubmitOrder(pair_first, participants_first, trade_amounts_first, trade_sides_first);
            
            let aimr_signers = await DataHub.calculateAIMRForUser(signers[0].address);
            let ammr_signers = await DataHub.calculateAMMRForUser(signers[0].address);
            user_data_usdt = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            user_data_dai = await DataHub.ReadUserData(signers[0].address, await DAI_TOKEN.getAddress());

            expect(aimr_signers).equals(100500681218843812800n); // lending pool amount
            expect(ammr_signers).equals(50250340609421906400n); // lending pool supply

            // console.log("======================== First Trade ===========================");

            // console.log("user0 usdt liability", user_data_usdt[1]);
            // console.log("user0 dai liability", user_data_dai[1]);
            // console.log("user0 aimr for usdt after trade", aimr_signers);
            // console.log("user0 ammr for usdt after trade", ammr_signers);         
            
            const Data_Second = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000  // 2500
            }

            const trade_sides_second = [[true], [false]];
            const pair_second = [Data_Second.taker_out_token, Data_Second.maker_out_token];
            const participants_second = [[Data_Second.takers], [Data_Second.makers]];
            const trade_amounts_second = [[Data_Second.taker_out_token_amount], [Data_Second.maker_out_token_amount]];

            await CurrentExchange.SubmitOrder(pair_second, participants_second, trade_amounts_second, trade_sides_second);

            ////////////////////////////////////////// User Info /////////////////////////////////////////////////

            aimr_signers = await DataHub.calculateAIMRForUser(signers[0].address);
            ammr_signers = await DataHub.calculateAMMRForUser(signers[0].address);
            user_data_usdt = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            user_data_dai = await DataHub.ReadUserData(signers[0].address, await DAI_TOKEN.getAddress());

            expect(aimr_signers).equals(301510004522904448600n); // lending pool amount
            expect(ammr_signers).equals(150755002261452224300n); // lending pool supply
           
            // console.log("========================Second Trade===========================");
            // console.log("user0 usdt liability", user_data_usdt[1]);
            // console.log("user0 dae liability", user_data_dai[1]);
            // console.log("aimr for signers after trade", aimr_signers);
            // console.log("ammr for signers after trade", ammr_signers); 

            const Data_third = {
                "taker_out_token": await DAI_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await USDT_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 500_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 500_000000000000000000n, // 12000000000000000000  // 2500
            }

            const trade_sides_third = [[true], [false]];
            const pair_third = [Data_third.taker_out_token, Data_third.maker_out_token];
            const participants_third = [[Data_third.takers], [Data_third.makers]];
            const trade_amounts_third = [[Data_third.taker_out_token_amount], [Data_third.maker_out_token_amount]];

            await DataHub.connect(signers[1]).alterLendingPool(await DAI_TOKEN.getAddress(), 600_000000000000000000n, true);
          
            await CurrentExchange.SubmitOrder(pair_third, participants_third, trade_amounts_third, trade_sides_third);

            ////////////////////////////////////////// User Info /////////////////////////////////////////////////
            // imr_singers_usdt = await DataHub.calculateIMR(signers[0].address, await USDT_TOKEN.getAddress());
            // mmr_singers_usdt = await DataHub.calculateMMR(signers[0].address, await USDT_TOKEN.getAddress());

            aimr_signers = await DataHub.calculateAIMRForUser(signers[0].address);
            ammr_signers = await DataHub.calculateAMMRForUser(signers[0].address);
            user_data_usdt = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            user_data_dai = await DataHub.ReadUserData(signers[0].address, await DAI_TOKEN.getAddress());

            expect(aimr_signers).equals(454025108053632979100n); // lending pool amount
            expect(ammr_signers).equals(227012554026816489550n); // lending pool supply

            // console.log("======================== Third Trade ===========================");
            // console.log("user0 usdt liability", user_data_usdt[1]);
            // console.log("user0 dai liability", user_data_dai[1]);
            // console.log("aimr for signers after trade", aimr_signers);
            // console.log("ammr for signers after trade", ammr_signers);     
        })

        it("Test liablity Works while trading", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN, DAI_TOKEN } = await loadFixture(deployandInitContracts);

            const transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait();

            const transfer_dai = await DAI_TOKEN.connect(signers[0]).transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer_dai.wait();

            let deposit_amount = 500_000000000000000000n;
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 1_000_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            const Data_First = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n,
                "maker_out_token_amount": 2_500_000000000000000000n
            }

            const trade_sides_first = [[true], [false]];
            const pair_first = [Data_First.taker_out_token, Data_First.maker_out_token];
            const participants_first = [[Data_First.takers], [Data_First.makers]];
            const trade_amounts_first = [[Data_First.taker_out_token_amount], [Data_First.maker_out_token_amount]];

            const originTimestamp = await getTimeStamp(hre.ethers.provider);

            let scaledTimestamp = originTimestamp + 3600;

            setTimeStamp(hre.ethers.provider, network, scaledTimestamp);

            let masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
            await masscharges_usdt.wait(); // Wait for the transaction to be mined

            let masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
            await masscharges_rexe.wait(); // Wait for the transaction to be mined

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 510_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(510_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(510_000000000000000000n); // lending pool supply

            await CurrentExchange.SubmitOrder(pair_first, participants_first, trade_amounts_first, trade_sides_first);
            
            // Get borrowed amount
            let userData_usdt_signer00 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer00 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer0_amount", userData_usdt_signer00[0]);
            // console.log("userData_rexe_signer0_amount", userData_rexe_signer00[0]);
            // console.log("userData_usdt_signer0_liabilities", userData_usdt_signer00[1]);
            // console.log("userData_rexe_signer0_liabilities", userData_rexe_signer00[1]);

            let userData_usdt_signer11 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer11 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer1_amount", userData_usdt_signer11[0]);
            // console.log("userData_rexe_signer1_amount", userData_rexe_signer11[0]);
            // console.log("userData_usdt_signer1_liabilities", userData_usdt_signer11[1]);
            // console.log("userData_rexe_signer1_liabilities", userData_rexe_signer11[1]);
            expect(userData_usdt_signer00[0]).equals(0); // Amount
            expect(userData_usdt_signer00[1]).equals(502_554054741554741500n); // Liability
            expect(userData_rexe_signer00[0]).equals(2500000000000000000000n); // Amount
            expect(userData_rexe_signer00[1]).equals(0); // Liability

            expect(userData_usdt_signer11[0]).equals(1490000000000000000000n); // Amount
            expect(userData_usdt_signer11[1]).equals(0); // Liability
            expect(userData_rexe_signer11[0]).equals(2500000000000000000000n); // Amount
            expect(userData_rexe_signer11[1]).equals(0); // Liability

            const Data_Second = {
                "taker_out_token": await REXE_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await USDT_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 500_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 500_000000000000000000n, // 12000000000000000000  // 2500
            }

            const trade_sides_second = [[true], [false]];
            const pair_second = [Data_Second.taker_out_token, Data_Second.maker_out_token];
            const participants_second = [[Data_Second.takers], [Data_Second.makers]];
            const trade_amounts_second = [[Data_Second.taker_out_token_amount], [Data_Second.maker_out_token_amount]];
            await CurrentExchange.SubmitOrder(pair_second, participants_second, trade_amounts_second, trade_sides_second);

            ////////////////////////////////////////// User Info /////////////////////////////////////////////////
            let userData_usdt2_signer0 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            let userData_rexe2_signer0 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt2_signer0 amount", userData_usdt2_signer0[0]);
            // console.log("userData_rexe2_signer0 amount", userData_rexe2_signer0[0]);
            // console.log("userData_usdt2_signer0 liabilities", userData_usdt2_signer0[1]);
            // console.log("userData_rexe2_signer0 liabilities", userData_rexe2_signer0[1]);

            let userData_usdt2_signer1 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            let userData_rexe2_signer1 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt2_signer1 amount", userData_usdt2_signer1[0]);
            // console.log("userData_rexe2_signer1 amount", userData_rexe2_signer1[0]);
            // console.log("userData_usdt2_signer1 liabilities", userData_usdt2_signer1[1]);
            // console.log("userData_rexe2_signer1 liabilities", userData_rexe2_signer1[1]);

            expect(userData_usdt2_signer0[0]).equals(0); // Amount
            expect(userData_usdt2_signer0[1]).equals(255_4054741554741500n); // Liability
            expect(userData_rexe2_signer0[0]).equals(2000000000000000000000n); // Amount
            expect(userData_rexe2_signer0[1]).equals(0n); // Liability

            expect(userData_usdt2_signer1[0]).equals(990000000000000000000n); // Amount
            expect(userData_usdt2_signer1[1]).equals(0n); // Liability
            expect(userData_rexe2_signer1[0]).equals(3000000000000000000000n); // Amount
            expect(userData_rexe2_signer1[1]).equals(0n); // Liability

        })

        it("Test liablity Works while depositing", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN, DAI_TOKEN } = await loadFixture(deployandInitContracts);

            const transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait();

            const transfer_dai = await DAI_TOKEN.connect(signers[0]).transfer(signers[1].address, 20_000_000000000);
            await transfer_dai.wait();

            let deposit_amount = 500_000000000000000000n;
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 1_000_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            const Data_First = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n,
                "maker_out_token_amount": 2_500_000000000000000000n
            }

            const trade_sides_first = [[true], [false]];
            const pair_first = [Data_First.taker_out_token, Data_First.maker_out_token];
            const participants_first = [[Data_First.takers], [Data_First.makers]];
            const trade_amounts_first = [[Data_First.taker_out_token_amount], [Data_First.maker_out_token_amount]];

            const originTimestamp = await getTimeStamp(hre.ethers.provider);

            let scaledTimestamp = originTimestamp + 3600;

            setTimeStamp(hre.ethers.provider, network, scaledTimestamp);

            let masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
            await masscharges_usdt.wait(); // Wait for the transaction to be mined

            let masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
            await masscharges_rexe.wait(); // Wait for the transaction to be mined

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 510_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(510_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(510_000000000000000000n); // lending pool supply

            await CurrentExchange.SubmitOrder(pair_first, participants_first, trade_amounts_first, trade_sides_first);
            
            // Get borrowed amount
            let userData_usdt_signer00 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer00 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer0_amount", userData_usdt_signer00[0]);
            // console.log("userData_rexe_signer0_amount", userData_rexe_signer00[0]);
            // console.log("userData_usdt_signer0_liabilities", userData_usdt_signer00[1]);
            // console.log("userData_rexe_signer0_liabilities", userData_rexe_signer00[1]);

            let userData_usdt_signer11 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer11 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer1_amount", userData_usdt_signer11[0]);
            // console.log("userData_rexe_signer1_amount", userData_rexe_signer11[0]);
            // console.log("userData_usdt_signer1_liabilities", userData_usdt_signer11[1]);
            // console.log("userData_rexe_signer1_liabilities", userData_rexe_signer11[1]);
            expect(userData_usdt_signer00[0]).equals(0); // Amount
            expect(userData_usdt_signer00[1]).equals(502_554054741554741500n); // Liability
            expect(userData_rexe_signer00[0]).equals(2500000000000000000000n); // Amount
            expect(userData_rexe_signer00[1]).equals(0); // Liability

            expect(userData_usdt_signer11[0]).equals(1490000000000000000000n); // Amount
            expect(userData_usdt_signer11[1]).equals(0); // Liability
            expect(userData_rexe_signer11[0]).equals(2500000000000000000000n); // Amount
            expect(userData_rexe_signer11[1]).equals(0); // Liability

            setTimeStamp(hre.ethers.provider, network, scaledTimestamp);

            // USDT Deposit
            deposit_amount = 500_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount);

            userData_usdt_signer00 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            userData_rexe_signer00 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer0_amount", userData_usdt_signer00[0]);
            // console.log("userData_rexe_signer0_amount", userData_rexe_signer00[0]);
            // console.log("userData_usdt_signer0_liabilities", userData_usdt_signer00[1]);
            // console.log("userData_rexe_signer0_liabilities", userData_rexe_signer00[1]);

            userData_usdt_signer11 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            userData_rexe_signer11 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer1_amount", userData_usdt_signer11[0]);
            // console.log("userData_rexe_signer1_amount", userData_rexe_signer11[0]);
            // console.log("userData_usdt_signer1_liabilities", userData_usdt_signer11[1]);
            // console.log("userData_rexe_signer1_liabilities", userData_rexe_signer11[1]);

            // expect(userData_usdt_signer00[0]).equals(0); // Amount
            // expect(userData_usdt_signer00[1]).equals(753759321036106749750n); // Liability
            // expect(userData_rexe_signer00[0]).equals(2500000000000000000000n); // Amount
            // expect(userData_rexe_signer00[1]).equals(0); // Liability

            // expect(userData_usdt_signer11[0]).equals(2250000000000000000000n); // Amount
            // expect(userData_usdt_signer11[1]).equals(0); // Liability
            // expect(userData_rexe_signer11[0]).equals(2500000000000000000000n); // Amount
            // expect(userData_rexe_signer11[1]).equals(0); // Liability

        })

        it("Test Display Collateral Negative Value", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN, DAI_TOKEN } = await loadFixture(deployandInitContracts);

            const transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait();

            const transfer_dai = await DAI_TOKEN.connect(signers[0]).transfer(signers[1].address, 20_000000000000000000n);
            await transfer_dai.wait();

            let deposit_amount = 500_000000000000000000n;
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 1_000_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount);

            const Data_First = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n,
                "maker_out_token_amount": 2_500_000000000000000000n
            }

            const trade_sides_first = [[true], [false]];
            const pair_first = [Data_First.taker_out_token, Data_First.maker_out_token];
            const participants_first = [[Data_First.takers], [Data_First.makers]];
            const trade_amounts_first = [[Data_First.taker_out_token_amount], [Data_First.maker_out_token_amount]];

            const originTimestamp = await getTimeStamp(hre.ethers.provider);

            let scaledTimestamp = originTimestamp + 3600;

            setTimeStamp(hre.ethers.provider, network, scaledTimestamp);

            let masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
            await masscharges_usdt.wait(); // Wait for the transaction to be mined

            let masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
            await masscharges_rexe.wait(); // Wait for the transaction to be mined

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 510_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(510_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(510_000000000000000000n); // lending pool supply

            await CurrentExchange.SubmitOrder(pair_first, participants_first, trade_amounts_first, trade_sides_first);
            
            // Get borrowed amount
            let userData_usdt_signer00 = await DataHub.ReadUserData(signers[0].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer00 = await DataHub.ReadUserData(signers[0].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer0_amount", userData_usdt_signer00[0]);
            // console.log("userData_rexe_signer0_amount", userData_rexe_signer00[0]);
            // console.log("userData_usdt_signer0_liabilities", userData_usdt_signer00[1]);
            // console.log("userData_rexe_signer0_liabilities", userData_rexe_signer00[1]);

            let userData_usdt_signer11 = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());
            let userData_rexe_signer11 = await DataHub.ReadUserData(signers[1].address, await REXE_TOKEN.getAddress());

            // console.log("userData_usdt_signer1_amount", userData_usdt_signer11[0]);
            // console.log("userData_rexe_signer1_amount", userData_rexe_signer11[0]);
            // console.log("userData_usdt_signer1_liabilities", userData_usdt_signer11[1]);
            // console.log("userData_rexe_signer1_liabilities", userData_rexe_signer11[1]);
            expect(userData_usdt_signer00[0]).equals(0); // Amount
            expect(userData_usdt_signer00[1]).equals(502_554054741554741500n); // Liability
            expect(userData_rexe_signer00[0]).equals(2500000000000000000000n); // Amount
            expect(userData_rexe_signer00[1]).equals(0); // Liability

            expect(userData_usdt_signer11[0]).equals(1490000000000000000000n); // Amount
            expect(userData_usdt_signer11[1]).equals(0); // Liability
            expect(userData_rexe_signer11[0]).equals(2500000000000000000000n); // Amount
            expect(userData_rexe_signer11[1]).equals(0); // Liability

            await DataHub.toggleAssetPriceTest(await REXE_TOKEN.getAddress(), 100000000n);

            await DataHub.alterUserNegativeValueTest(signers[0].address);

            // console.log("singer[0] negative amount", await DataHub.userdata_negative_value(signers[0].address));
            expect((await DataHub.userdata(signers[0].address)).negative_value).equals(502_554054491554741500n);

            // expect(userData_usdt2_signer1[0]).equals(1750000000000000000000n); // Amount
            // expect(userData_usdt2_signer1[1]).equals(0n); // Liability
            // expect(userData_rexe2_signer1[0]).equals(3000000000000000000000n); // Amount
            // expect(userData_rexe2_signer1[1]).equals(0n); // Liability

        })

        it("Test underflows on totalBorrowAmount from paying back liabilities - 1", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            // Set USDT Address in Oracle
            // await Oracle.setUSDT(await USDT_TOKEN.getAddress());

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 500_000000000000000000n
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            const transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait();        
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 1_000_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            const Data = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 2_500_000000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides = [[true], [false]];
            const pair = [Data.taker_out_token, Data.maker_out_token];
            const participants = [[Data.takers], [Data.makers]];
            const trade_amounts = [[Data.taker_out_token_amount], [Data.maker_out_token_amount]];

            // const EX = new hre.ethers.Contract(await Deploy_Exchange.getAddress(), ExecutorAbi.abi, signers[0]);

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 510_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(510_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(510_000000000000000000n); // lending pool supply

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

                if (i == 1 || i == 40) {
                    await CurrentExchange.SubmitOrder(pair, participants, trade_amounts, trade_sides)
                }
                // Add the data object to the array
                if (i == 3) {
                    // USDT Deposit
                    deposit_amount = 1_000_000000000000000000n
                    approvalTx = await USDT_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
                    await approvalTx.wait();  // Wait for the transaction to be mined
                    await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)
                }
                // allData.push(await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN));
            }

            // File path for the JSON file
            // const filePath = './output/data_liability.json';

            // Write all collected data to the JSON file
            // fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
            // console.log('All data recorded successfully.');

            const test_val = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);
            expect(Number(test_val["USDT-0"]["total-borrowed"])).greaterThan(Number(test_val["USDT-0"].liabilities));
            // console.log("test_val", test_val);
        })

        it("Test underflows on totalBorrowAmount from paying back liabilities - 2", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            // Set USDT Address in Oracle
            // await Oracle.setUSDT(await USDT_TOKEN.getAddress());

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 500_000000000000000000n
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            let transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait(); 

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 1_600_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            transfer = await USDT_TOKEN.transfer(signers[2].address, 500_000000000000000000n);
            await transfer.wait(); 

            // USDT Deposit
            deposit_amount = 500_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[2]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            const Data1 = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 500_000000000000000000n, // 12000000000000000000  // 2500
            }

            const Data2 = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[2].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 500_000000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides = [[true, true], [false, false]];
            const pair = [Data1.taker_out_token, Data1.maker_out_token];
            const participants = [[Data1.takers, Data2.takers], [Data1.makers, Data2.makers]];
            const trade_amounts = [[Data1.taker_out_token_amount, Data2.taker_out_token_amount], [Data1.maker_out_token_amount, Data2.maker_out_token_amount]];

            // const EX = new hre.ethers.Contract(await Deploy_Exchange.getAddress(), ExecutorAbi.abi, signers[0]);

            const originTimestamp = await getTimeStamp(hre.ethers.provider);
            // console.log('Origin timestamp:', originTimestamp);

            // let test = await _Interest.fetchCurrentRateIndex(await USDT_TOKEN.getAddress());
            // console.log("USDT rate", test);

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 1600_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(1600_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(1600_000000000000000000n); // lending pool supply

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

                if (i == 1 || i == 40) {
                    await CurrentExchange.SubmitOrder(pair, participants, trade_amounts, trade_sides)
                }
                // Add the data object to the array
                if (i == 3) {
                    // USDT Deposit
                    deposit_amount = 1_000_000000000000000000n
                    approvalTx = await USDT_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
                    await approvalTx.wait();  // Wait for the transaction to be mined
                    await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

                    transfer = await USDT_TOKEN.transfer(signers[2].address, 1_000_000000000000000000n);
                    await transfer.wait(); 

                    deposit_amount = 1_000_000000000000000000n
                    approvalTx = await USDT_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
                    await approvalTx.wait();  // Wait for the transaction to be mined
                    await deposit_vault.connect(signers[2]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)
                }
                // allData.push(await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN));
            }

            // // File path for the JSON file
            // const filePath = './output/data_liability.json';

            // // Write all collected data to the JSON file
            // fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
            // // console.log('All data recorded successfully.');

            const test_val = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);
            expect(Number(test_val["USDT-0"]["total-borrowed"])).greaterThan(Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
            // console.log("test_val", Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
        })

        it("Test underflows on totalBorrowAmount from paying back liabilities - 3", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            // Set USDT Address in Oracle
            // await Oracle.setUSDT(await USDT_TOKEN.getAddress());

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////
            let deposit_amount = 500_000000000000000000n
            let approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            let transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait(); 

            // REXE Deposit
            deposit_amount = 5_000_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // USDT Deposit
            deposit_amount = 1_600_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            transfer = await USDT_TOKEN.transfer(signers[2].address, 500_000000000000000000n);
            await transfer.wait(); 

            // USDT Deposit
            deposit_amount = 500_000000000000000000n
            approvalTx = await USDT_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[2]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // console.log("usdt address", await USDT_TOKEN.getAddress());
            // console.log("rexe address", await REXE_TOKEN.getAddress());
            // console.log("singer0", signers[0].address);
            // console.log("singer1", signers[1].address);
            // console.log("signer2", signers[2].address);

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            const Data1 = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 500_000000000000000000n, // 12000000000000000000  // 2500
            }

            const Data2 = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[2].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[1].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1000_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 500_000000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides = [[true], [false]];
            const pair = [Data1.taker_out_token, Data1.maker_out_token];
            const participants_1 = [[Data1.takers], [Data1.makers]];
            const participants_2 = [[Data2.takers], [Data2.makers]];
            const trade_amounts = [[Data1.taker_out_token_amount], [Data1.maker_out_token_amount]];

            await DataHub.connect(signers[1]).alterLendingPool(await USDT_TOKEN.getAddress(), 1600_000000000000000000n, true);

            asset_data = await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress());
            user_data = await DataHub.ReadUserData(signers[1].address, await USDT_TOKEN.getAddress());

            expect(user_data[5]).equals(1600_000000000000000000n); // lending pool amount
            expect(asset_data[4][2]).equals(1600_000000000000000000n); // lending pool supply

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

                if (i == 1) {
                    await CurrentExchange.SubmitOrder(pair, participants_1, trade_amounts, trade_sides)
                }

                if (i == 10) {
                    await CurrentExchange.SubmitOrder(pair, participants_2, trade_amounts, trade_sides)
                }
                // Add the data object to the array
                // if (i == 3) {
                //     // USDT Deposit
                //     deposit_amount = 1_000_000000000000000000n
                //     approvalTx = await USDT_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
                //     await approvalTx.wait();  // Wait for the transaction to be mined
                //     await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

                //     transfer = await USDT_TOKEN.transfer(signers[2].address, 1_000_000000000000000000n);
                //     await transfer.wait();
                // }

                // if (i == 27 ) {
                //     deposit_amount = 1_000_000000000000000000n
                //     approvalTx = await USDT_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
                //     await approvalTx.wait();  // Wait for the transaction to be mined
                //     await deposit_vault.connect(signers[2]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)
                // }
                // allData.push(await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN));
            }

            // File path for the JSON file
            // const filePath = './output/data_liability.json';

            // Write all collected data to the JSON file
            // fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
            // console.log('All data recorded successfully.');

            const test_val = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);
            expect(Number(test_val["USDT-0"]["total-borrowed"])).greaterThan(Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
            // console.log("test_val", Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
        })

        it("Test regular trade", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            // Set USDT Address in Oracle
            // await Oracle.setUSDT(await USDT_TOKEN.getAddress());

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////

            let transfer = await USDT_TOKEN.transfer(signers[2].address, 100_000000000000000000n);
            await transfer.wait(); 

            let deposit_amount = 100_000000000000000000n
            let approvalTx = await USDT_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[2]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, 100_000000000000000000n);
            await transfer.wait(); 

            transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[2].address, 100_000000000000000000n);
            await transfer.wait(); 

            // REXE Deposit
            deposit_amount = 100_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // REXE Deposit
            deposit_amount = 100_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[2]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            const Data1 = {
                "taker_out_token": await REXE_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await USDT_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[2].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 4_710000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides = [[true], [false]];
            const pair = [Data1.taker_out_token, Data1.maker_out_token];
            const participants_1 = [[Data1.takers], [Data1.makers]];
            const trade_amounts = [[Data1.taker_out_token_amount], [Data1.maker_out_token_amount]];

            await CurrentExchange.SubmitOrder(pair, participants_1, trade_amounts, trade_sides)

            // const EX = new hre.ethers.Contract(await Deploy_Exchange.getAddress(), ExecutorAbi.abi, signers[0]);

            const originTimestamp = await getTimeStamp(hre.ethers.provider);

            let scaledTimestamp = originTimestamp + 3600;

            // await hre.ethers.provider.send("evm_setNextBlockTimestamp", [scaledTimestamp]);
            // await network.provider.send("evm_mine");
            setTimeStamp(hre.ethers.provider, network, scaledTimestamp);
            // await increaseTime()
            // console.log(`Loop ${i}: Set timestamp to ${scaledTimestamp}`);

            const masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
            await masscharges_usdt.wait(); // Wait for the transaction to be mined

            const test_val = await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);

            // const filePath = './output/data_regular_trade.json';

            // // Write all collected data to the JSON file
            // fs.writeFileSync(filePath, JSON.stringify(test_val, null, 2));
            // console.log('All data recorded successfully.');
            expect(Number(test_val["USDT-0"]["total-borrowed"])).equals(Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
            // console.log("test_val", Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
        })

        it("Test 0 trade", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            // Set USDT Address in Oracle
            // await Oracle.setUSDT(await USDT_TOKEN.getAddress());

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////

            let transfer = await USDT_TOKEN.transfer(signers[2].address, 100_000000000000000000n);
            await transfer.wait(); 

            let deposit_amount = 100_000000000000000000n
            let approvalTx = await USDT_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[2]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, 100_000000000000000000n);
            await transfer.wait(); 

            transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[2].address, 100_000000000000000000n);
            await transfer.wait(); 

            // REXE Deposit
            deposit_amount = 100_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // REXE Deposit
            deposit_amount = 100_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[2]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            const Data1 = {
                "taker_out_token": await REXE_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await USDT_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[2].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 0, // 12000000000000000000 // 1250
                "maker_out_token_amount": 0, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides = [[true], [false]];
            const pair = [Data1.taker_out_token, Data1.maker_out_token];
            const participants_1 = [[Data1.takers], [Data1.makers]];
            const trade_amounts = [[Data1.taker_out_token_amount], [Data1.maker_out_token_amount]];

            await expect(CurrentExchange.SubmitOrder(pair, participants_1, trade_amounts, trade_sides)).to.be.revertedWith("Never 0 trades");
        })

        it("Test 50 ", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);
            let deposit_amount = 1_000_000000000000000000n;

            let transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, deposit_amount);
            await transfer.wait();

            transfer = await USDT_TOKEN.connect(signers[0]).transfer(signers[1].address, deposit_amount);
            await transfer.wait();

            let approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined

            approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined        

            await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)
            await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // // USDT Deposit
            // deposit_amount = 1_000_000000000000000000n
            // approvalTx = await USDT_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            // await approvalTx.wait();  // Wait for the transaction to be mined
            // await deposit_vault.connect(signers[1]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            const Data = {
                "taker_out_token": await USDT_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await REXE_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[1].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[0].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 4_710000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 1_000000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides = [[true], [false]];
            const pair = [Data.taker_out_token, Data.maker_out_token];
            const participants = [[Data.takers], [Data.makers]];
            const trade_amounts = [[Data.taker_out_token_amount], [Data.maker_out_token_amount]];

            // const EX = new hre.ethers.Contract(await Deploy_Exchange.getAddress(), ExecutorAbi.abi, signers[0]);

            const originTimestamp = await getTimeStamp(hre.ethers.provider);
            // console.log('Origin timestamp:', originTimestamp);

            // let test = await _Interest.fetchCurrentRateIndex(await USDT_TOKEN.getAddress());
            // // console.log("USDT rate", test);

            ///////////////////////////////////////////////////// SUBMIT ORDER ////////////////////////////////////////////////////

            let allData = [];
            // for (let i = 0; i <= 174; i++) {
            for (let i = 0; i < 50; i++) {

                // console.log("////////////////////////////////////////////////////////// LOOP " + i + " /////////////////////////////////////////////////////////////");
                const scaledTimestamp = originTimestamp + i * 10;

                // await hre.ethers.provider.send("evm_setNextBlockTimestamp", [scaledTimestamp]);
                // await network.provider.send("evm_mine");
                setTimeStamp(hre.ethers.provider, network, scaledTimestamp);
                // await increaseTime()
                // console.log(`Loop ${i}: Set timestamp to ${scaledTimestamp}`);

                const masscharges_usdt = await _Interest.chargeMassinterest(await USDT_TOKEN.getAddress()); // increase borrow amount
                await masscharges_usdt.wait(); // Wait for the transaction to be mined

                const masscharges_rexe = await _Interest.chargeMassinterest(await REXE_TOKEN.getAddress()); // increase borrow amount
                await masscharges_rexe.wait(); // Wait for the transaction to be mined

                // console.log("usdt price before trade", (await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress()))[3]);
                // console.log("rexe price before trade", (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress()))[3]);

                await CurrentExchange.SubmitOrder(pair, participants, trade_amounts, trade_sides)

                // console.log("usdt price after trade", (await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress()))[3]);
                // console.log("rexe price before trade", (await DataHub.returnAssetLogs(await REXE_TOKEN.getAddress()))[3]);

                // Add the data object to the array
                allData.push(await createNewData(scaledTimestamp, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN));
            }

            // File path for the JSON file
            const filePath = './output/data_50_trade.json';

            // Write all collected data to the JSON file
            fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));

            const test_val = await createNewData(0, signers, DataHub, _Interest, Utils, USDT_TOKEN, REXE_TOKEN);

            // const filePath = './output/data_regular_trade.json';

            // // Write all collected data to the JSON file
            // fs.writeFileSync(filePath, JSON.stringify(test_val, null, 2));
            // console.log('All data recorded successfully.');
            // expect(Number(test_val["USDT-0"].usdt_amount)).equals(0);
            // expect(Number(test_val["USDT-1"].usdt_amount)).equals(5000);
            // expect(Number(test_val["REXE-0"].rexe_amount)).equals(5000);
            // expect(Number(test_val["REXE-1"].rexe_amount)).equals(0);

            // console.log('All data recorded successfully.');
        })

        it("Test withdraw token with 0", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);

            // Set USDT Address in Oracle
            // await Oracle.setUSDT(await USDT_TOKEN.getAddress());

            /////////////////////////////// DEPOSIT TOKENS //////////////////////////////////

            let transfer = await USDT_TOKEN.transfer(signers[2].address, 100_000000000000000000n);
            await transfer.wait(); 

            let deposit_amount = 100_000000000000000000n
            let approvalTx = await USDT_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined       
            await deposit_vault.connect(signers[2]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[0].address, 100_000000000000000000n);
            await transfer.wait(); 

            transfer = await REXE_TOKEN.connect(signers[1]).transfer(signers[2].address, 100_000000000000000000n);
            await transfer.wait(); 

            // REXE Deposit
            deposit_amount = 100_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[0]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            // REXE Deposit
            deposit_amount = 100_000000000000000000n;
            approvalTx = await REXE_TOKEN.connect(signers[2]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[2]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount));

            ///////////////////////////////////////////////////////////////////////////////////////////////////////
            ///////////////////////////////////////////////////////////////////////////////////////////////////////

            const Data1 = {
                "taker_out_token": await REXE_TOKEN.getAddress(),  //0x0165878A594ca255338adfa4d48449f69242Eb8F 
                "maker_out_token": await USDT_TOKEN.getAddress(), //0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
                "takers": signers[0].address, //0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266
                "makers": signers[2].address, //0x70997970c51812dc3a010c7d01b50e0d17dc79c8
                "taker_out_token_amount": 1_000000000000000000n, // 12000000000000000000 // 1250
                "maker_out_token_amount": 4_710000000000000000n, // 12000000000000000000  // 2500
            }
            /// 
            const trade_sides = [[true], [false]];
            const pair = [Data1.taker_out_token, Data1.maker_out_token];
            const participants_1 = [[Data1.takers], [Data1.makers]];
            const trade_amounts = [[Data1.taker_out_token_amount], [Data1.maker_out_token_amount]];

            await CurrentExchange.SubmitOrder(pair, participants_1, trade_amounts, trade_sides)

            await deposit_vault.withdraw_token(await REXE_TOKEN.getAddress(), 0);

            // expect(Number(test_val["USDT-0"]["total-borrowed"])).greaterThan(Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
            // console.log("test_val", Number(test_val["USDT-0"].liabilities) + Number(test_val["USDT-2"].liabilities));
        })
    })

    describe("Functions Simple Test", function () {
        it("updateInterestIndex function test", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);
            // let temp;
            for (let index = 0; index < 32; index++) {
                await _Interest.updateInterestIndexTest(await USDT_TOKEN.getAddress(), index + 1, index + 1);
            }
            // for (let index = 0; index < 32; index++) {
            //     temp = await _Interest.fetchTimeScaledRateIndex(0, await USDT_TOKEN.getAddress(), index + 1);
            //     console.log("data", temp.interestRate);
            // }
            // console.log("=======================1=============================");
            // for(let index = 0; index < 16; index++) {
            //     temp = await _Interest.fetchTimeScaledRateIndex(1, await USDT_TOKEN.getAddress(), index + 1);
            //     console.log("data", temp.interestRate);
            // }
            // console.log("=======================2=============================");
            // for(let index = 0; index < 8; index++) {
            //     temp = await _Interest.fetchTimeScaledRateIndex(2, await USDT_TOKEN.getAddress(), index + 1);
            //     console.log("data", temp.interestRate);
            // }
            // console.log("=======================3=============================");
            // for(let index = 0; index < 2; index++) {
            //     temp = await _Interest.fetchTimeScaledRateIndex(3, await USDT_TOKEN.getAddress(), index + 1);
            //     console.log("data", temp.interestRate);
            // }
            // console.log("=======================4=============================");
            // for(let index = 0; index < 1; index++) {
            //     temp = await _Interest.fetchTimeScaledRateIndex(4, await USDT_TOKEN.getAddress(), index + 1);
            //     console.log("data", temp.interestRate);
            // }
            let check_interest;
            check_interest = await _Interest.fetchTimeScaledRateIndex(0, await USDT_TOKEN.getAddress(), 32);
            expect(check_interest.interestRate).equal(31);
            check_interest = await _Interest.fetchTimeScaledRateIndex(1, await USDT_TOKEN.getAddress(), 1);
            expect(check_interest.interestRate).equal(2500000000000000n);
            check_interest = await _Interest.fetchTimeScaledRateIndex(2, await USDT_TOKEN.getAddress(), 1);
            expect(check_interest.interestRate).equal(1250000000000001n);
            check_interest = await _Interest.fetchTimeScaledRateIndex(3, await USDT_TOKEN.getAddress(), 1);
            expect(check_interest.interestRate).equal(625000000000003n);
            check_interest = await _Interest.fetchTimeScaledRateIndex(4, await USDT_TOKEN.getAddress(), 1);
            expect(check_interest.interestRate).equal(312500000000007n);
            // expect(await _Interest.fetchTimeScaledRateIndex(1, await USDT_TOKEN.getAddress(), 1)).equal(2500000000000000n);
            // expect(await _Interest.fetchTimeScaledRateIndex(2, await USDT_TOKEN.getAddress(), 1)).equal(1250000000000001n);
            // expect(await _Interest.fetchTimeScaledRateIndex(3, await USDT_TOKEN.getAddress(), 1)).equal(625000000000003n);

            // expect(await _Interest.fetchTimeScaledRateIndex(4, await USDT_TOKEN.getAddress(), 1)).equal(625000000000003n);
            
        })

        it("calculateAverageCumulativeInterest_fix Function Test", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);
                                    // 500
            const deposit_amount = 500_000000000000000000n
            const approvalTx = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx.wait();  // Wait for the transaction to be mined
            const transfer = await USDT_TOKEN.transfer(signers[1].address, 20_000_000000000000000000n);
            await transfer.wait();        
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount)

            // REXE Deposit             5000
            const deposit_amount_2 = 5_000_000000000000000000n
            const approvalTx1 = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount);
            await approvalTx1.wait();  // Wait for the transaction to be mined
            const approvalTx_2 = await REXE_TOKEN.connect(signers[1]).approve(await deposit_vault.getAddress(), deposit_amount_2);
            await approvalTx_2.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[1]).deposit_token(await REXE_TOKEN.getAddress(), (deposit_amount_2));

            // USDT Deposit             5000
            const deposit_amount_3 = 5_000_000000000000000000n
            const approvalTx_3 = await USDT_TOKEN.approve(await deposit_vault.getAddress(), deposit_amount_3);
            await approvalTx_3.wait();  // Wait for the transaction to be mined
            await deposit_vault.connect(signers[0]).deposit_token(await USDT_TOKEN.getAddress(), deposit_amount_3)

            for (index = 1; index < 16; index++) {
                await _Interest.setInterestIndex(await USDT_TOKEN.getAddress(), 0, index, 1000 + index * 1000);
            }

            await _Interest.setInterestIndex(await USDT_TOKEN.getAddress(), 1, 1, 3000);

            for (let index = 0; index < 16; index++) {
                rate = (await _Interest.fetchTimeScaledRateIndex(0, await USDT_TOKEN.getAddress(), index)).interestRate;
                // console.log("0 -> rate = " + index + " = ", rate);
            }

            rate = (await _Interest.fetchTimeScaledRateIndex(1, await USDT_TOKEN.getAddress(), 1)).interestRate;
            // console.log("1 -> rate = " + "0" + " = ", rate);
            let avarage_rate = await _Interest.calculateAverageCumulativeInterest_test(2, 12, await USDT_TOKEN.getAddress());
            // console.log("avarage_rate = ", avarage_rate);
            expect(avarage_rate).to.equal(8500);

            avarage_rate = await _Interest.calculateAverageCumulativeInterest_test(0, 12, await USDT_TOKEN.getAddress());
            // console.log("avarage_rate = ", avarage_rate);
            expect(avarage_rate).to.equal(4583);

            avarage_rate = await _Interest.calculateAverageCumulativeInterest_test(7, 12, await USDT_TOKEN.getAddress());
            // console.log("avarage_rate = ", avarage_rate);
            expect(avarage_rate).to.equal(11000n);
        })

        it("calculateCompoundedAssets Function Test", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);
            const result = await _Interest.calculateCompoundedAssetsTest(30000, 109090572904986170n, 9412667466204455n, 1);
            // console.log("result", result);
            expect(result[0]).equals(3421867552326560n);
        })

        it("AlterTotalBorrow Function Test", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);
            
            await DataHub.setDaoWallet(signers[1].address);
            expect(await DataHub.DAO_WALLET()).equals(signers[1].address);
            
            await DataHub.connect(signers[1]).setDaoRole(signers[2].address, true);
            expect(await DataHub.dao_role(signers[2].address)).equals(true);

            await DataHub.connect(signers[1]).setDaoRole(signers[2].address, false);
            expect(await DataHub.dao_role(signers[2].address)).equals(false);

            await DataHub.connect(signers[1]).setDaoRole(signers[2].address, true);
            expect(await DataHub.dao_role(signers[2].address)).equals(true);

            await DataHub.connect(signers[2]).changeTotalBorrowedAmountOfAsset(await USDT_TOKEN.getAddress(), 100_000000000000000000n);
            // console.log((await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress())));
            expect((await DataHub.returnAssetLogs(await USDT_TOKEN.getAddress()))[4][1]).equals(100_000000000000000000n);

            await DataHub.connect(signers[1]).setDaoRole(signers[2].address, false);
            expect(await DataHub.dao_role(signers[2].address)).equals(false);

            await expect(DataHub.connect(signers[2]).changeTotalBorrowedAmountOfAsset(await USDT_TOKEN.getAddress(), 100_000000000000000000n)).to.be.revertedWith('Unauthorized');
        })

        it("Set Admin Role Function Test", async function () {
            const { signers, Utils, CurrentExchange, deposit_vault, CurrentLiquidator, DataHub, Oracle, _Interest, USDT_TOKEN, REXE_TOKEN } = await loadFixture(deployandInitContracts);
            // const result = await _Interest.calculateCompoundedAssetsTest(30000, 109090572904986170n, 9412667466204455n, 1);
            await Oracle.connect(signers[0]).setAdminRole(signers[1].address);
            // console.log("result", result);
        })
    })
})
