// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../interfaces/IDataHub.sol";
import "../interfaces/IExecutor.sol";
import "../interfaces/IUtilityContract.sol";
import "../libraries/EVO_LIBRARY.sol";

import "../interestData.sol";

import "hardhat/console.sol";

contract MockInterestData is interestData {
    constructor(address initialOwner, address _executor, address _dh, address _utils, address _dv) interestData(initialOwner, _executor, _dh, _utils, _dv) {}

    function setInterestIndex(address token, uint256 dimension, uint256 index, uint256 value) public {

        InterestRateEpochs[dimension][token][index].interestRate = value;

        InterestRateEpochs[dimension][token][index].lastUpdatedTime = block.timestamp;

        InterestRateEpochs[dimension][token][index].totalLiabilitiesAtIndex = Datahub.returnAssetLogs(token).assetInfo[1]; // 1 -> totalBorrowedAmount

        InterestRateEpochs[dimension][token][index].totalAssetSuplyAtIndex = Datahub.returnAssetLogs(token).assetInfo[0]; // 0 -> totalBorrowedAmount

        InterestRateEpochs[dimension][token][index].borrowProportionAtIndex = EVO_LIBRARY.calculateBorrowProportion(Datahub.returnAssetLogs(token));

        InterestRateEpochs[dimension][token][index].rateInfo = InterestRateEpochs[dimension][token][index - 1].rateInfo;
    }

    function calculateAverageCumulativeInterest_test(
        uint256 startIndex,
        uint256 endIndex,
        address token
    ) public view returns (uint256) {
        // console.log("calculateAverageCumulativeInterest_test function");
        uint256 cumulativeInterestRates = 0;
        uint16[5] memory timeframes = [8736, 600, 200, 10, 1];
        // console.log("calculateAverageCumulativeInterest_test function");

        uint256 runningUpIndex = startIndex;
        uint256 runningDownIndex = endIndex;
        uint256 biggestPossibleStartTimeframe;
        
        startIndex = startIndex + 1; // For calculating untouched and cause of gas fee

        // console.log("calculateAverageCumulativeInterest_test function");

        for (uint256 i = 0; i < timeframes.length; i++) {
            // console.log("timeframe", i, timeframes[i]);
            if ( startIndex + timeframes[i] - 1 <= endIndex) { // For spliting
                // console.log("timeframe passed", timeframes[i]);
                biggestPossibleStartTimeframe = (startIndex / timeframes[i]) * timeframes[i];

                // console.log("biggestPossibleStartTimeframe", biggestPossibleStartTimeframe );

                if(( startIndex % timeframes[i]) > 0 ) {
                    biggestPossibleStartTimeframe += timeframes[i];
                }  
                
                // console.log("biggestPossibleStartTimeframe", biggestPossibleStartTimeframe );
                
                runningUpIndex = biggestPossibleStartTimeframe + 1;
                runningDownIndex = biggestPossibleStartTimeframe;
                // console.log("runningUpIndex", runningUpIndex);
                break;
            }
        }

        // console.log("runningUpIndex", runningUpIndex );
        // console.log("runningDownIndex", runningDownIndex );
        // console.log("stsartIndex", startIndex);
        // console.log("endIndex", endIndex);

        for (uint256 i = 0; i < timeframes.length; i++) {
            // console.log("timeframes", timeframes[i]);
            while ((runningUpIndex + timeframes[i] - 1) <= endIndex) {
                // this inverses the list order due to interest being stored in the opposite index format 0-4
                uint256 adjustedIndex = timeframes.length - 1 - i;
                // console.log("adjusted index", adjustedIndex);
                // console.log("runningUpIndex", runningUpIndex);
                // console.log("time scale rate index", fetchTimeScaledRateIndex(
                //     adjustedIndex,
                //     token,
                //     runningUpIndex / timeframes[i] // 168 / 168 = 1
                // ).interestRate);
                cumulativeInterestRates +=
                    fetchTimeScaledRateIndex(
                        adjustedIndex,
                        token,
                        runningUpIndex / timeframes[i] // 168 / 168 = 1
                    ).interestRate *
                    timeframes[i];
                // console.log("cumulativeInterestRates", cumulativeInterestRates);
                runningUpIndex += timeframes[i];
                // console.log("counter", counter);
            }

            // Calculate cumulative interest rates for decreasing indexes
            while ((runningDownIndex >= timeframes[i]) && ((runningDownIndex - timeframes[i] + 1) >= startIndex)) {
                //&& available
                uint256 adjustedIndex = timeframes.length - 1 - i;
                // console.log("runningDownIndex", runningDownIndex);
                cumulativeInterestRates +=
                    fetchTimeScaledRateIndex(
                        adjustedIndex,
                        token,
                        runningDownIndex / timeframes[i]
                    ).interestRate *
                    timeframes[i];

                // console.log("cumulativeInterestRates", cumulativeInterestRates);

                runningDownIndex -= timeframes[i];
            }
        }

        if (
            cumulativeInterestRates == 0 || (endIndex - (startIndex - 1)) == 0
        ) {
            return 0;
        }
        // Return the cumulative interest rates
        return cumulativeInterestRates / (endIndex - (startIndex - 1));
    }

    function updateInterestIndexTest(
        address token,
        uint256 index, // 24
        uint256 value
    ) public {
        // console.log("=======================Update Interest Index Function========================");
        // console.log("index", index);
        // console.log("value", value);
        currentInterestIndex[token] = index + 1; // 25
        uint8[5] memory timeframes = [1, 2, 4, 8, 16];
        uint256 period_start;
        uint256 period_interval;
        uint256 borrowProportion;
        uint256 interestReate;

        // borrowProportion = EVO_LIBRARY.calculateBorrowProportion(
        //     Datahub.returnAssetLogs(token)
        // );
        // borrowProportion = 0;

        setInterestRateEpoch(
            0,
            token,
            uint(currentInterestIndex[token]),
            borrowProportion,
            value
        );

        for (uint256 i = 1; i < timeframes.length; i++) {
            if( (currentInterestIndex[token] % timeframes[i]) == 0 ) {
                // console.log("///////////////////////start//////////////////////////");
                // console.log("index - timeframe", currentInterestIndex[token], timeframes[i]);
                period_interval = timeframes[i] / timeframes[i-1];
                period_start = currentInterestIndex[token] / timeframes[i-1];
                period_start = (period_start / period_interval - 1) * period_interval + 1;
                borrowProportion = EVO_LIBRARY.calculateAverage(
                    utils.fetchBorrowProportionList(
                        i - 1,
                        period_start, // 1
                        period_start + period_interval - 1, //24
                        token
                    )
                );
                // borrowProportion = 0;
                // console.log("period interval", period_interval);
                // console.log("start", period_start);
                // console.log("end", period_start + period_interval - 1);
                interestReate = EVO_LIBRARY.calculateAverage(
                    utils.fetchRatesList(
                        i - 1,
                        period_start, // 1
                        period_start + period_interval - 1, //24
                        token
                    )
                );
                // console.log("interest rate", interestReate);
                // interestReate = value;
                setInterestRateEpoch(
                    i,
                    token,
                    uint(currentInterestIndex[token] / timeframes[i]),
                    borrowProportion,
                    interestReate
                );
                // console.log("////////////////////end/////////////////////");
            }
        }
    }
    function calculateCompoundedAssetsTest(
        uint256 currentIndex,
        uint256 AverageCumulativeDepositInterest,
        uint256 usersAssets,
        uint256 usersOriginIndex
    ) public pure returns (uint256, uint256, uint256) {
        (uint256 interestCharge, uint256 OrderBookProviderCharge, uint256 DaoInterestCharge) = EVO_LIBRARY.calculateCompoundedAssets(currentIndex, AverageCumulativeDepositInterest, usersAssets, usersOriginIndex);
        return (interestCharge, OrderBookProviderCharge, DaoInterestCharge);
    }

    function calculateCompoundedLiabilitiesTest(
        uint256 currentIndex, // token index
        uint256 AverageCumulativeInterest,
        IDataHub.AssetData memory assetdata,
        IInterestData.interestDetails memory interestRateInfo,
        uint256 newLiabilities,
        uint256 usersLiabilities,
        uint256 usersOriginIndex
    ) public pure returns (uint256) {
        uint256 amountOfBilledHours = currentIndex - usersOriginIndex;
        uint256 adjustedNewLiabilities = (newLiabilities * (1e18 + (EVO_LIBRARY.calculateInterestRate(newLiabilities, assetdata, interestRateInfo) / 8736))) / (10 ** 18);
        uint256 initalMarginFeeAmount;

        uint256 interestCharge;
        uint256 averageHourly = 1e18 + AverageCumulativeInterest / 8736;
        (uint256 averageHourlyBase, int256 averageHourlyExp) = EVO_LIBRARY.normalize(
            averageHourly
        );
        averageHourlyExp = averageHourlyExp - 18;

        uint256 hourlyChargesBase = 1;
        int256 hourlyChargesExp = 0;

        while (amountOfBilledHours > 0) {
            if (amountOfBilledHours % 2 == 1) {
                (uint256 _base, int256 _exp) = EVO_LIBRARY.normalize(
                    (hourlyChargesBase * averageHourlyBase)
                );

                hourlyChargesBase = _base;
                hourlyChargesExp =
                    hourlyChargesExp +
                    averageHourlyExp +
                    _exp;
            }
            (uint256 _bases, int256 _exps) = EVO_LIBRARY.normalize(
                (averageHourlyBase * averageHourlyBase)
            );
            averageHourlyBase = _bases;
            averageHourlyExp = averageHourlyExp + averageHourlyExp + _exps;

            amountOfBilledHours /= 2;
        }

        uint256 compoundedLiabilities = usersLiabilities *
            hourlyChargesBase;

        unchecked {
            if (hourlyChargesExp >= 0) {
                compoundedLiabilities =
                    compoundedLiabilities *
                    (10 ** uint256(hourlyChargesExp));
            } else {
                compoundedLiabilities =
                    compoundedLiabilities /
                    (10 ** uint256(-hourlyChargesExp));
            }

            interestCharge =
                (compoundedLiabilities +
                    adjustedNewLiabilities +
                    initalMarginFeeAmount) -
                (usersLiabilities + newLiabilities);
            return interestCharge;
        }
    }

    function returnInterestChargeTest(
        address user,
        address token,
        uint256 liabilitiesAccrued
    ) public view returns (uint256) {
        // console.log("========================return interest charge function========================");
        (, uint256 liabilities, , , ) = Datahub.ReadUserData(user, token);

        uint256 interestRateIndex = Datahub.viewUsersInterestRateIndex(user, token);
        uint256 currentRateIndex = fetchCurrentRateIndex(token);
        IInterestData.interestDetails memory rateInfo = fetchRateInfo(token, currentRateIndex);
        IDataHub.AssetData memory assetLogs = Datahub.returnAssetLogs(token);
        uint256 cumulativeInterest = calculateAverageCumulativeInterest(
            interestRateIndex,
            currentRateIndex,
            token
        );
        // console.log("cumulativeInterest", cumulativeInterest);

        uint256 interestCharge = calculateCompoundedLiabilitiesTest(
            currentRateIndex,
            cumulativeInterest,
            assetLogs,
            rateInfo,
            liabilitiesAccrued,
            liabilities,
            interestRateIndex
        );
        // console.log("interest charge", interestCharge);
        return interestCharge;
    }
}
