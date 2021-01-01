import { Map as IMap, List } from 'immutable';
import { BigNumber } from 'bignumber.js';

import { Price, LocalCurrency, ImmutableMap, ITransaction, PriceMethod } from '../../types';
import Disposal from '../../disposal';
import { transactionUnixNumber, getPriceBigNumber } from '../helpers';
import { getFeeAmount } from '../fee';

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
  txId,
  pricesMap,
  transactionsMap,
  localCurrency,
  priceMethod,
  isLost = false,
  isBorrowRepay = false,
  isCompoundLiquidated = false
}: {
  txId: string;
  pricesMap: ImmutableMap<{ string: List<Price> }>;
  transactionsMap: ImmutableMap<{ string: List<ITransaction> }>;
  localCurrency: LocalCurrency;
  priceMethod: PriceMethod;
  isLost?: boolean;
  isBorrowRepay?: boolean;
  isCompoundLiquidated?: boolean;
}) => {
  const transactionPrices = pricesMap.get(txId);
  const transaction = transactionsMap.get(txId);
  const unixNumber = transactionUnixNumber(transaction);

  /*
   * (1) Get the withdrawal amount to setup initial value for proceeds.
   */
  const withdrawalCode = transaction.get('withdrawal_code').toUpperCase();
  let withdrawalAmount = new BigNumber(transaction.get('withdrawal_amount'));
  const withdrawalPrice = getPriceBigNumber(transactionPrices, withdrawalCode, localCurrency);
  let proceedsAmount = withdrawalAmount.times(withdrawalPrice);

  // (2) Adjust basis or proceeds with fees.
  // Reduce taxable gain by the value of the fees.
  // See fees.tx for more info.
  const taxableFeeAmount = getFeeAmount({
    transaction,
    pricesMap,
    transactionsMap,
    localCurrency,
    priceMethod
  });
  // Since this is a withdrawal (sale), fee reduces proceeds.
  proceedsAmount = proceedsAmount.minus(taxableFeeAmount);

  return IMap({
    taxLots: List(),
    disposals: List([
      new Disposal({
        unix: unixNumber,
        assetCode: withdrawalCode,
        assetAmount: withdrawalAmount,
        proceedsCode: localCurrency,
        proceedsAmount: proceedsAmount,
        transactionId: txId,
        isLost,
        isBorrowRepay,
        isCompoundLiquidated
      })
    ])
  });
};
