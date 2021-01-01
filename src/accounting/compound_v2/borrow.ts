import { Map as IMap, List } from 'immutable';

import { Price, LocalCurrency, ImmutableMap, ITransaction, PriceMethod } from '../../types';
import { lotsAndDisposalsFromDeposit } from '../generic/deposit';

export interface BorrowOptions {
  txId: string;
  pricesMap: ImmutableMap<{ string: List<Price> }>;
  transactionsMap: ImmutableMap<{ string: List<ITransaction> }>;
  priceMethod: PriceMethod;
  localCurrency: LocalCurrency;
}

export const lotsAndDisposalsFromCompoundBorrow = ({
  txId,
  transactionsMap,
  pricesMap,
  priceMethod,
  localCurrency
}: BorrowOptions) => {
  const borrow = transactionsMap.get(txId);
  const updatedTransactionsMap = transactionsMap.set(
    txId,
    IMap({
      tx_id: borrow.get('tx_id'),
      tx_type: 'DEPOSIT',
      timestamp: borrow.get('timestamp'),
      deposit_code: borrow.get('borrow_code'),
      deposit_amount: borrow.get('borrow_amount'),
      fee_tx_ids: borrow.get('fee_tx_ids', List())
    })
  );
  return lotsAndDisposalsFromDeposit({
    txId,
    transactionsMap: updatedTransactionsMap,
    pricesMap,
    priceMethod,
    localCurrency
  });
};
