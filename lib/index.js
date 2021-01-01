module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("immutable");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("bignumber.js");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("moment");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("core-js/modules/es6.array.sort");

/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: external "immutable"
var external_immutable_ = __webpack_require__(0);

// EXTERNAL MODULE: external "bignumber.js"
var external_bignumber_js_ = __webpack_require__(1);

// EXTERNAL MODULE: external "core-js/modules/es6.array.sort"
var es6_array_sort_ = __webpack_require__(3);

// EXTERNAL MODULE: external "moment"
var external_moment_ = __webpack_require__(2);
var external_moment_default = /*#__PURE__*/__webpack_require__.n(external_moment_);

// CONCATENATED MODULE: ./src/matchLogic.ts




const lotSort = (lots, costMethod) => {
  const fifoComparator = (a, b) => a.unix - b.unix;

  const hifoComparator = (a, b) => b.pricePerUnit.minus(a.pricePerUnit).toNumber();

  const lifoComparator = (a, b) => b.unix - a.unix;

  if (costMethod === 'FIFO') {
    return lots.sort(fifoComparator);
  } else if (costMethod === 'HIFO') {
    return lots.sort(hifoComparator);
  } else if (costMethod === 'LIFO') {
    return lots.sort(lifoComparator);
  } else {
    throw new Error('No cost basis method provided.');
  }
};
const unmatchedDisposal = (report, disposal, localCurrency) => {
  let reportToUpdate;
  const disposalMoment = external_moment_default.a.utc(disposal.unix, 'X');
  const disposalYear = disposalMoment.format('YYYY');
  const samedate = disposalMoment.format();
  const sale = Object(external_immutable_["Map"])({
    asset: disposal.assetCode,
    proceeds: disposal.proceedsAmount,
    date_sold: samedate,
    cost_basis: '0',
    asset_amount: disposal.assetAmount,
    date_acquired: samedate,
    tx_id_sale: disposal.transactionId
  });
  reportToUpdate = report.updateIn([disposalYear, 'unmatched'], list => list.push(sale));

  if (disposal.isLost) {
    reportToUpdate = reportToUpdate.updateIn([disposalYear, 'lost'], list => list.push(sale));
  } else if (disposal.isCompoundLiquidated) {
    reportToUpdate = reportToUpdate.updateIn([disposalYear, 'compound_liquidations_borrower'], (list = Object(external_immutable_["List"])()) => list.push(sale));
  } else {
    if (disposal.isBorrowRepay) {
      reportToUpdate = reportToUpdate.updateIn([disposalYear, 'borrow_repayments'], (list = Object(external_immutable_["List"])()) => list.push(sale));
    }

    if (disposal.assetCode !== localCurrency) {
      let reportCategory = 'short';

      if (disposal.gainsAsInterestIncome) {
        reportCategory = 'interest_income';
      }

      reportToUpdate = reportToUpdate.updateIn([disposalYear, reportCategory], list => list.push(sale));
    }
  }

  return Object(external_immutable_["Map"])({
    report: reportToUpdate,
    disposal: disposal.set('assetAmount', new external_bignumber_js_["BigNumber"](0)).set('proceedsAmount', new external_bignumber_js_["BigNumber"](0))
  });
};
const exhaustLot = (report, disposal, lotStack, localCurrency) => {
  let currentReport = report;
  const lotToDiminish = lotStack.first();
  const disposalMoment = external_moment_default.a.utc(disposal.unix, 'X');
  const timeDiff = disposalMoment.diff(external_moment_default.a.utc(lotToDiminish.unix, 'X'));
  const isShort = external_moment_default.a.duration(timeDiff).asYears() < 1;
  const shareSold = lotToDiminish.assetAmount.dividedBy(disposal.assetAmount);
  const saleProceeds = disposal.proceedsAmount.times(shareSold);
  const disposalYear = disposalMoment.format('YYYY');
  const sale = Object(external_immutable_["Map"])({
    asset: disposal.assetCode,
    proceeds: saleProceeds,
    date_sold: external_moment_default.a.utc(disposal.unix, 'X').format(),
    cost_basis: lotToDiminish.basisAmount,
    asset_amount: lotToDiminish.assetAmount,
    date_acquired: external_moment_default.a.utc(lotToDiminish.unix, 'X').format(),
    tx_id_lot: lotToDiminish.transactionId,
    tx_id_sale: disposal.transactionId
  });

  if (disposal.isLost) {
    currentReport = currentReport.updateIn([disposalYear, 'lost'], list => list.push(sale));
  } else if (disposal.isCompoundLiquidated) {
    currentReport = currentReport.updateIn([disposalYear, 'compound_liquidations_borrower'], (list = Object(external_immutable_["List"])()) => list.push(sale));
  } else if (disposal.assetCode !== localCurrency) {
    if (disposal.isBorrowRepay) {
      currentReport = currentReport.updateIn([disposalYear, 'borrow_repayments'], (list = Object(external_immutable_["List"])()) => list.push(sale));
    }

    let reportCategory = isShort ? 'short' : 'long';

    if (disposal.gainsAsInterestIncome) {
      reportCategory = 'interest_income';
    }

    currentReport = currentReport.updateIn([disposalYear, reportCategory], list => list.push(sale));
  }

  const currentDisposal = disposal.set('assetAmount', disposal.assetAmount.minus(lotToDiminish.assetAmount)).set('proceedsAmount', disposal.proceedsAmount.minus(saleProceeds));
  return Object(external_immutable_["Map"])({
    report: currentReport,
    disposal: currentDisposal,
    lotStack: lotStack.pop()
  });
};
const exhaustDisposal = (report, disposal, lotStack, localCurrency) => {
  let currentReport = report;
  const lotToDiminish = lotStack.first();
  const disposalMoment = external_moment_default.a.utc(disposal.unix, 'X');
  const timeDiff = disposalMoment.diff(external_moment_default.a.utc(lotToDiminish.unix, 'X'));
  const isShort = external_moment_default.a.duration(timeDiff).asYears() < 1;
  const shareLotSold = disposal.assetAmount.dividedBy(lotToDiminish.assetAmount);
  const costBasisSold = lotToDiminish.basisAmount.times(shareLotSold);
  const disposalYear = disposalMoment.format('YYYY');
  const sale = Object(external_immutable_["Map"])({
    asset: disposal.assetCode,
    proceeds: disposal.proceedsAmount,
    date_sold: external_moment_default.a.utc(disposal.unix, 'X').format(),
    cost_basis: costBasisSold,
    asset_amount: disposal.assetAmount,
    date_acquired: external_moment_default.a.utc(lotToDiminish.unix, 'X').format(),
    tx_id_lot: lotToDiminish.transactionId,
    tx_id_sale: disposal.transactionId
  });

  if (disposal.isLost) {
    currentReport = report.updateIn([disposalYear, 'lost'], list => list.push(sale));
  } else if (disposal.isCompoundLiquidated) {
    currentReport = currentReport.updateIn([disposalYear, 'compound_liquidations_borrower'], (list = Object(external_immutable_["List"])()) => list.push(sale));
  } else if (disposal.assetCode !== localCurrency) {
    if (disposal.isBorrowRepay) {
      currentReport = currentReport.updateIn([disposalYear, 'borrow_repayments'], (list = Object(external_immutable_["List"])()) => list.push(sale));
    }

    let reportCategory = isShort ? 'short' : 'long';

    if (disposal.gainsAsInterestIncome) {
      reportCategory = 'interest_income';
    }

    currentReport = currentReport.updateIn([disposalYear, reportCategory], list => list.push(sale));
  }

  const lotToPush = lotToDiminish.set('assetAmount', lotToDiminish.assetAmount.minus(disposal.assetAmount)).set('basisAmount', lotToDiminish.basisAmount.minus(costBasisSold));
  const currentDisposal = disposal.set('assetAmount', new external_bignumber_js_["BigNumber"](0)).set('proceedsAmount', new external_bignumber_js_["BigNumber"](0));
  return Object(external_immutable_["Map"])({
    report: currentReport,
    disposal: currentDisposal,
    lotStack: lotStack.pop().push(lotToPush)
  });
};
// CONCATENATED MODULE: ./src/reportHelpers.ts




const applyUnmatchedSales = report => {
  let currentReport = report;
  report.reduce((aggregatePriorSales, reportYear, year) => {
    const unmatched = reportYear.get('unmatched');

    if (unmatched.size > 0) {
      const currentAndPriorSales = unmatched.reduce((red, unmatchedSale) => {
        const existing = red.get(unmatchedSale.get('asset'), new external_bignumber_js_["BigNumber"](0));
        return red.set(unmatchedSale.get('asset'), external_bignumber_js_["BigNumber"].sum(existing, unmatchedSale.get('asset_amount')));
      }, aggregatePriorSales);
      currentAndPriorSales.map((amount, holdingAsset) => {
        const keypath = [year, 'assets', holdingAsset, 'holdings'];
        const existingHoldings = currentReport.getIn(keypath, new external_bignumber_js_["BigNumber"](0));
        currentReport = currentReport.setIn(keypath, existingHoldings.minus(amount));
      });
      return currentAndPriorSales;
    } else {
      aggregatePriorSales.map((amount, holdingAsset) => {
        const keypath = [year, 'assets', holdingAsset, 'holdings'];
        const existingHoldings = currentReport.getIn(keypath, new external_bignumber_js_["BigNumber"](0));
        currentReport = currentReport.setIn(keypath, existingHoldings.minus(amount));
      });
      return aggregatePriorSales;
    }
  }, Object(external_immutable_["Map"])({}));
  return currentReport;
};
const addIncomeToReport = (report, taxLot) => {
  let reportToUpdate = report;

  if (taxLot.get('isIncome')) {
    const incomeMoment = external_moment_default.a.utc(taxLot.unix, 'X');
    const incomeYear = incomeMoment.format('YYYY');
    const income = Object(external_immutable_["Map"])({
      asset: taxLot.assetCode,
      asset_amount: taxLot.assetAmount,
      date_acquired: incomeMoment.format(),
      basis_amount: taxLot.basisAmount,
      basis: taxLot.basisCode,
      tx_id_lot: taxLot.transactionId
    });
    reportToUpdate = report.updateIn([incomeYear, 'income'], list => list.push(income));
  }

  return Object(external_immutable_["Map"])({
    report: reportToUpdate,
    taxLot: taxLot
  });
};
const updateReportIncomeFromLots = (report, lots, year) => {
  const unixSOY = Number(external_moment_default.a.utc(year, 'YYYY').startOf('year').format('X'));
  const unixEOY = Number(external_moment_default.a.utc(year, 'YYYY').endOf('year').format('X'));
  lots.forEach(taxLots => {
    let reportWithIncome = report;
    reportWithIncome = taxLots.filter(lot => {
      return lot.unix >= unixSOY && lot.unix <= unixEOY;
    }).reduce((acc, lot) => {
      const res = addIncomeToReport(acc, lot);
      return res.get('report');
    }, reportWithIncome);
    report = report.set(year, reportWithIncome.get(year));
  });
  return report;
};
const setupAssetProperties = (year, report, yearDisposals, allLots) => {
  const unixSOY = Number(external_moment_default.a.utc(year, 'YYYY').startOf('year').format('X'));
  const unixEOY = Number(external_moment_default.a.utc(year, 'YYYY').endOf('year').format('X'));
  const reportWithIncrease = allLots.reduce((accReport, assetLots, assetKey) => {
    const assetLotsInYear = assetLots.filter(lot => {
      return lot.unix >= unixSOY && lot.unix <= unixEOY;
    });
    const assetReduction = assetLotsInYear.reduce((numReduction, lot) => {
      return external_bignumber_js_["BigNumber"].sum(lot.assetAmount, numReduction);
    }, new external_bignumber_js_["BigNumber"](0));
    const existingDecrease = accReport.getIn([year, 'assets', assetKey, 'increase'], new external_bignumber_js_["BigNumber"](0));
    const existingHoldings = accReport.getIn([year, 'assets', assetKey, 'holdings'], new external_bignumber_js_["BigNumber"](0));
    return accReport.setIn([year, 'assets', assetKey, 'increase'], assetReduction).setIn([year, 'assets', assetKey, 'decrease'], existingDecrease).setIn([year, 'assets', assetKey, 'holdings'], existingHoldings);
  }, report);
  const reportWithDecrease = yearDisposals.reduce((accReport, disposal) => {
    const keypathDecrease = [year, 'assets', disposal.assetCode, 'decrease'];
    const keypathIncrease = [year, 'assets', disposal.assetCode, 'increase'];
    const keypathHoldings = [year, 'assets', disposal.assetCode, 'holdings'];
    const existingDecrease = accReport.getIn(keypathDecrease, new external_bignumber_js_["BigNumber"](0));
    const existingIncrease = accReport.getIn(keypathIncrease, new external_bignumber_js_["BigNumber"](0));
    const existingHoldings = accReport.getIn(keypathHoldings, new external_bignumber_js_["BigNumber"](0));
    return accReport.setIn(keypathDecrease, external_bignumber_js_["BigNumber"].sum(existingDecrease, disposal.assetAmount)).setIn(keypathIncrease, existingIncrease).setIn(keypathHoldings, existingHoldings);
  }, reportWithIncrease);
  return reportWithDecrease;
};
const buildReportIterable = (sortedDisposals, yearList) => {
  return yearList.map(v => {
    const stringYear = String(v);
    return Object(external_immutable_["Map"])({
      year: stringYear,
      disposals: sortedDisposals.filter(disposal => external_moment_default.a.utc(disposal.unix, 'X').format('YYYY') === stringYear)
    });
  });
};
const updateReportHoldingsFromLots = (reportAndLots, year) => {
  const endOfYear = Number(external_moment_default.a.utc(year, 'YYYY').endOf('year').format('X'));
  let currentReport = reportAndLots.get('report');
  reportAndLots.get('lots').map((value, lotAsset) => {
    const assetLotsInYear = value.filter(lot => {
      return lot.unix < endOfYear;
    });

    if (assetLotsInYear.size > 0) {
      const assetHoldings = assetLotsInYear.reduce((acc, lot) => {
        return external_bignumber_js_["BigNumber"].sum(lot.assetAmount, acc);
      }, new external_bignumber_js_["BigNumber"](0));
      const keyPath = [year, 'assets', lotAsset, 'holdings'];
      const currentHoldings = currentReport.getIn(keyPath, new external_bignumber_js_["BigNumber"](0));
      currentReport = currentReport.setIn(keyPath, external_bignumber_js_["BigNumber"].sum(currentHoldings, assetHoldings));
    }
  });
  return currentReport;
};
const buildYearList = sorted => {
  const firstYear = Number(external_moment_default.a.utc(sorted.get(0).unix, 'X').format('YYYY'));
  const lastYear = Number(external_moment_default.a.utc(sorted.get(-1).unix, 'X').format('YYYY'));
  const distance = lastYear - firstYear + 1;
  return Object(external_immutable_["fromJS"])(Array.from({
    length: distance
  }, (_, i) => i + firstYear));
};
const sortAccountingRecords = ({
  records
}) => {
  return records.sort((a, b) => a.unix - b.unix);
};
const sortDisposals = ({
  records
}) => {
  return records.sort((a, b) => a.unix - b.unix);
};
const groupBy = (list, grouper) => {
  return list.groupBy(grouper).map(collection => collection.toList()).toMap();
};
// CONCATENATED MODULE: ./src/utils/convert.js

function bigNumberToString(obj, base, places = 2) {
  base = base || 10;

  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj) && !('lessThan' in obj)) {
    Object.keys(obj).forEach(function (key) {
      obj[key] = bigNumberToString(obj[key], base, ['increase', 'decrease', 'holdings', 'asset_amount'].includes(key) ? 18 : places);
    });
  }

  if (Array.isArray(obj)) {
    obj = obj.map(function (item) {
      return bigNumberToString(item, base, places);
    });
  }

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (!external_bignumber_js_["BigNumber"].isBigNumber(obj)) {
    return obj;
  }

  return obj.dp(places).toString(base);
}
// CONCATENATED MODULE: ./src/accounting/fee.ts



const getFeeAmount = ({
  transaction,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency
}) => {
  let taxableFeeAmount = new external_bignumber_js_["BigNumber"]('0');
  transaction.get('fee_tx_ids', Object(external_immutable_["List"])()).forEach(fee_tx_id => {
    const feeTransaction = transactionsMap.get(fee_tx_id);
    const makeEntries = accountingFuncFromTransaction(feeTransaction);
    const entries = makeEntries({
      txId: feeTransaction.get('tx_id'),
      pricesMap,
      transactionsMap,
      priceMethod,
      localCurrency
    });
    entries.get('disposals').forEach(feeDisposal => {
      taxableFeeAmount = external_bignumber_js_["BigNumber"].sum(taxableFeeAmount, feeDisposal.get('proceedsAmount'));
    });
  });
  return taxableFeeAmount;
};
// CONCATENATED MODULE: ./src/taxLot.ts


const TaxLotRecordFactory = Object(external_immutable_["Record"])({
  unix: 0,
  assetCode: '',
  assetAmount: new external_bignumber_js_["BigNumber"]('0'),
  basisCode: '',
  basisAmount: new external_bignumber_js_["BigNumber"]('0'),
  transactionId: '',
  isIncome: false
});
class TaxLot extends TaxLotRecordFactory {
  get pricePerUnit() {
    return this.basisAmount.div(this.assetAmount);
  }

}
/* harmony default export */ var src_taxLot = (TaxLot);
// CONCATENATED MODULE: ./src/disposal.ts


const DisposalRecordFactory = Object(external_immutable_["Record"])({
  unix: 0,
  assetCode: '',
  assetAmount: new external_bignumber_js_["BigNumber"]('0'),
  proceedsCode: '',
  proceedsAmount: new external_bignumber_js_["BigNumber"]('0'),
  transactionId: '',
  isLost: false,
  gainsAsInterestIncome: false,
  isBorrowRepay: false,
  isCompoundLiquidated: false
});

class Disposal extends DisposalRecordFactory {}

/* harmony default export */ var src_disposal = (Disposal);
// CONCATENATED MODULE: ./src/errors.ts
class EmptyParamError extends Error {}

Object.defineProperty(EmptyParamError.prototype, 'name', {
  value: 'EmptyParamError'
});

class InvalidParamError extends Error {}

Object.defineProperty(InvalidParamError.prototype, 'name', {
  value: 'InvalidParamError'
});

// CONCATENATED MODULE: ./src/accounting/helpers.ts



const transactionIsBuy = transaction => {
  return transaction.get('side').toUpperCase() !== 'SELL';
};
const transactionFeeCode = transaction => {
  const feeCode = transaction.get('fee_code');
  return feeCode ? feeCode.toUpperCase() : feeCode;
};
const transactionHasFee = transaction => {
  return Boolean(transactionFeeCode(transaction)) && Boolean(transaction.get('fee_amount'));
};
const transactionUnixNumber = transaction => {
  const txMoment = external_moment_default.a.utc(transaction.get('timestamp'), external_moment_default.a.ISO_8601);

  if (!txMoment.isValid()) {
    throw new InvalidParamError(`Transaction ID ${transaction.get('tx_id')} contains an invalid timestamp. Must be ISO-8601 format.`);
  }

  return Number(txMoment.format('X'));
};
const getPriceBigNumber = (priceList, baseCode, quoteCode) => {
  if (baseCode === quoteCode) {
    return new external_bignumber_js_["BigNumber"]('1');
  }

  try {
    const stringPrice = priceList.find(p => p.get('base_code') === baseCode && p.get('quote_code') === quoteCode).get('price');
    return new external_bignumber_js_["BigNumber"](stringPrice);
  } catch (e) {
    console.error(`No price found for ${baseCode} in ${quoteCode}`);
    throw e;
  }
};
// CONCATENATED MODULE: ./src/accounting/generic/trade.ts






const lotsAndDisposalsFromTrade = ({
  txId,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency,
  gainsAsInterestIncome = false
}) => {
  const transactionPrices = pricesMap.get(txId);
  const transaction = transactionsMap.get(txId);
  const unixNumber = transactionUnixNumber(transaction);
  const isBuy = transactionIsBuy(transaction);
  const isSell = !isBuy;
  const priceStrategy = priceMethod.toLowerCase();
  const tradeAmount = new external_bignumber_js_["BigNumber"](transaction.get(`${priceStrategy}_amount`));
  const tradeCode = transaction.get(`${priceStrategy}_code`);
  const tradePrice = getPriceBigNumber(transactionPrices, tradeCode, localCurrency);
  const taxableAmount = tradeAmount.times(tradePrice);
  let basisAmount = taxableAmount;
  let proceedsAmount = taxableAmount;
  const taxableFeeAmount = getFeeAmount({
    transaction,
    pricesMap,
    transactionsMap,
    priceMethod,
    localCurrency
  });

  if (isBuy) {
    basisAmount = external_bignumber_js_["BigNumber"].sum(basisAmount, taxableFeeAmount);
  } else {
    proceedsAmount = proceedsAmount.minus(taxableFeeAmount);
  }

  const lotSide = isBuy ? 'base' : 'quote';
  const lotCode = transaction.get(`${lotSide}_code`).toUpperCase();
  const lotAmount = new external_bignumber_js_["BigNumber"](transaction.get(`${lotSide}_amount`));
  const taxLots = Object(external_immutable_["List"])([new src_taxLot({
    unix: unixNumber,
    assetCode: lotCode,
    assetAmount: lotAmount,
    basisCode: localCurrency,
    basisAmount: basisAmount,
    transactionId: txId,
    isIncome: false
  })]);
  const disposalSide = isSell ? 'base' : 'quote';
  const disposalCode = transaction.get(`${disposalSide}_code`).toUpperCase();
  const disposalAmount = new external_bignumber_js_["BigNumber"](transaction.get(`${disposalSide}_amount`));
  const disposals = Object(external_immutable_["List"])([new src_disposal({
    unix: unixNumber,
    assetCode: disposalCode,
    assetAmount: disposalAmount,
    proceedsCode: localCurrency,
    proceedsAmount: proceedsAmount,
    transactionId: txId,
    gainsAsInterestIncome
  })]);
  return Object(external_immutable_["Map"])({
    taxLots: taxLots,
    disposals: disposals
  });
};
// CONCATENATED MODULE: ./src/accounting/generic/deposit.ts





const lotsAndDisposalsFromDeposit = ({
  txId,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency
}) => {
  const transactionPrices = pricesMap.get(txId);
  const transaction = transactionsMap.get(txId);
  const unixNumber = transactionUnixNumber(transaction);
  const lotCode = transaction.get('deposit_code').toUpperCase();
  let lotAmount = new external_bignumber_js_["BigNumber"](transaction.get('deposit_amount'));
  const depositPrice = getPriceBigNumber(transactionPrices, lotCode, localCurrency);
  let basisAmount = lotAmount.times(depositPrice);
  const taxableFeeAmount = getFeeAmount({
    transaction,
    pricesMap,
    transactionsMap,
    priceMethod,
    localCurrency
  });
  basisAmount = external_bignumber_js_["BigNumber"].sum(basisAmount, taxableFeeAmount);
  return Object(external_immutable_["Map"])({
    taxLots: Object(external_immutable_["List"])([new src_taxLot({
      unix: unixNumber,
      assetCode: lotCode,
      assetAmount: lotAmount,
      basisCode: localCurrency,
      basisAmount: basisAmount,
      transactionId: txId,
      isIncome: false
    })]),
    disposals: Object(external_immutable_["List"])()
  });
};
// CONCATENATED MODULE: ./src/accounting/generic/withdrawal.ts





const lotsAndDisposalsFromWithdrawal = ({
  txId,
  pricesMap,
  transactionsMap,
  localCurrency,
  priceMethod,
  isLost = false,
  isBorrowRepay = false,
  isCompoundLiquidated = false
}) => {
  const transactionPrices = pricesMap.get(txId);
  const transaction = transactionsMap.get(txId);
  const unixNumber = transactionUnixNumber(transaction);
  const withdrawalCode = transaction.get('withdrawal_code').toUpperCase();
  let withdrawalAmount = new external_bignumber_js_["BigNumber"](transaction.get('withdrawal_amount'));
  const withdrawalPrice = getPriceBigNumber(transactionPrices, withdrawalCode, localCurrency);
  let proceedsAmount = withdrawalAmount.times(withdrawalPrice);
  const taxableFeeAmount = getFeeAmount({
    transaction,
    pricesMap,
    transactionsMap,
    localCurrency,
    priceMethod
  });
  proceedsAmount = proceedsAmount.minus(taxableFeeAmount);
  return Object(external_immutable_["Map"])({
    taxLots: Object(external_immutable_["List"])(),
    disposals: Object(external_immutable_["List"])([new src_disposal({
      unix: unixNumber,
      assetCode: withdrawalCode,
      assetAmount: withdrawalAmount,
      proceedsCode: localCurrency,
      proceedsAmount: proceedsAmount,
      transactionId: txId,
      isLost,
      isBorrowRepay,
      isCompoundLiquidated
    })])
  });
};
// CONCATENATED MODULE: ./src/accounting/generic/income.ts





const lotsAndDisposalsFromIncome = ({
  txId,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency
}) => {
  const transactionPrices = pricesMap.get(txId);
  const transaction = transactionsMap.get(txId);
  const unixNumber = transactionUnixNumber(transaction);
  const lotCode = transaction.get('income_code').toUpperCase();
  let lotAmount = new external_bignumber_js_["BigNumber"](transaction.get('income_amount'));
  const incomePrice = getPriceBigNumber(transactionPrices, lotCode, localCurrency);
  let basisAmount = lotAmount.times(incomePrice);
  const taxableFeeAmount = getFeeAmount({
    transaction,
    pricesMap,
    transactionsMap,
    priceMethod,
    localCurrency
  });
  basisAmount = external_bignumber_js_["BigNumber"].sum(basisAmount, taxableFeeAmount);
  return Object(external_immutable_["Map"])({
    taxLots: Object(external_immutable_["List"])([new src_taxLot({
      unix: unixNumber,
      assetCode: lotCode,
      assetAmount: lotAmount,
      basisCode: localCurrency,
      basisAmount: basisAmount,
      transactionId: txId,
      isIncome: true
    })]),
    disposals: Object(external_immutable_["List"])()
  });
};
// CONCATENATED MODULE: ./src/accounting/generic/lost.ts

const lotsAndDisposalsFromLost = ({
  txId,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency
}) => {
  const updatedTransactionsMap = transactionsMap.set(txId, transactionsMap.get(txId).set('tx_type', 'WITHDRAWAL').set('withdrawal_code', transactionsMap.getIn([txId, 'lost_code'])).set('withdrawal_amount', transactionsMap.getIn([txId, 'lost_amount'])).delete('lost_code').delete('lost_amount'));
  return lotsAndDisposalsFromWithdrawal({
    txId,
    pricesMap,
    transactionsMap: updatedTransactionsMap,
    priceMethod,
    localCurrency,
    isLost: true
  });
};
// CONCATENATED MODULE: ./src/accounting/compound_v2/mint.ts


const lotsAndDisposalsFromMint = ({
  txId,
  transactionsMap,
  pricesMap,
  priceMethod,
  localCurrency
}) => {
  const mint = transactionsMap.get(txId);
  const updatedTransactionsMap = transactionsMap.set(txId, Object(external_immutable_["Map"])({
    tx_id: mint.get('tx_id'),
    tx_type: 'TRADE',
    timestamp: mint.get('timestamp'),
    side: 'BUY',
    base_amount: mint.get('c_token_amount'),
    base_code: mint.get('c_token_code'),
    quote_amount: mint.get('supplied_amount'),
    quote_code: mint.get('supplied_code'),
    fee_tx_ids: mint.get('fee_tx_ids', Object(external_immutable_["List"])())
  }));
  return lotsAndDisposalsFromTrade({
    txId,
    transactionsMap: updatedTransactionsMap,
    pricesMap,
    priceMethod,
    localCurrency
  });
};
// CONCATENATED MODULE: ./src/accounting/compound_v2/redeem.ts


const lotsAndDisposalsFromCompoundRedeem = ({
  txId,
  transactionsMap,
  pricesMap,
  priceMethod,
  localCurrency
}) => {
  const redeem = transactionsMap.get(txId);
  const updatedTransactionsMap = transactionsMap.set(txId, Object(external_immutable_["Map"])({
    tx_id: redeem.get('tx_id'),
    tx_type: 'TRADE',
    side: 'BUY',
    timestamp: redeem.get('timestamp'),
    base_code: redeem.get('redeem_code'),
    base_amount: redeem.get('redeem_amount'),
    quote_code: redeem.get('c_token_code'),
    quote_amount: redeem.get('c_token_amount'),
    fee_tx_ids: redeem.get('fee_tx_ids', Object(external_immutable_["List"])())
  }));
  return lotsAndDisposalsFromTrade({
    txId,
    transactionsMap: updatedTransactionsMap,
    pricesMap,
    priceMethod,
    localCurrency,
    gainsAsInterestIncome: true
  });
};
// CONCATENATED MODULE: ./src/accounting/compound_v2/borrow.ts


const lotsAndDisposalsFromCompoundBorrow = ({
  txId,
  transactionsMap,
  pricesMap,
  priceMethod,
  localCurrency
}) => {
  const borrow = transactionsMap.get(txId);
  const updatedTransactionsMap = transactionsMap.set(txId, Object(external_immutable_["Map"])({
    tx_id: borrow.get('tx_id'),
    tx_type: 'DEPOSIT',
    timestamp: borrow.get('timestamp'),
    deposit_code: borrow.get('borrow_code'),
    deposit_amount: borrow.get('borrow_amount'),
    fee_tx_ids: borrow.get('fee_tx_ids', Object(external_immutable_["List"])())
  }));
  return lotsAndDisposalsFromDeposit({
    txId,
    transactionsMap: updatedTransactionsMap,
    pricesMap,
    priceMethod,
    localCurrency
  });
};
// CONCATENATED MODULE: ./src/accounting/compound_v2/repayBorrow.ts


const lotsAndDisposalsFromCompoundRepay = ({
  txId,
  transactionsMap,
  pricesMap,
  priceMethod,
  localCurrency
}) => {
  const repayment = transactionsMap.get(txId);
  const updatedTransactionsMap = transactionsMap.set(txId, Object(external_immutable_["Map"])({
    tx_id: repayment.get('tx_id'),
    tx_type: 'WITHDRAWAL',
    timestamp: repayment.get('timestamp'),
    withdrawal_code: repayment.get('repay_code'),
    withdrawal_amount: repayment.get('repay_amount'),
    fee_tx_ids: repayment.get('fee_tx_ids', Object(external_immutable_["List"])())
  }));
  return lotsAndDisposalsFromWithdrawal({
    txId,
    transactionsMap: updatedTransactionsMap,
    pricesMap,
    priceMethod,
    localCurrency,
    isBorrowRepay: true
  });
};
// CONCATENATED MODULE: ./src/accounting/compound_v2/liquidateBorrow_borrower.ts


const lotsAndDisposalsFromCompoundLiquidateBorrower = ({
  txId,
  transactionsMap,
  pricesMap,
  priceMethod,
  localCurrency
}) => {
  const transaction = transactionsMap.get(txId);
  const updatedTransactionsMap = transactionsMap.set(txId, Object(external_immutable_["Map"])({
    tx_id: transaction.get('tx_id'),
    tx_type: 'WITHDRAWAL',
    timestamp: transaction.get('timestamp'),
    withdrawal_code: transaction.get('liquidate_code'),
    withdrawal_amount: transaction.get('liquidate_amount'),
    fee_tx_ids: transaction.get('fee_tx_ids', Object(external_immutable_["List"])())
  }));
  return lotsAndDisposalsFromWithdrawal({
    txId,
    transactionsMap: updatedTransactionsMap,
    pricesMap,
    priceMethod,
    localCurrency,
    isCompoundLiquidated: true
  });
};
// CONCATENATED MODULE: ./src/accounting/compound_v2/liquidateBorrow_liquidator.ts





const lotsAndDisposalsFromCompoundLiquidateLiquidator = ({
  txId,
  transactionsMap,
  pricesMap,
  localCurrency
}) => {
  const transactionPrices = pricesMap.get(txId);
  const transaction = transactionsMap.get(txId);
  const unixNumber = transactionUnixNumber(transaction);
  const withdrawalCode = transaction.get('repay_code').toUpperCase();
  let withdrawalAmount = new external_bignumber_js_["BigNumber"](transaction.get('repay_amount'));
  const withdrawalPrice = getPriceBigNumber(transactionPrices, withdrawalCode, localCurrency);
  let proceedsAmount = withdrawalAmount.times(withdrawalPrice);
  const disposals = Object(external_immutable_["List"])([new src_disposal({
    unix: unixNumber,
    assetCode: withdrawalCode,
    assetAmount: withdrawalAmount,
    proceedsCode: localCurrency,
    proceedsAmount: proceedsAmount,
    transactionId: txId
  })]);
  const lotCode = transaction.get('seize_code').toUpperCase();
  let lotAmount = new external_bignumber_js_["BigNumber"](transaction.get('seize_amount'));
  const depositPrice = getPriceBigNumber(transactionPrices, lotCode, localCurrency);
  let basisAmount = lotAmount.times(depositPrice);
  const taxLots = Object(external_immutable_["List"])([new src_taxLot({
    unix: unixNumber,
    assetCode: lotCode,
    assetAmount: lotAmount,
    basisCode: localCurrency,
    basisAmount: basisAmount,
    transactionId: txId
  })]);
  return Object(external_immutable_["Map"])({
    taxLots: taxLots,
    disposals: disposals
  });
};
// CONCATENATED MODULE: ./src/accounting/transform.ts











const accountingFuncFromTransaction = transaction => {
  const TYPE_TO_FUNCTION = {
    TRADE: lotsAndDisposalsFromTrade,
    DEPOSIT: lotsAndDisposalsFromDeposit,
    WITHDRAWAL: lotsAndDisposalsFromWithdrawal,
    INCOME: lotsAndDisposalsFromIncome,
    LOST: lotsAndDisposalsFromLost,
    COMPOUND_MINT: lotsAndDisposalsFromMint,
    COMPOUND_REDEEM: lotsAndDisposalsFromCompoundRedeem,
    COMPOUND_BORROW: lotsAndDisposalsFromCompoundBorrow,
    COMPOUND_REPAYBORROW: lotsAndDisposalsFromCompoundRepay,
    COMPOUND_LIQUIDATEBORROW_BORROWER: lotsAndDisposalsFromCompoundLiquidateBorrower,
    COMPOUND_LIQUIDATEBORROW_LIQUIDATOR: lotsAndDisposalsFromCompoundLiquidateLiquidator
  };
  return TYPE_TO_FUNCTION[transaction.get('tx_type')];
};
// CONCATENATED MODULE: ./src/accounting/index.ts



const initialEntries = Object(external_immutable_["Map"])({
  taxLotList: Object(external_immutable_["List"])(),
  disposalList: Object(external_immutable_["List"])()
});
const makeLotsAndDisposals = ({
  prices,
  transactions,
  priceMethod,
  localCurrency
}) => {
  const pricesMap = groupBy(prices, t => t.get('tx_id'));
  const transactionsMap = Object(external_immutable_["Map"])(transactions.map(t => [t.get('tx_id'), t]));
  return transactions.reduce((reduction, transaction) => {
    const createAccountingEntries = accountingFuncFromTransaction(transaction);
    const entries = createAccountingEntries({
      txId: transaction.get('tx_id'),
      pricesMap,
      transactionsMap,
      priceMethod,
      localCurrency
    });
    return reduction.update('taxLotList', existingList => existingList.merge(entries.get('taxLots'))).update('disposalList', existingList => existingList.merge(entries.get('disposals')));
  }, initialEntries);
};
// CONCATENATED MODULE: ./src/validations.ts
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


const validateOptions = options => {
  const {
    prices,
    transactions,
    config: {
      local_currency = 'USD',
      price_method = 'BASE',
      cost_basis_method = 'FIFO',
      decimal_places = 2
    } = {}
  } = options;

  const toValidate = _objectSpread({
    prices,
    transactions
  }, options.config);

  Object.entries(toValidate).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      throw new InvalidParamError(`"${key}" must not be null or undefined.`);
    }
  });

  if (!Array.isArray(transactions)) {
    throw new InvalidParamError('"transactions" must be an array.');
  }

  if (!Array.isArray(prices)) {
    throw new InvalidParamError('"prices" must be an array.');
  }

  if (typeof local_currency !== 'string') {
    throw new InvalidParamError('"localCurrency" must be a string.');
  }

  if (typeof price_method !== 'string') {
    throw new InvalidParamError('"priceMethod" must be a string.');
  }

  if (typeof cost_basis_method !== 'string') {
    throw new InvalidParamError('"costBasisMethod" must be a string.');
  }

  if (typeof decimal_places !== 'number') {
    throw new InvalidParamError('"decimalPlaces" must be a number.');
  }

  if (transactions.length === 0) {
    throw new EmptyParamError('The "transactions" config parameter must include at least one object.');
  }
};
// CONCATENATED MODULE: ./src/report.ts







const createReport = options => {
  validateOptions(options);
  const {
    prices,
    transactions,
    config: {
      local_currency: localCurrency = 'USD',
      price_method: priceMethod = 'BASE',
      cost_basis_method: costBasisMethod = 'FIFO',
      decimal_places: decimalPlaces = 2,
      allow_lot_overlap: allowLotOverlap = true
    } = {}
  } = options;
  const lotsAndDisposals = makeLotsAndDisposals({
    prices: Object(external_immutable_["fromJS"])(prices),
    transactions: Object(external_immutable_["fromJS"])(transactions),
    priceMethod,
    localCurrency
  });
  const disposalList = lotsAndDisposals.get('disposalList');
  const taxLotList = lotsAndDisposals.get('taxLotList');
  const sortedDisposals = sortAccountingRecords({
    records: disposalList
  });
  const listToBuildYears = sortedDisposals.size > 0 ? sortedDisposals : sortAccountingRecords({
    records: taxLotList
  });
  const yearList = buildYearList(listToBuildYears);
  const reportIterable = buildReportIterable(sortedDisposals, yearList);
  const taxLotsByAsset = groupBy(taxLotList, lot => lot.assetCode);
  const taxReportOutput = buildReport({
    reportIterable,
    taxLotsByAsset,
    costBasisMethod,
    localCurrency,
    allowLotOverlap
  });
  const reportWithNegHoldings = applyUnmatchedSales(taxReportOutput);
  const plainJsReport = reportWithNegHoldings.toJS();
  const plainNumberReport = bigNumberToString(plainJsReport, 10, decimalPlaces);
  return {
    report: plainNumberReport,
    config: {
      price_method: priceMethod,
      cost_basis_method: costBasisMethod,
      decimal_places: decimalPlaces,
      local_currency: localCurrency,
      allow_lot_overlap: allowLotOverlap
    }
  };
};

const buildReport = options => {
  const {
    reportIterable,
    taxLotsByAsset,
    costBasisMethod,
    localCurrency,
    allowLotOverlap
  } = options;
  const output = reportIterable.reduce((acc, iterableYear) => {
    const reportYearSetup = acc.get('report').set(iterableYear.get('year'), Object(external_immutable_["fromJS"])({
      income: [],
      long: [],
      short: [],
      unmatched: [],
      lost: [],
      interest_income: [],
      assets: {}
    }));
    const reportIncomeSetup = updateReportIncomeFromLots(reportYearSetup, acc.get('lots'), iterableYear.get('year'));
    const reportWithHoldingChanges = setupAssetProperties(iterableYear.get('year'), reportIncomeSetup, iterableYear.get('disposals'), acc.get('lots'));
    const resultingReportAndLots = buildReportYear({
      disposals: iterableYear.get('disposals'),
      lots: acc.get('lots'),
      report: reportWithHoldingChanges,
      costBasisMethod,
      localCurrency,
      allowLotOverlap
    });
    const report = updateReportHoldingsFromLots(resultingReportAndLots, iterableYear.get('year'));
    return acc.set('report', report).set('lots', resultingReportAndLots.get('lots'));
  }, Object(external_immutable_["Map"])({
    lots: taxLotsByAsset,
    report: Object(external_immutable_["Map"])()
  }));
  return output.get('report');
};

const buildReportYear = options => {
  const {
    disposals,
    lots,
    report,
    costBasisMethod,
    localCurrency,
    allowLotOverlap
  } = options;
  const sortedDisposals = sortDisposals({
    records: disposals
  });
  return sortedDisposals.reduce((acc, disposal) => {
    const disposalAsset = disposal.assetCode;
    const disposalLots = acc.get('lots').get(disposalAsset, Object(external_immutable_["List"])());

    const beforeDisposal = lot => {
      if (allowLotOverlap) {
        return lot.unix <= disposal.unix;
      } else {
        return lot.unix < disposal.unix;
      }
    };

    const lotsForStack = disposalLots.filter(beforeDisposal);
    const sortedLots = lotSort(lotsForStack, costBasisMethod);
    const remainingLots = disposalLots.filterNot(beforeDisposal);
    const res = matchLots({
      disposal,
      lotsForStack: sortedLots,
      report: acc.get('report'),
      localCurrency
    });
    const lotsDepleted = res.get('lotsDepleted');
    const currentReport = res.get('currentReport');
    const assetLots = lotsDepleted.concat(remainingLots);
    const allLots = acc.get('lots').set(disposalAsset, assetLots);
    return acc.set('report', currentReport).set('lots', allLots);
  }, Object(external_immutable_["Map"])({
    report: report,
    lots: lots
  }));
};

const matchLots = options => {
  const {
    disposal,
    lotsForStack,
    report,
    localCurrency
  } = options;
  let currentDisposal = disposal;
  let lotStack = lotsForStack.toStack();
  let currentReport = report;

  while (currentDisposal.assetAmount > new external_bignumber_js_["BigNumber"](0)) {
    if (lotStack.size < 1) {
      const res = unmatchedDisposal(currentReport, currentDisposal, localCurrency);
      currentReport = res.get('report');
      currentDisposal = res.get('disposal');
    } else {
      if (currentDisposal.assetAmount.isGreaterThanOrEqualTo(lotStack.first().assetAmount)) {
        const res = exhaustLot(currentReport, currentDisposal, lotStack, localCurrency);
        currentReport = res.get('report');
        currentDisposal = res.get('disposal');
        lotStack = res.get('lotStack');
      } else {
        const res = exhaustDisposal(currentReport, currentDisposal, lotStack, localCurrency);
        currentReport = res.get('report');
        currentDisposal = res.get('disposal');
        lotStack = res.get('lotStack');
      }
    }
  }

  return Object(external_immutable_["Map"])({
    lotsDepleted: lotStack.toList(),
    currentReport: currentReport
  });
};
// CONCATENATED MODULE: ./src/index.ts
/* concated harmony reexport createReport */__webpack_require__.d(__webpack_exports__, "createReport", function() { return createReport; });


/* harmony default export */ var src = __webpack_exports__["default"] = (createReport);

/***/ })
/******/ ])["default"];