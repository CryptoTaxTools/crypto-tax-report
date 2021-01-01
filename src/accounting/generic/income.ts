import { BigNumber } from 'bignumber.js';
import { Map as IMap, List } from 'immutable';

import TaxLot from '../../taxLot';
import { getFeeAmount } from '../fee';
import { Price, LocalCurrency, ImmutableMap, ITransaction, PriceMethod } from '../../types';
import { transactionUnixNumber, getPriceBigNumber } from '../helpers';

interface IncomeOptions {
  txId: string;
  pricesMap: ImmutableMap<{ string: List<Price> }>;
  transactionsMap: ImmutableMap<{ string: List<ITransaction> }>;
  localCurrency: LocalCurrency;
  priceMethod: PriceMethod;
}

/*
 * INCOME
 *
 * This creates a single TaxLot. And Disposal if there is a fee.
 * Income is added to your tax report. Income is
 * taxed at the normal income tax rates.
 * Works for both fiat and capital assets.
 */
export const lotsAndDisposalsFromIncome = ({
  txId,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency
}: IncomeOptions) => {
  const transactionPrices = pricesMap.get(txId);
  const transaction = transactionsMap.get(txId);
  const unixNumber = transactionUnixNumber(transaction);

  // Get the basis amount to setup initial value for tax lot.
  const lotCode = transaction.get('income_code').toUpperCase();
  let lotAmount = new BigNumber(transaction.get('income_amount'));
  const incomePrice = getPriceBigNumber(transactionPrices, lotCode, localCurrency);
  let basisAmount = lotAmount.times(incomePrice);

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
        isIncome: true
      })
    ]),
    disposals: List()
  });
};
