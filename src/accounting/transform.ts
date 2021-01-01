import { ITransaction } from '../types';

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

export const accountingFuncFromTransaction = (transaction: ITransaction) => {
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
  return TYPE_TO_FUNCTION[transaction.get('tx_type')];
};
