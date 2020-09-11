import { Map as IMap, List, Stack } from 'immutable';

import TaxLot from './taxLot';
import Disposal from './disposal';

export type PriceMethod = 'QUOTE' | 'BASE';
export type CostBasisMethod = 'FIFO' | 'LIFO' | 'HIFO';
export type LocalCurrency = string;
export interface ImmutableMap<T> extends IMap<string, any> {}

// immutable's stack type definition is incomplete.
export interface HackedStack<TaxLot> extends Stack<TaxLot> {
  first(): TaxLot;
}

export interface TaxReportYearAssetBreakdown {
  bought: string;
  sold: string;
  holdings: string;
}

export interface ReportIncome {
  asset: string;
  asset_amount: string;
  date_acquired: string;
  basis_amount: string;
  basis: string;
  tx_id: string;
}

export interface ReportSale {
  asset: string;
  asset_amount: string;
  date_acquired: string;
  date_sold: string;
  proceeds: string;
  cost_basis: string;
  transaction_id?: string;
}

export interface TaxReportYearAssets {
  [asset_code: string]: TaxReportYearAssetBreakdown;
}

export interface TaxReportYear extends IMap<any, any> {
  assets: TaxReportYearAssets;
  income: ReportIncome[];
  long: ReportSale[];
  short: ReportSale[];
  unmatched: ReportSale[];
  lost: ReportSale[];
  interest_income: ReportSale[];
  borrow_repayments: ReportSale[];
  compound_liquidations_borrower: ReportSale[];
}

export type TaxReport = ImmutableMap<{
  [year: string]: TaxReportYear;
}>;

export interface TaxReportOutput {
  report: TaxReport;
  config: TaxReportConfig;
}

export interface TaxReportConfig {
  cost_basis_method: CostBasisMethod;
  price_method: PriceMethod;
}

export interface TaxRepoortOptionsConfig {
  // localCurrency is the asset identifier that excludes activity from being
  // recorded as a taxable event when it otherwise would be.
  localCurrency: LocalCurrency;
  // priceMethod determines the price used to determine the cost basis
  // or sale price used for a reportable transaction.
  priceMethod: PriceMethod;
  // costBasisMethod determines the sorting order of the TaxLot list
  // that Disposals are applied against.
  costBasisMethod: CostBasisMethod;
  // decimalPlaces represents the number of places to use
  // in tax report figures.
  decimalPlaces: number;
}

export type Transaction =
  | TradeInput
  | DepositInput
  | WithdrawalInput
  | IncomeInput
  | LostInput
  | CompoundMintInput
  | CompoundBorrowInput
  | CompoundRedeemInput
  | CompoundRepayBorrowInput
  | CompoundLiquidateBorrow_BorrowerInput
  | CompoundLiquidateBorrow_LiquidatorInput;

export type Transactions = Transaction[];

export type ITransaction =
  | Trade
  | Deposit
  | Withdrawal
  | Income
  | Lost
  | CompoundMint
  | CompoundBorrow
  | CompoundRedeem
  | CompoundRepayBorrow
  | CompoundLiquidateBorrow_Borrower
  | CompoundLiquidateBorrow_Liquidator;

export interface TaxReportOptions {
  transactions: Transactions;
  prices: Array<PriceInput>;
  config: TaxRepoortOptionsConfig;
}

// Transaction input types

export interface TradeInput {
  tx_id: string;
  tx_type: 'TRADE';
  timestamp: string;
  side: 'BUY' | 'SELL' | 'NONE';
  base_amount: string;
  base_code: string;
  quote_amount: string;
  quote_code: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type Trade = ImmutableMap<TradeInput>;

export interface DepositInput {
  tx_id: string;
  tx_type: 'DEPOSIT';
  timestamp: string;
  deposit_code: string;
  deposit_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type Deposit = ImmutableMap<DepositInput>;

export interface WithdrawalInput {
  tx_id: string;
  tx_type: 'WITHDRAWAL';
  timestamp: string;
  withdrawal_code: string;
  withdrawal_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type Withdrawal = ImmutableMap<WithdrawalInput>;

export interface IncomeInput {
  tx_id: string;
  tx_type: 'INCOME';
  timestamp: string;
  income_code: string;
  income_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type Income = ImmutableMap<IncomeInput>;

export interface LostInput {
  tx_id: string;
  tx_type: 'LOST';
  timestamp: string;
  lost_code: string;
  lost_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type Lost = ImmutableMap<LostInput>;

export interface CompoundMintInput {
  tx_id: string;
  tx_type: 'COMPOUND_MINT';
  timestamp: string;
  c_token_code: string;
  c_token_amount: string;
  supplied_code: string;
  supplied_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type CompoundMint = ImmutableMap<CompoundMintInput>;

export interface CompoundBorrowInput {
  tx_id: string;
  tx_type: 'COMPOUND_BORROW';
  timestamp: string;
  borrow_code: string;
  borrow_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type CompoundBorrow = ImmutableMap<CompoundBorrowInput>;

export interface CompoundRedeemInput {
  tx_id: string;
  tx_type: 'COMPOUND_REDEEM';
  timestamp: string;
  redeem_code: string;
  redeem_amount: string;
  c_token_code: string;
  c_token_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type CompoundRedeem = ImmutableMap<CompoundRedeemInput>;

export interface CompoundRepayBorrowInput {
  tx_id: string;
  tx_type: 'COMPOUND_REPAYBORROW';
  timestamp: string;
  repay_code: string;
  repay_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type CompoundRepayBorrow = ImmutableMap<CompoundRepayBorrowInput>;

export interface CompoundLiquidateBorrow_BorrowerInput {
  tx_id: string;
  tx_type: 'COMPOUND_LIQUIDATEBORROW_BORROWER';
  timestamp: string;
  liquidate_code: string;
  liquidate_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type CompoundLiquidateBorrow_Borrower = ImmutableMap<CompoundLiquidateBorrow_BorrowerInput>;

export interface CompoundLiquidateBorrow_LiquidatorInput {
  tx_id: string;
  tx_type: 'COMPOUND_LIQUIDATEBORROW_LIQUIDATOR';
  timestamp: string;
  repay_code: string;
  repay_amount: string;
  seize_code: string;
  seize_amount: string;
  fee_amount?: string | null | undefined;
  fee_code?: string | null | undefined;
}

export type CompoundLiquidateBorrow_Liquidator = ImmutableMap<
  CompoundLiquidateBorrow_LiquidatorInput
>;

export interface PriceInput {
  tx_id: string;
  timestamp: string;
  base_code: string;
  quote_code: string;
  price: string;
}

export type Price = ImmutableMap<PriceInput>;
export interface MakeLotsDisposalOptions {
  transactions: List<Trade | IMap<any, any>>;
  priceTable: ImmutableMap<{ any: List<Price> }>;
  priceMethod: PriceMethod;
  localCurrency: LocalCurrency;
}

export interface BuildReportYearOptions {
  disposals: List<Disposal>;
  lots: List<TaxLot>;
  report: IMap<any, any>;
  costBasisMethod: CostBasisMethod;
  localCurrency: LocalCurrency;
}
