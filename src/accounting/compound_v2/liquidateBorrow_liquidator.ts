import { Map as IMap, List } from 'immutable';
import { BigNumber } from 'bignumber.js';

import TaxLot from '../../taxLot';
import Disposal from '../../disposal';
import { CompoundLiquidateBorrow_Liquidator, Price, LocalCurrency } from '../../types';
import { transactionUnixNumber, getPriceBigNumber } from '../helpers';

/*
 * COMPOUND_LIQUIDATEBORROW_LIQUIDATOR
 *
 * Creates TaxLots and Disposals associated with a compound COMPOUND_LIQUIDATEBORROW_LIQUIDATOR.
 * Liquidating someone results in:
 * - spending (the amount used to repay another users position)
 * - deposit (the cTokens transferred to the liquidator)
 *
 * Notes:
 * base asset: the asset used for repayment of another user's position
 * quote asset: the cTokens transferred to the liquidator
 */
export const lotsAndDisposalsFromCompoundLiquidateLiquidator = ({
  transaction,
  prices,
  localCurrency
}: {
  prices: List<Price>;
  transaction: CompoundLiquidateBorrow_Liquidator;
  localCurrency: LocalCurrency;
}) => {
  // Setup helper constants.
  const txID = transaction.get('tx_id');
  const unixNumber = transactionUnixNumber(transaction);

  /*
   * (1) Get the amount used to repay the original borrowers position
   */
  const withdrawalCode = transaction.get('repay_code').toUpperCase();
  let withdrawalAmount = new BigNumber(transaction.get('repay_amount'));
  const withdrawalPrice = getPriceBigNumber(prices, withdrawalCode, localCurrency);
  let proceedsAmount = withdrawalAmount.times(withdrawalPrice);

  /*
   * (2) Determine Disposal values from the liquidation
   */

  const disposals = List([
    new Disposal({
      unix: unixNumber,
      assetCode: withdrawalCode,
      assetAmount: withdrawalAmount,
      proceedsCode: localCurrency,
      proceedsAmount: proceedsAmount,
      transactionId: txID
    })
  ]);

  /*
   * (3) Get the seized token values to generate a TaxLot
   */
  const lotCode = transaction.get('seize_code').toUpperCase();
  let lotAmount = new BigNumber(transaction.get('seize_amount'));
  const depositPrice = getPriceBigNumber(prices, lotCode, localCurrency);
  let basisAmount = lotAmount.times(depositPrice);

  const taxLots = List([
    new TaxLot({
      unix: unixNumber,
      assetCode: lotCode,
      assetAmount: lotAmount,
      basisCode: localCurrency,
      basisAmount: basisAmount,
      transactionId: txID
    })
  ]);

  return IMap({
    taxLots: taxLots,
    disposals: disposals
  });
};
