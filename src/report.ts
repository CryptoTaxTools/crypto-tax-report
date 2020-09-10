import { Map as IMap, List, fromJS } from 'immutable';
import { BigNumber } from 'bignumber.js';

import {
  LocalCurrency,
  CostBasisMethod,
  TaxReportOutput,
  TaxReport,
  TaxReportOptions,
  ImmutableMap,
  TaxReportYear,
  BuildReportYearOptions,
  HackedStack,
  Price
} from './types';
import TaxLot from './taxLot';
import Disposal from './disposal';
import { unmatchedDisposal, exhaustLot, exhaustDisposal, lotSort } from './matchLogic';
import {
  buildReportIterable,
  updateReportHoldingsFromLots,
  buildYearList,
  sortAccountingRecords,
  applyUnmatchedSales,
  setupAssetProperties,
  updateReportIncomeFromLots,
  sortDisposals,
  groupBy
} from './reportHelpers';
import { bigNumberToString } from './utils/convert';
import { makeLotsAndDisposals } from './accounting';
import { validateOptions } from './validations';

export const createReport = (options: TaxReportOptions): TaxReportOutput => {
  validateOptions(options);
  const {
    prices,
    transactions,
    config: {
      localCurrency = 'USD',
      priceMethod = 'BASE',
      costBasisMethod = 'FIFO',
      decimalPlaces = 2
    } = {}
  } = options;

  const transactionsList = fromJS(transactions);
  const pricesList: List<Price> = fromJS(prices);
  const priceTableMap = groupBy(pricesList, (price) => price.get('tx_id'));
  const lotsAndDisposals = makeLotsAndDisposals({
    transactions: transactionsList,
    priceTable: priceTableMap,
    priceMethod,
    localCurrency
  });
  const disposalList: List<Disposal> = lotsAndDisposals.get('disposalList');
  const taxLotList: List<TaxLot> = lotsAndDisposals.get('taxLotList');
  // If there are no Disposals, then build the list of
  // years from TaxLots instead.
  const sortedDisposals = sortAccountingRecords({ records: disposalList });
  const listToBuildYears =
    sortedDisposals.size > 0 ? sortedDisposals : sortAccountingRecords({ records: taxLotList });
  const yearList = buildYearList(listToBuildYears);
  // Report iterable is a List of IMaps containing the year
  // string and disposals filtered by year.
  const reportIterable = buildReportIterable(sortedDisposals, yearList);
  const taxLotsByAsset = groupBy(taxLotList, (lot) => lot.assetCode);
  const taxReportOutput = buildReport({
    reportIterable,
    taxLotsByAsset,
    costBasisMethod,
    localCurrency
  });
  const reportWithNegHoldings = applyUnmatchedSales(taxReportOutput);
  const plainJsReport = reportWithNegHoldings.toJS();
  const plainNumberReport = bigNumberToString(plainJsReport, 10, decimalPlaces);

  return {
    report: plainNumberReport,
    config: {
      price_method: priceMethod,
      cost_basis_method: costBasisMethod
    }
  };
};

const buildReport = (options: {
  reportIterable: List<any>;
  taxLotsByAsset: IMap<string, List<TaxLot>>;
  costBasisMethod: CostBasisMethod;
  localCurrency: LocalCurrency;
}): TaxReport => {
  const { reportIterable, taxLotsByAsset, costBasisMethod, localCurrency } = options;

  const output = reportIterable.reduce((acc: IMap<any, any>, iterableYear: IMap<any, any>) => {
    // for each year
    const reportYearSetup = acc.get('report').set(
      iterableYear.get('year'),
      fromJS({
        income: [],
        long: [],
        short: [],
        unmatched: [],
        lost: [],
        interest_income: [],
        assets: {}
      })
    );

    const reportIncomeSetup = updateReportIncomeFromLots(
      reportYearSetup,
      acc.get('lots'),
      iterableYear.get('year')
    );

    // This may not be necessary long term.
    // We include "bought" and "sold" right now.
    const reportWithBoughtSold = setupAssetProperties(
      iterableYear.get('year'),
      reportIncomeSetup,
      iterableYear.get('disposals'),
      acc.get('lots')
    );

    const resultingReportAndLots = buildReportYear({
      disposals: iterableYear.get('disposals'),
      lots: acc.get('lots'),
      report: reportWithBoughtSold,
      costBasisMethod,
      localCurrency
    });

    const report = updateReportHoldingsFromLots(resultingReportAndLots, iterableYear.get('year'));

    return acc.set('report', report).set('lots', resultingReportAndLots.get('lots'));
  }, IMap({ lots: taxLotsByAsset, report: IMap() }));

  return output.get('report');
};

const buildReportYear = (
  options: BuildReportYearOptions
): ImmutableMap<{ report: TaxReportYear; lots: List<TaxLot> }> => {
  const { disposals, lots, report, costBasisMethod, localCurrency } = options;
  const sortedDisposals = sortDisposals({ records: disposals });

  // for each Disposal in year...
  return sortedDisposals.reduce(
    (acc: ImmutableMap<{ report: TaxReportYear; lots: List<TaxLot> }>, disposal: Disposal) => {
      const disposalAsset = disposal.assetCode;
      const disposalLots = acc.get('lots').get(disposalAsset, List());
      const beforeDisposal = (lot: TaxLot) => lot.unix <= disposal.unix;
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
    },
    IMap({
      report: report,
      lots: lots
    })
  );
};

// This is the core logic of the tax model.
// For each Disposal, match it against a TaxLot until the Disposal is reduced to a zero value.
const matchLots = (options: {
  disposal: Disposal;
  lotsForStack: List<TaxLot>;
  report: TaxReportYear;
  localCurrency: string;
}): ImmutableMap<{ lotsDepleted: List<TaxLot>; currentReport: TaxReportYear }> => {
  const { disposal, lotsForStack, report, localCurrency } = options;
  let currentDisposal = disposal;
  let lotStack: HackedStack<TaxLot> = lotsForStack.toStack();
  let currentReport = report;

  while (currentDisposal.assetAmount > new BigNumber(0)) {
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

  return IMap({
    lotsDepleted: lotStack.toList(),
    currentReport: currentReport
  });
};
