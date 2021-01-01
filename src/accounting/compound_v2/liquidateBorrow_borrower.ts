import { Map as IMap, List } from 'immutable';

import { GenericTransformOptions } from '../../types';
import { lotsAndDisposalsFromWithdrawal } from '../generic/withdrawal';

/*
 * COMPOUND_LIQUIDATEBORROW_BORROWER
 *
 * Creates Disposals associated with a compound COMPOUND_LIQUIDATEBORROW_BORROWER.
 */
export const lotsAndDisposalsFromCompoundLiquidateBorrower = ({
  txId,
  transactionsMap,
  pricesMap,
  priceMethod,
  localCurrency
}: GenericTransformOptions) => {
  const transaction = transactionsMap.get(txId);
  const updatedTransactionsMap = transactionsMap.set(
    txId,
    IMap({
      tx_id: transaction.get('tx_id'),
      tx_type: 'WITHDRAWAL',
      timestamp: transaction.get('timestamp'),
      withdrawal_code: transaction.get('liquidate_code'),
      withdrawal_amount: transaction.get('liquidate_amount'),
      fee_tx_ids: transaction.get('fee_tx_ids', List())
    })
  );
  return lotsAndDisposalsFromWithdrawal({
    txId,
    transactionsMap: updatedTransactionsMap,
    pricesMap,
    priceMethod,
    localCurrency,
    isCompoundLiquidated: true
  });
};
