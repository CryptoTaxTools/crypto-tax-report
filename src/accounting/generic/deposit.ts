import { BigNumber } from 'bignumber.js';
import { Map as IMap, List } from 'immutable';

import TaxLot from '../../taxLot';
import { getFeeAmount } from '../fee';
import { transactionUnixNumber, getPriceBigNumber } from '../helpers';
import { Price, LocalCurrency, ImmutableMap, ITransaction, PriceMethod } from '../../types';

export interface DepositOptions {
  txId: string;
  pricesMap: ImmutableMap<{ string: List<Price> }>;
  transactionsMap: ImmutableMap<{ string: List<ITransaction> }>;
  localCurrency: LocalCurrency;
  priceMethod: PriceMethod;
}

/*
 * DEPOSIT
 * Creates a single TaxLot. Does not add income to the report,
 * and does not create any taxable events (due to lack of Disposal).
 * Creates a Disposal if there is a fee.
 *
 * USE CASES
 * Fiat: add fiat to your portfolio balances. OR, deposit fiat at
 * crypto exchange, and exchange charges you crypto fee (e.g. BNB).
 * Capital asset: add crypto to portfolio balance. Basis is determined
 * by the price on the date of deposit.
 *
 * TODO: allow for user to set their own basis. This would support
 * the use case that a user remembers the basis but not when or
 * where they acquired the captial asset.
 *
 */
export const lotsAndDisposalsFromDeposit = ({
  txId,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency
}: DepositOptions) => {
  const transactionPrices = pricesMap.get(txId);
  const transaction = transactionsMap.get(txId);
  const unixNumber = transactionUnixNumber(transaction);

  // Get the basis amount to setup initial value for tax lot.
  const lotCode = transaction.get('deposit_code').toUpperCase();
  let lotAmount = new BigNumber(transaction.get('deposit_amount'));
  const depositPrice = getPriceBigNumber(transactionPrices, lotCode, localCurrency);
  let basisAmount = lotAmount.times(depositPrice);

  // Adjust basis with applicable fees.
  const taxableFeeAmount = getFeeAmount({
    transaction,
    pricesMap,
    transactionsMap,
    priceMethod,
    localCurrency
  });
  basisAmount = BigNumber.sum(basisAmount, taxableFeeAmount);

  return IMap({
    taxLots: List([
      new TaxLot({
        unix: unixNumber,
        assetCode: lotCode,
        assetAmount: lotAmount,
        basisCode: localCurrency,
        basisAmount: basisAmount,
        transactionId: txId,
        isIncome: false
      })
    ]),
    disposals: List()
  });
};
