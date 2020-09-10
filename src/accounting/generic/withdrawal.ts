import { Map as IMap, List } from 'immutable';
import { BigNumber } from 'bignumber.js';

import { Price, Withdrawal, LocalCurrency } from '../../types';
import Disposal from '../../disposal';
import {
  transactionUnixNumber,
  transactionHasFee,
  transactionFeeCode,
  getPriceBigNumber
} from '../helpers';

/*
 * WITHDRAWAL
 *
 * Creates a single Disposal (unless there are fees of other asset types).
 * Creates a taxable event (if it is a captial asset).
 *
 * USE CASES:
 * Fiat: withdraw cash cash from portfolio.
 * Captial asset: spending, gift.
 */
export const lotsAndDisposalsFromWithdrawal = ({
  prices,
  transaction,
  localCurrency,
  isLost = false,
  isBorrowRepay = false,
  isCompoundLiquidated = false
}: {
  prices: List<Price>;
  transaction: Withdrawal;
  localCurrency: LocalCurrency;
  isLost?: boolean;
  isBorrowRepay?: boolean;
  isCompoundLiquidated?: boolean;
}) => {
  // Setup helper constants.
  const txID = transaction.get('tx_id');
  const unixNumber = transactionUnixNumber(transaction);
  const hasFee = transactionHasFee(transaction);

  /*
   * (1) Get the withdrawal amount to setup initial value for proceeds.
   */
  const withdrawalCode = transaction.get('withdrawal_code').toUpperCase();
  let withdrawalAmount = new BigNumber(transaction.get('withdrawal_amount'));
  const withdrawalPrice = getPriceBigNumber(prices, withdrawalCode, localCurrency);
  let proceedsAmount = withdrawalAmount.times(withdrawalPrice);

  /*
   * (2) Adjust proceeds with applicable fees.
   */
  let feeCode;
  let feeAmount = new BigNumber(0);
  let feePrice;
  let taxableFeeAmount;
  if (hasFee) {
    feeCode = transactionFeeCode(transaction);
    feeAmount = new BigNumber(transaction.get('fee_amount'));
    feePrice = getPriceBigNumber(prices, feeCode, localCurrency);
    taxableFeeAmount = feeAmount.times(feePrice);
    proceedsAmount = proceedsAmount.minus(taxableFeeAmount);
  }

  /*
   * (3) Determine withdrawal Disposal values.
   */

  if (hasFee && feeCode === withdrawalCode) {
    withdrawalAmount = BigNumber.sum(withdrawalAmount, feeAmount);
  }

  const disposalList = List([
    new Disposal({
      unix: unixNumber,
      assetCode: withdrawalCode,
      assetAmount: withdrawalAmount,
      proceedsCode: localCurrency,
      proceedsAmount: proceedsAmount,
      transactionId: txID,
      isLost,
      isBorrowRepay,
      isCompoundLiquidated
    })
  ]);

  let otherDisposals = List();

  /*
   * (4) Standalone fees create their own disposal records.
   */
  if (hasFee && feeCode !== withdrawalCode) {
    otherDisposals = otherDisposals.push(
      new Disposal({
        unix: unixNumber,
        assetCode: feeCode,
        assetAmount: feeAmount,
        proceedsCode: localCurrency,
        proceedsAmount: taxableFeeAmount,
        transactionId: txID
      })
    );
  }

  const disposals = disposalList.merge(otherDisposals);

  return IMap({
    taxLots: List(),
    disposals: disposals
  });
};
