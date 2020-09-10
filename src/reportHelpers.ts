import { Map as IMap, List, fromJS, Collection } from 'immutable';
import { BigNumber } from 'bignumber.js';

import { TaxReport } from './types';
import TaxLot from './taxLot';
import Disposal from './disposal';
import moment from 'moment';

export const applyUnmatchedSales = (report: TaxReport): IMap<any, any> => {
  let currentReport = report;
  report.reduce(
    (
      aggregatePriorSales: IMap<any, any>,
      reportYear: IMap<any, any>,
      year: string
    ): IMap<any, any> => {
      const unmatched = reportYear.get('unmatched');

      if (unmatched.size > 0) {
        const currentAndPriorSales = unmatched.reduce(
          (red: IMap<any, any>, unmatchedSale: IMap<any, any>) => {
            const existing = red.get(unmatchedSale.get('asset'), new BigNumber(0));
            return red.set(
              unmatchedSale.get('asset'),
              BigNumber.sum(existing, unmatchedSale.get('asset_amount'))
            );
          },
          aggregatePriorSales
        );

        // reduce total holdings per asset in report
        currentAndPriorSales.map((amount: BigNumber, holdingAsset: string) => {
          const keypath = [year, 'assets', holdingAsset, 'holdings'];
          const existingHoldings = currentReport.getIn(keypath, new BigNumber(0));
          currentReport = currentReport.setIn(keypath, existingHoldings.minus(amount));
        });

        return currentAndPriorSales;
      } else {
        aggregatePriorSales.map((amount: BigNumber, holdingAsset: string) => {
          const keypath = [year, 'assets', holdingAsset, 'holdings'];
          const existingHoldings = currentReport.getIn(keypath, new BigNumber(0));
          currentReport = currentReport.setIn(keypath, existingHoldings.minus(amount));
        });
        return aggregatePriorSales;
      }
    },
    IMap({})
  );

  return currentReport;
};

export const addIncomeToReport = (report: IMap<any, any>, taxLot: TaxLot): IMap<any, any> => {
  let reportToUpdate = report;
  if (taxLot.get('isIncome')) {
    const incomeMoment = moment.utc(taxLot.unix, 'X');
    const incomeYear = incomeMoment.format('YYYY');
    const income = IMap({
      asset: taxLot.assetCode,
      asset_amount: taxLot.assetAmount,
      date_acquired: incomeMoment.format(),
      basis_amount: taxLot.basisAmount,
      basis: taxLot.basisCode,
      tx_id: taxLot.transactionId
    });
    reportToUpdate = report.updateIn([incomeYear, 'income'], (list: List<any>) =>
      list.push(income)
    );
  }
  return IMap({
    report: reportToUpdate,
    taxLot: taxLot
  });
};

export const updateReportIncomeFromLots = (
  report: IMap<any, any>,
  lots: IMap<string, List<TaxLot>>,
  year: string
): IMap<any, any> => {
  const unixSOY = Number(
    moment
      .utc(year, 'YYYY')
      .startOf('year')
      .format('X')
  );
  const unixEOY = Number(
    moment
      .utc(year, 'YYYY')
      .endOf('year')
      .format('X')
  );
  lots.forEach((taxLots: List<TaxLot>) => {
    let reportWithIncome = report;
    reportWithIncome = taxLots
      .filter((lot: TaxLot) => {
        return lot.unix >= unixSOY && lot.unix <= unixEOY;
      })
      .reduce((acc: IMap<any, any>, lot: TaxLot) => {
        const res = addIncomeToReport(acc, lot);
        return res.get('report');
      }, reportWithIncome);
    report = report.set(year, reportWithIncome.get(year));
  });
  return report;
};

export const setupAssetProperties = (
  year: string,
  report: IMap<any, any>,
  yearDisposals: List<Disposal>,
  allLots: IMap<any, any>
): IMap<any, any> => {
  const unixSOY = Number(
    moment
      .utc(year, 'YYYY')
      .startOf('year')
      .format('X')
  );
  const unixEOY = Number(
    moment
      .utc(year, 'YYYY')
      .endOf('year')
      .format('X')
  );
  const reportWithBought = allLots.reduce(
    (accReport: IMap<any, any>, assetLots: List<TaxLot>, assetKey: string) => {
      const assetLotsInYear = assetLots.filter((lot: TaxLot) => {
        return lot.unix >= unixSOY && lot.unix <= unixEOY;
      });
      const assetReduction = assetLotsInYear.reduce((numReduction: BigNumber, lot: TaxLot) => {
        return BigNumber.sum(lot.assetAmount, numReduction);
      }, new BigNumber(0));
      // insert zero number for sold if not exists
      const existingSold = accReport.getIn([year, 'assets', assetKey, 'bought'], new BigNumber(0));
      const existingHoldings = accReport.getIn(
        [year, 'assets', assetKey, 'holdings'],
        new BigNumber(0)
      );
      return accReport
        .setIn([year, 'assets', assetKey, 'bought'], assetReduction)
        .setIn([year, 'assets', assetKey, 'sold'], existingSold)
        .setIn([year, 'assets', assetKey, 'holdings'], existingHoldings);
    },
    report
  );
  const reportWithSold = yearDisposals.reduce((accReport: IMap<any, any>, disposal: Disposal) => {
    const keypathSold = [year, 'assets', disposal.assetCode, 'sold'];
    const keypathBought = [year, 'assets', disposal.assetCode, 'bought'];
    const keypathHoldings = [year, 'assets', disposal.assetCode, 'holdings'];
    const existingSold = accReport.getIn(keypathSold, new BigNumber(0));
    const existingBought = accReport.getIn(keypathBought, new BigNumber(0));
    const existingHoldings = accReport.getIn(keypathHoldings, new BigNumber(0));
    return accReport
      .setIn(keypathSold, BigNumber.sum(existingSold, disposal.assetAmount))
      .setIn(keypathBought, existingBought)
      .setIn(keypathHoldings, existingHoldings);
  }, reportWithBought);
  return reportWithSold;
};

export const buildReportIterable = (sortedDisposals: List<any>, yearList: List<any>): List<any> => {
  return yearList.map((v) => {
    const stringYear = String(v);
    return IMap({
      year: stringYear,
      disposals: sortedDisposals.filter(
        (disposal: Disposal) => moment.utc(disposal.unix, 'X').format('YYYY') === stringYear
      )
    });
  });
};

export const updateReportHoldingsFromLots = (
  reportAndLots: IMap<any, any>,
  year: string
): IMap<any, any> => {
  const endOfYear = Number(
    moment
      .utc(year, 'YYYY')
      .endOf('year')
      .format('X')
  );
  let currentReport = reportAndLots.get('report');
  reportAndLots.get('lots').map((value: List<TaxLot>, lotAsset: string) => {
    const assetLotsInYear = value.filter((lot: TaxLot) => {
      return lot.unix < endOfYear;
    });
    if (assetLotsInYear.size > 0) {
      const assetHoldings = assetLotsInYear.reduce((acc: BigNumber, lot: TaxLot) => {
        return BigNumber.sum(lot.assetAmount, acc);
      }, new BigNumber(0));
      const keyPath = [year, 'assets', lotAsset, 'holdings'];
      const currentHoldings = currentReport.getIn(keyPath, new BigNumber(0));
      currentReport = currentReport.setIn(keyPath, BigNumber.sum(currentHoldings, assetHoldings));
    }
  });
  return currentReport;
};

export const buildYearList = (sorted: List<TaxLot | Disposal>): List<number> => {
  // ! tells Typescript compiler value is not undefined
  const firstYear = Number(moment.utc(sorted.get(0)!.unix, 'X').format('YYYY'));
  const lastYear = Number(moment.utc(sorted.get(-1)!.unix, 'X').format('YYYY'));
  const distance = lastYear - firstYear + 1;
  return fromJS(Array.from({ length: distance }, (_, i) => i + firstYear));
};

export const sortAccountingRecords = ({
  records
}: {
  records: List<TaxLot | Disposal>;
}): List<TaxLot | Disposal> => {
  return records.sort((a: any, b: any): number => a.unix - b.unix);
};

export const sortDisposals = ({ records }: { records: List<Disposal> }): List<Disposal> => {
  return records.sort((a: any, b: any): number => a.unix - b.unix);
};

// Helper function to convert collection return types back to Map and List
export const groupBy = (list: List<any>, grouper: (val: any) => any) => {
  return list
    .groupBy(grouper)
    .map((collection: Collection<any, any>) => collection.toList())
    .toMap();
};
