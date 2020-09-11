import { Map as IMap, List } from 'immutable';

import { MakeLotsDisposalOptions, ImmutableMap } from '../types';
import TaxLot from '../taxLot';
import Disposal from '../disposal';

import { lotsAndDisposalsFromTrade } from './generic/trade';
import { lotsAndDisposalsFromDeposit } from './generic/deposit';
import { lotsAndDisposalsFromWithdrawal } from './generic/withdrawal';
import { lotsAndDisposalsFromIncome } from './generic/income';
import { lotsAndDisposalsFromLost } from './generic/lost';

import { lotsAndDisposalsFromMint } from './compound_v2/mint';
import { lotsAndDisposalsFromCompoundRedeem } from './compound_v2/redeem';
import { lotsAndDisposalsFromCompoundBorrow } from './compound_v2/borrow';
import { lotsAndDisposalsFromCompoundRepay } from './compound_v2/repayBorrow';
import { lotsAndDisposalsFromCompoundLiquidateBorrower } from './compound_v2/liquidateBorrow_borrower';
import { lotsAndDisposalsFromCompoundLiquidateLiquidator } from './compound_v2/liquidateBorrow_liquidator';

type AccountingEntries = ImmutableMap<{
  disposalList: List<Disposal>;
  taxLotList: List<TaxLot>;
}>;

const initialEntries: AccountingEntries = IMap({ taxLotList: List(), disposalList: List() });

// Loop through each transaction to create TaxLots and Disposals.
export const makeLotsAndDisposals = ({
  transactions,
  priceTable,
  priceMethod,
  localCurrency
}: MakeLotsDisposalOptions): AccountingEntries => {
  return transactions.reduce((reduction, transaction) => {
    const TYPE_TO_FUNCTION: { [tx_type: string]: Function } = {
      TRADE: lotsAndDisposalsFromTrade,
      DEPOSIT: lotsAndDisposalsFromDeposit,
      WITHDRAWAL: lotsAndDisposalsFromWithdrawal,
      INCOME: lotsAndDisposalsFromIncome,
      LOST: lotsAndDisposalsFromLost,
      COMPOUND_MINT: lotsAndDisposalsFromMint,
      COMPOUND_REDEEM: lotsAndDisposalsFromCompoundRedeem,
      COMPOUND_BORROW: lotsAndDisposalsFromCompoundBorrow,
      COMPOUND_REPAYBORROW: lotsAndDisposalsFromCompoundRepay,
      COMPOUND_LIQUIDATEBORROW_BORROWER: lotsAndDisposalsFromCompoundLiquidateBorrower,
      COMPOUND_LIQUIDATEBORROW_LIQUIDATOR: lotsAndDisposalsFromCompoundLiquidateLiquidator
    };
    const createAccountingEntries = TYPE_TO_FUNCTION[transaction.get('tx_type')];
    const prices = priceTable.get(transaction.get('tx_id'));
    const params = { prices, transaction, priceMethod, localCurrency };
    const entries = createAccountingEntries(params);

    return reduction
      .update('taxLotList', (existingList: List<TaxLot>) =>
        existingList.merge(entries.get('taxLots'))
      )
      .update('disposalList', (existingList: List<Disposal>) =>
        existingList.merge(entries.get('disposals'))
      );
  }, initialEntries);
};
