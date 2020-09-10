import { BigNumber } from 'bignumber.js';
import { Map as IMap, List } from 'immutable';

import TaxLot from '../../taxLot';
import Disposal from '../../disposal';
import { Income, Price, LocalCurrency } from '../../types';
import {
  transactionUnixNumber,
  transactionHasFee,
  transactionFeeCode,
  getPriceBigNumber
} from '../helpers';

/*
 * INCOME
 *
 * This creates a single TaxLot. And Disposal if there is a fee.
 * Income is added to your tax report. Income is
 * taxed at the normal income tax rates.
 * Works for both fiat and capital assets.
 */
export const lotsAndDisposalsFromIncome = ({
  prices,
  transaction,
  localCurrency
}: {
  prices: List<Price>;
  transaction: Income;
  localCurrency: LocalCurrency;
}) => {
  // Setup helper constants.
  const txID = transaction.get('tx_id');
  const unixNumber = transactionUnixNumber(transaction);
  const hasFee = transactionHasFee(transaction);

  /*
   * (1) Get the basis amount to setup initial value for tax lot.
   */
  const lotCode = transaction.get('income_code').toUpperCase();
  let lotAmount = new BigNumber(transaction.get('income_amount'));
  const incomePrice = getPriceBigNumber(prices, lotCode, localCurrency);
  let basisAmount = lotAmount.times(incomePrice);

  /*
   * (2) Adjust basis with applicable fees.
   */
  let feeCode;
  let feeAmount = new BigNumber('0');
  let feePrice;
  let taxableFeeAmount;
  if (hasFee) {
    feeCode = transactionFeeCode(transaction);
    feeAmount = new BigNumber(transaction.get('fee_amount'));
    feePrice = getPriceBigNumber(prices, feeCode, localCurrency);
    taxableFeeAmount = feeAmount.times(feePrice);
    basisAmount = BigNumber.sum(basisAmount, taxableFeeAmount);
  }

  /*
   * (3) Determine TaxLot values.
   */
  if (hasFee && feeCode === lotCode) {
    lotAmount = lotAmount.minus(feeAmount);
  }

  const taxLots = List([
    new TaxLot({
      unix: unixNumber,
      assetCode: lotCode,
      assetAmount: lotAmount,
      basisCode: localCurrency,
      basisAmount: basisAmount,
      transactionId: txID,
      isIncome: true
    })
  ]);

  /*
   * (4) Determine fee Disposal values.
   */

  let disposalList = List();

  if (hasFee && feeCode !== lotCode) {
    disposalList = List([
      new Disposal({
        unix: unixNumber,
        assetCode: feeCode,
        assetAmount: feeAmount,
        proceedsCode: localCurrency,
        proceedsAmount: taxableFeeAmount,
        transactionId: txID
      })
    ]);
  }

  return IMap({
    taxLots: taxLots,
    disposals: disposalList
  });
};
