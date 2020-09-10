import { BigNumber } from 'bignumber.js';
import { Map as IMap, List } from 'immutable';

import TaxLot from '../../taxLot';
import Disposal from '../../disposal';
import { Deposit, Price, LocalCurrency } from '../../types';
import {
  transactionUnixNumber,
  transactionHasFee,
  transactionFeeCode,
  getPriceBigNumber
} from '../helpers';

/*
 * DEPOSIT
 * Creates a single TaxLot. Does not add income to the report,
 * and does not create any taxable events (due to lack of Disposal).
 * Creates a Disposal if there is a fee.
 *
 * USE CASES
 * Fiat: add fiat to your portfolio balances. OR, deposit fiat at
 * crypto exchange, and exchange charges you crypto fee (e.g. BNB).
 * Capital asset: add crypto to portfolio balance. Basis is determined
 * by the price on the date of deposit.
 *
 * TODO: allow for user to set their own basis. This would support
 * the use case that a user remembers the basis but not when or
 * where they acquired the captial asset.
 *
 */
export const lotsAndDisposalsFromDeposit = ({
  transaction,
  prices: transactionPricesList,
  localCurrency
}: {
  transaction: Deposit;
  prices: List<Price>;
  localCurrency: LocalCurrency;
}) => {
  // Setup helper constants.
  const txID = transaction.get('tx_id');
  const unixNumber = transactionUnixNumber(transaction);
  const hasFee = transactionHasFee(transaction);

  /*
   * (1) Get the basis amount to setup initial value for tax lot.
   */
  const lotCode = transaction.get('deposit_code').toUpperCase();
  let lotAmount = new BigNumber(transaction.get('deposit_amount'));
  const depositPrice = getPriceBigNumber(transactionPricesList, lotCode, localCurrency);
  let basisAmount = lotAmount.times(depositPrice);

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
    feePrice = getPriceBigNumber(transactionPricesList, feeCode, localCurrency);
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
      isIncome: false
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
