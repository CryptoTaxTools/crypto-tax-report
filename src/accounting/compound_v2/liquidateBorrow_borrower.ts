import { Map as IMap, List } from 'immutable';

import { CompoundLiquidateBorrow_Borrower, Price, LocalCurrency } from '../../types';
import { lotsAndDisposalsFromWithdrawal } from '../generic/withdrawal';

/*
 * COMPOUND_LIQUIDATEBORROW_BORROWER
 *
 * Creates Disposals associated with a compound COMPOUND_LIQUIDATEBORROW_BORROWER.
 */
export const lotsAndDisposalsFromCompoundLiquidateBorrower = ({
  transaction,
  prices,
  localCurrency
}: {
  prices: List<Price>;
  transaction: CompoundLiquidateBorrow_Borrower;
  localCurrency: LocalCurrency;
}) => {
  const withdrawal = IMap({
    tx_id: transaction.get('tx_id'),
    tx_type: 'WITHDRAWAL',
    timestamp: transaction.get('timestamp'),
    withdrawal_code: transaction.get('liquidate_code'),
    withdrawal_amount: transaction.get('liquidate_amount'),
    fee_code: transaction.get('fee_code'),
    fee_amount: transaction.get('fee_amount')
  });
  return lotsAndDisposalsFromWithdrawal({
    transaction: withdrawal,
    prices,
    localCurrency,
    isCompoundLiquidated: true
  });
};
