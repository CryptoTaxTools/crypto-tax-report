import { Map as IMap, List } from 'immutable';

import { accountingFuncFromTransaction } from './transform';
import { MakeLotsDisposalOptions, ImmutableMap, AccountingEntries } from '../types';
import { groupBy } from '../reportHelpers';
import TaxLot from '../taxLot';
import Disposal from '../disposal';

const initialEntries: AccountingEntries = IMap({ taxLotList: List(), disposalList: List() });

// Loop through each transaction to create TaxLots and Disposals.
export const makeLotsAndDisposals = ({
  prices,
  transactions,
  priceMethod,
  localCurrency
}: MakeLotsDisposalOptions): AccountingEntries => {
  const pricesMap = groupBy(prices, (t) => t.get('tx_id'));
  const transactionsMap = IMap(transactions.map((t) => [t.get('tx_id'), t]));
  return transactions.reduce((reduction, transaction) => {
    const createAccountingEntries = accountingFuncFromTransaction(transaction);
    const entries = createAccountingEntries({
      txId: transaction.get('tx_id'),
      pricesMap,
      transactionsMap,
      priceMethod,
      localCurrency
    });

    return reduction
      .update('taxLotList', (existingList: List<TaxLot>) =>
        existingList.merge(entries.get('taxLots'))
      )
      .update('disposalList', (existingList: List<Disposal>) =>
        existingList.merge(entries.get('disposals'))
      );
  }, initialEntries);
};
