import { Map as IMap, List } from 'immutable';

import { CompoundRedeem, Price, PriceMethod, LocalCurrency } from '../../types';
import { lotsAndDisposalsFromTrade } from '../generic/trade';

/*
 * COMPOUND_REDEEM
 *
 * Creates Lots and Disposals associated with a compound REDEEM.
 */
export const lotsAndDisposalsFromCompoundRedeem = ({
  prices,
  transaction: redeem,
  priceMethod,
  localCurrency
}: {
  prices: List<Price>;
  transaction: CompoundRedeem;
  localCurrency: LocalCurrency;
  priceMethod: PriceMethod;
}) => {
  return lotsAndDisposalsFromTrade({
    transaction: IMap({
      tx_id: redeem.get('tx_id'),
      tx_type: 'TRADE',
      side: 'BUY',
      timestamp: redeem.get('timestamp'),
      base_code: redeem.get('redeem_code'),
      base_amount: redeem.get('redeem_amount'),
      quote_code: redeem.get('c_token_code'),
      quote_amount: redeem.get('c_token_amount'),
      fee_amount: redeem.get('fee_amount'),
      fee_code: redeem.get('fee_code')
    }),
    prices,
    priceMethod,
    localCurrency,
    // We mark gains as interest income. Instead of inserting gains
    // in "short" or "long", it's inserted into "interest_income"
    gainsAsInterestIncome: true
  });
};
