import { BigNumber } from 'bignumber.js';
import { Map as IMap, List } from 'immutable';

import Disposal from '../disposal';
import { accountingFuncFromTransaction } from './transform';
import {
  Price,
  PriceMethod,
  LocalCurrency,
  ImmutableMap,
  Transaction,
  ITransaction
} from '../types';

/*
  About Fees:

  Fees reduce total tax liability, specifically the capital
  gain on each transaction. The gain is the proceeds minus cost basis.
  Therefore, increasing basis and reducing proceeds results in the same
  thing, lower gain.

  These benefits are realized at different times. For BUY trades,
  the focus is on the base asset acquired and fees are added to the cost basis
  of that tax lot. That tax lot can be sold in a following tax year.
  For SELL trades, the focus is on the base asset sold, and the fee reduces
  the proceeds of the sale. This happens in the same year the
  transaction occurs. In both cases, the taxable gain is reduced.

  Source: https://www.irs.gov/instructions/i8949

  When buying, commissions and fees are added to cost basis:
  "The basis of property you buy is usually its cost, including the
  purchase price and any costs of purchase, such as commissions."

  When selling, commissions and fees are subtracted from proceeds:
  "The net proceeds equal the gross proceeds minus any selling expenses
  (such as broker’s fees, commissions, and state and local transfer taxes)."
*/
export const getFeeAmount = ({
  transaction,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency
}: {
  transaction: ITransaction;
  pricesMap: ImmutableMap<{ string: List<Price> }>;
  transactionsMap: ImmutableMap<{ string: List<Transaction> }>;
  priceMethod: PriceMethod;
  localCurrency: LocalCurrency;
}) => {
  let taxableFeeAmount = new BigNumber('0');
  transaction.get('fee_tx_ids', List()).forEach((fee_tx_id: string) => {
    const feeTransaction = transactionsMap.get(fee_tx_id);
    const makeEntries = accountingFuncFromTransaction(feeTransaction);
    const entries = makeEntries({
      txId: feeTransaction.get('tx_id'),
      pricesMap,
      transactionsMap,
      priceMethod,
      localCurrency
    });
    entries.get('disposals').forEach((feeDisposal: Disposal) => {
      taxableFeeAmount = BigNumber.sum(taxableFeeAmount, feeDisposal.get('proceedsAmount'));
    });
  });
  return taxableFeeAmount;
};
