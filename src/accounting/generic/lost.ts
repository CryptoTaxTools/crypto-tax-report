import { List, Map as IMap } from 'immutable';
import { Price, LocalCurrency, Withdrawal, Lost } from '../../types';
import { lotsAndDisposalsFromWithdrawal } from './withdrawal';

/*
 * LOST
 *
 * Creates a single Disposal.
 * Does NOT create a taxable event.
 */
export const lotsAndDisposalsFromLost = ({
  prices,
  transaction,
  localCurrency
}: {
  prices: List<Price>;
  transaction: Lost;
  localCurrency: LocalCurrency;
}) => {
  const withdrawal: Withdrawal = IMap({
    tx_id: transaction.get('tx_id'),
    tx_type: 'WITHDRAWAL',
    timestamp: transaction.get('timestamp'),
    withdrawal_code: transaction.get('lost_code'),
    withdrawal_amount: transaction.get('lost_amount'),
    fee_code: transaction.get('fee_code'),
    fee_amount: transaction.get('fee_amount')
  });
  return lotsAndDisposalsFromWithdrawal({
    transaction: withdrawal,
    prices,
    localCurrency,
    isLost: true
  });
};
