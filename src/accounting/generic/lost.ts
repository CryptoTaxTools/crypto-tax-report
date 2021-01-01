import { List, Map as IMap } from 'immutable';
import { lotsAndDisposalsFromWithdrawal } from './withdrawal';
import {
  Price,
  LocalCurrency,
  ImmutableMap,
  ITransaction,
  PriceMethod,
  Withdrawal,
  Lost
} from '../../types';

interface LostOptions {
  txId: string;
  pricesMap: ImmutableMap<{ string: List<Price> }>;
  transactionsMap: ImmutableMap<{ string: List<ITransaction> }>;
  localCurrency: LocalCurrency;
  priceMethod: PriceMethod;
}

/*
 * LOST
 *
 * Creates a single Disposal.
 * Does NOT create a taxable event.
 */
export const lotsAndDisposalsFromLost = ({
  txId,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency
}: LostOptions) => {
  const updatedTransactionsMap = transactionsMap.set(
    txId,
    transactionsMap
      .get(txId)
      .set('tx_type', 'WITHDRAWAL')
      .set('withdrawal_code', transactionsMap.getIn([txId, 'lost_code']))
      .set('withdrawal_amount', transactionsMap.getIn([txId, 'lost_amount']))
      .delete('lost_code')
      .delete('lost_amount')
  );
  return lotsAndDisposalsFromWithdrawal({
    txId,
    pricesMap,
    transactionsMap: updatedTransactionsMap,
    priceMethod,
    localCurrency,
    isLost: true
  });
};
