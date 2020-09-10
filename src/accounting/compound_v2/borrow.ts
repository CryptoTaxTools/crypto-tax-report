import { Map as IMap, List } from 'immutable';

import { CompoundBorrow, Price, LocalCurrency } from '../../types';
import { lotsAndDisposalsFromDeposit } from '../generic/deposit';

export const lotsAndDisposalsFromCompoundBorrow = ({
  transaction,
  prices,
  localCurrency
}: {
  transaction: CompoundBorrow;
  prices: List<Price>;
  localCurrency: LocalCurrency;
}) => {
  return lotsAndDisposalsFromDeposit({
    transaction: IMap({
      tx_id: transaction.get('tx_id'),
      tx_type: 'DEPOSIT',
      timestamp: transaction.get('timestamp'),
      deposit_code: transaction.get('borrow_code'),
      deposit_amount: transaction.get('borrow_amount')
    }),
    prices,
    localCurrency
  });
};
