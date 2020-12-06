import { Map as IMap, List } from 'immutable';

import { Price, LocalCurrency, ImmutableMap, ITransaction, PriceMethod } from '../../types';
import { lotsAndDisposalsFromWithdrawal } from '../generic/withdrawal';

export interface RepayBorrowOptions {
  txId: string;
  pricesMap: ImmutableMap<{ string: List<Price> }>;
  transactionsMap: ImmutableMap<{ string: List<ITransaction> }>;
  priceMethod: PriceMethod;
  localCurrency: LocalCurrency;
}

/*
 * COMPOUND_REPAYBORROW
 *
 * Creates Lots and Disposals associated with a compound COMPOUND_REPAYBORROW.
 */
export const lotsAndDisposalsFromCompoundRepay = ({
  txId,
  transactionsMap,
  pricesMap,
  priceMethod,
  localCurrency
}: RepayBorrowOptions) => {
  const repayment = transactionsMap.get(txId);
  const updatedTransactionsMap = transactionsMap.set(
    txId,
    IMap({
      tx_id: repayment.get('tx_id'),
      tx_type: 'WITHDRAWAL',
      timestamp: repayment.get('timestamp'),
      withdrawal_code: repayment.get('repay_code'),
      withdrawal_amount: repayment.get('repay_amount'),
      fee_tx_ids: repayment.get('fee_tx_ids', List())
    })
  );
  return lotsAndDisposalsFromWithdrawal({
    txId,
    transactionsMap: updatedTransactionsMap,
    pricesMap,
    priceMethod,
    localCurrency,
    isBorrowRepay: true
  });
};
