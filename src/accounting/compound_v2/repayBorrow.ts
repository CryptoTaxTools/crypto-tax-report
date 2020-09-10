import { Map as IMap, List } from 'immutable';

import { CompoundRepayBorrow, Price, LocalCurrency } from '../../types';
import { lotsAndDisposalsFromWithdrawal } from '../generic/withdrawal';

/*
 * COMPOUND_REPAYBORROW
 *
 * Creates Lots and Disposals associated with a compound COMPOUND_REPAYBORROW.
 */
export const lotsAndDisposalsFromCompoundRepay = ({
  transaction: repayment,
  prices,
  localCurrency
}: {
  prices: List<Price>;
  transaction: CompoundRepayBorrow;
  localCurrency: LocalCurrency;
}) => {
  const withdrawal = IMap({
    tx_id: repayment.get('tx_id'),
    tx_type: 'WITHDRAWAL',
    timestamp: repayment.get('timestamp'),
    withdrawal_code: repayment.get('repay_code'),
    withdrawal_amount: repayment.get('repay_amount'),
    fee_code: repayment.get('fee_code'),
    fee_amount: repayment.get('fee_amount')
  });
  return lotsAndDisposalsFromWithdrawal({
    prices,
    transaction: withdrawal,
    localCurrency,
    isBorrowRepay: true
  });
};
