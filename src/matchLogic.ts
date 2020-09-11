import moment from 'moment';
import { Map as IMap, List } from 'immutable';
import { BigNumber } from 'bignumber.js';

import { HackedStack } from './types';
import TaxLot from './taxLot';
import Disposal from './disposal';

export const lotSort = (lots: List<TaxLot>, costMethod: string): List<TaxLot> => {
  const fifoComparator = (a: TaxLot, b: TaxLot): number => a.unix - b.unix;
  const hifoComparator = (a: TaxLot, b: TaxLot): number =>
    b.pricePerUnit.minus(a.pricePerUnit).toNumber();
  const lifoComparator = (a: TaxLot, b: TaxLot): number => b.unix - a.unix;
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

export const unmatchedDisposal = (
  report: IMap<any, any>,
  disposal: Disposal,
  localCurrency: string
): IMap<any, any> => {
  let reportToUpdate;
  const disposalMoment = moment.utc(disposal.unix, 'X');
  const disposalYear = disposalMoment.format('YYYY');
  const samedate = disposalMoment.format();
  const sale = IMap({
    asset: disposal.assetCode,
    proceeds: disposal.proceedsAmount,
    date_sold: samedate,
    cost_basis: '0',
    asset_amount: disposal.assetAmount,
    date_acquired: samedate
  });

  // Even if the disposal represents "lost" crypto
  // or fiat, if it's not matched against a TaxLot
  // we should know about it.
  reportToUpdate = report.updateIn([disposalYear, 'unmatched'], (list: List<any>) =>
    list.push(sale.set('transaction_id', disposal.transactionId))
  );

  if (disposal.isLost) {
    // we want to report lost crypto and fiat
    // for the user to decide how to report or claim it
    reportToUpdate = reportToUpdate.updateIn([disposalYear, 'lost'], (list: List<any>) =>
      list.push(sale)
    );
  } else if (disposal.isCompoundLiquidated) {
    reportToUpdate = reportToUpdate.updateIn(
      [disposalYear, 'compound_liquidations_borrower'],
      (list: List<any> = List()) => list.push(sale)
    );
  } else {
    if (disposal.isBorrowRepay) {
      reportToUpdate = reportToUpdate.updateIn(
        [disposalYear, 'borrow_repayments'],
        (list: List<any> = List()) => list.push(sale)
      );
    }
    // sales and resulting capital gain or loss only applies
    // to crypto not fiat
    // TODO: should exempt all fiat not just users local currency.
    if (disposal.assetCode !== localCurrency) {
      let reportCategory = 'short';
      if (disposal.gainsAsInterestIncome) {
        reportCategory = 'interest_income';
      }
      reportToUpdate = reportToUpdate.updateIn([disposalYear, reportCategory], (list: List<any>) =>
        list.push(sale)
      );
    }
  }

  return IMap({
    report: reportToUpdate,
    disposal: disposal.set('assetAmount', new BigNumber(0)).set('proceedsAmount', new BigNumber(0))
  });
};

export const exhaustLot = (
  report: IMap<any, any>,
  disposal: Disposal,
  lotStack: HackedStack<TaxLot>,
  localCurrency: string
): IMap<any, any> => {
  let currentReport = report;
  const lotToDiminish = lotStack.first();
  const disposalMoment = moment.utc(disposal.unix, 'X');
  const timeDiff = disposalMoment.diff(moment.utc(lotToDiminish.unix, 'X'));
  const isShort = moment.duration(timeDiff).asYears() < 1;
  const shareSold = lotToDiminish.assetAmount.dividedBy(disposal.assetAmount);
  const saleProceeds = disposal.proceedsAmount.times(shareSold);
  const disposalYear = disposalMoment.format('YYYY');
  const sale = IMap({
    asset: disposal.assetCode,
    proceeds: saleProceeds,
    date_sold: moment.utc(disposal.unix, 'X').format(),
    cost_basis: lotToDiminish.basisAmount,
    asset_amount: lotToDiminish.assetAmount,
    date_acquired: moment.utc(lotToDiminish.unix, 'X').format()
  });

  if (disposal.isLost) {
    // we want to report lost crypto and fiat
    // for the user to decide how to report or claim it
    currentReport = currentReport.updateIn([disposalYear, 'lost'], (list: List<any>) =>
      list.push(sale)
    );
  } else if (disposal.isCompoundLiquidated) {
    currentReport = currentReport.updateIn(
      [disposalYear, 'compound_liquidations_borrower'],
      (list: List<any> = List()) => list.push(sale)
    );
  } else if (disposal.assetCode !== localCurrency) {
    if (disposal.isBorrowRepay) {
      currentReport = currentReport.updateIn(
        [disposalYear, 'borrow_repayments'],
        (list: List<any> = List()) => list.push(sale)
      );
    }
    // only report sale if not fiat (local currency) disposal
    let reportCategory = isShort ? 'short' : 'long';
    if (disposal.gainsAsInterestIncome) {
      reportCategory = 'interest_income';
    }
    currentReport = currentReport.updateIn([disposalYear, reportCategory], (list: List<any>) =>
      list.push(sale)
    );
  }

  const currentDisposal = disposal
    .set('assetAmount', disposal.assetAmount.minus(lotToDiminish.assetAmount))
    .set('proceedsAmount', disposal.proceedsAmount.minus(saleProceeds));

  return IMap({
    report: currentReport,
    disposal: currentDisposal,
    lotStack: lotStack.pop()
  });
};

export const exhaustDisposal = (
  report: IMap<any, any>,
  disposal: Disposal,
  lotStack: HackedStack<TaxLot>,
  localCurrency: string
): IMap<any, any> => {
  let currentReport = report;

  const lotToDiminish = lotStack.first();

  const disposalMoment = moment.utc(disposal.unix, 'X');
  const timeDiff = disposalMoment.diff(moment.utc(lotToDiminish.unix, 'X'));
  const isShort = moment.duration(timeDiff).asYears() < 1;

  // lot is not exhausted
  // you sold ALL of the remaining disposal
  const shareLotSold = disposal.assetAmount.dividedBy(lotToDiminish.assetAmount);
  const costBasisSold = lotToDiminish.basisAmount.times(shareLotSold);
  const disposalYear = disposalMoment.format('YYYY');
  const sale = IMap({
    asset: disposal.assetCode,
    proceeds: disposal.proceedsAmount,
    date_sold: moment.utc(disposal.unix, 'X').format(),
    cost_basis: costBasisSold,
    asset_amount: disposal.assetAmount,
    date_acquired: moment.utc(lotToDiminish.unix, 'X').format()
  });

  if (disposal.isLost) {
    // we want to report lost crypto and fiat
    // for the user to decide how to report or claim it
    currentReport = report.updateIn([disposalYear, 'lost'], (list: List<any>) => list.push(sale));
  } else if (disposal.isCompoundLiquidated) {
    currentReport = currentReport.updateIn(
      [disposalYear, 'compound_liquidations_borrower'],
      (list: List<any> = List()) => list.push(sale)
    );
  } else if (disposal.assetCode !== localCurrency) {
    if (disposal.isBorrowRepay) {
      currentReport = currentReport.updateIn(
        [disposalYear, 'borrow_repayments'],
        (list: List<any> = List()) => list.push(sale)
      );
    }
    let reportCategory = isShort ? 'short' : 'long';
    if (disposal.gainsAsInterestIncome) {
      reportCategory = 'interest_income';
    }
    currentReport = currentReport.updateIn([disposalYear, reportCategory], (list: List<any>) =>
      list.push(sale)
    );
  }

  const lotToPush = lotToDiminish
    .set('assetAmount', lotToDiminish.assetAmount.minus(disposal.assetAmount))
    .set('basisAmount', lotToDiminish.basisAmount.minus(costBasisSold));

  const currentDisposal = disposal
    .set('assetAmount', new BigNumber(0))
    .set('proceedsAmount', new BigNumber(0));

  return IMap({
    report: currentReport,
    disposal: currentDisposal,
    lotStack: lotStack.pop().push(lotToPush)
  });
};
