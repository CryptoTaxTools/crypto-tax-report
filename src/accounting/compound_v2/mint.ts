import { Map as IMap, List } from 'immutable';

import { CompoundMint, Price, PriceMethod, LocalCurrency } from '../../types';
import { lotsAndDisposalsFromTrade } from '../generic/trade';

// Minting is treated the same as a trade.
// Special tax treatment happens when redeeming.
export const lotsAndDisposalsFromMint = ({
  transaction: mint,
  prices,
  priceMethod,
  localCurrency
}: {
  transaction: CompoundMint;
  prices: List<Price>;
  priceMethod: PriceMethod;
  localCurrency: LocalCurrency;
}) => {
  const trade = IMap({
    tx_id: mint.get('tx_id'),
    tx_type: 'TRADE',
    timestamp: mint.get('timestamp'),
    side: 'BUY',
    base_amount: mint.get('c_token_amount'),
    base_code: mint.get('c_token_code'),
    quote_amount: mint.get('supplied_amount'),
    quote_code: mint.get('supplied_code'),
    fee_amount: mint.get('fee_amount'),
    fee_code: mint.get('fee_code')
  });
  return lotsAndDisposalsFromTrade({ transaction: trade, prices, priceMethod, localCurrency });
};
