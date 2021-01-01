import { Map as IMap, List } from 'immutable';

import {
  CompoundMint,
  Price,
  PriceMethod,
  LocalCurrency,
  ImmutableMap,
  ITransaction
} from '../../types';
import { lotsAndDisposalsFromTrade } from '../generic/trade';

export interface MintOptions {
  txId: string;
  pricesMap: ImmutableMap<{ string: List<Price> }>;
  transactionsMap: ImmutableMap<{ string: List<ITransaction> }>;
  priceMethod: PriceMethod;
  localCurrency: LocalCurrency;
}

// Minting is treated the same as a trade.
// Special tax treatment happens when redeeming.
export const lotsAndDisposalsFromMint = ({
  txId,
  transactionsMap,
  pricesMap,
  priceMethod,
  localCurrency
}: MintOptions) => {
  const mint = transactionsMap.get(txId);
  const updatedTransactionsMap = transactionsMap.set(
    txId,
    IMap({
      tx_id: mint.get('tx_id'),
      tx_type: 'TRADE',
      timestamp: mint.get('timestamp'),
      side: 'BUY',
      base_amount: mint.get('c_token_amount'),
      base_code: mint.get('c_token_code'),
      quote_amount: mint.get('supplied_amount'),
      quote_code: mint.get('supplied_code'),
      fee_tx_ids: mint.get('fee_tx_ids', List())
    })
  );
  return lotsAndDisposalsFromTrade({
    txId,
    transactionsMap: updatedTransactionsMap,
    pricesMap,
    priceMethod,
    localCurrency
  });
};
