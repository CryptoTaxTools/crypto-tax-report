import { Map as IMap, List } from 'immutable';
import { BigNumber } from 'bignumber.js';

import { getFeeAmount } from '../fee';
import TaxLot from '../../taxLot';
import Disposal from '../../disposal';
import { Price, PriceMethod, LocalCurrency, ImmutableMap, ITransaction } from '../../types';
import { transactionUnixNumber, transactionIsBuy, getPriceBigNumber } from '../helpers';

export interface TradeOptions {
  txId: string;
  pricesMap: ImmutableMap<{ string: List<Price> }>;
  transactionsMap: ImmutableMap<{ string: List<ITransaction> }>;
  priceMethod: PriceMethod;
  localCurrency: LocalCurrency;
  gainsAsInterestIncome?: boolean;
}

/*
 * TRADE
 *
 * EVERY side of a transaction has a price record.
 * THERE ARE NO EXCEPTIONS.
 *
 * Notes for future:
 * To support taxes paid in other currencies in the future:
 *   For crypto/crypto trades, fetch prices denominated in other
 *     currencies like we are currently doing for USD.
 *   For crypto/fiat trades, fetch currency exchange rates and
 *     use that to compute implied prices. Example: if AUS is
 *     selected, get USD/AUS rate and multiply that by USD
 *     fiat side (assuming the original fiat side is USD).
 *
 * TaxLots represent assets acquired.
 * Disposals represent assets released.
 */
export const lotsAndDisposalsFromTrade = ({
  txId,
  pricesMap,
  transactionsMap,
  priceMethod,
  localCurrency,
  gainsAsInterestIncome = false
}: TradeOptions) => {
  const transactionPrices = pricesMap.get(txId);
  const transaction = transactionsMap.get(txId);
  const unixNumber = transactionUnixNumber(transaction);
  const isBuy = transactionIsBuy(transaction);
  const isSell = !isBuy;

  // (1) Get the taxable amount to setup initial values for basis and proceeds.
  const priceStrategy = priceMethod.toLowerCase(); // either "base" or "quote"
  const tradeAmount = new BigNumber(transaction.get(`${priceStrategy}_amount`));
  const tradeCode = transaction.get(`${priceStrategy}_code`);
  const tradePrice = getPriceBigNumber(transactionPrices, tradeCode, localCurrency);
  const taxableAmount = tradeAmount.times(tradePrice);
  let basisAmount = taxableAmount;
  let proceedsAmount = taxableAmount;

  // (2) Adjust basis or proceeds with fees.
  // Reduce taxable gain by the value of the fees. Increasing tax lot basis and
  // reducing disposal proceeds both ultimately serve to reduce taxable gains.
  // See fees.tx for more info.
  const taxableFeeAmount = getFeeAmount({
    transaction,
    pricesMap,
    transactionsMap,
    priceMethod,
    localCurrency
  });
  if (isBuy) {
    // If transaction is type BUY or NONE, fee increases basis.
    basisAmount = BigNumber.sum(basisAmount, taxableFeeAmount);
  } else {
    // If transaction is type SELL, fee reduces proceeds.
    proceedsAmount = proceedsAmount.minus(taxableFeeAmount);
  }

  // (3) Determine TaxLot values.
  const lotSide = isBuy ? 'base' : 'quote';
  const lotCode = transaction.get(`${lotSide}_code`).toUpperCase();
  const lotAmount = new BigNumber(transaction.get(`${lotSide}_amount`));
  const taxLots = List([
    new TaxLot({
      unix: unixNumber,
      assetCode: lotCode,
      assetAmount: lotAmount,
      basisCode: localCurrency,
      basisAmount: basisAmount,
      transactionId: txId,
      isIncome: false
    })
  ]);

  // (4) Determine Disposal values.
  const disposalSide = isSell ? 'base' : 'quote';
  const disposalCode = transaction.get(`${disposalSide}_code`).toUpperCase();
  const disposalAmount = new BigNumber(transaction.get(`${disposalSide}_amount`));
  const disposals = List([
    new Disposal({
      unix: unixNumber,
      assetCode: disposalCode,
      assetAmount: disposalAmount,
      proceedsCode: localCurrency,
      proceedsAmount: proceedsAmount,
      transactionId: txId,
      gainsAsInterestIncome
    })
  ]);

  return IMap({
    taxLots: taxLots,
    disposals: disposals
  });
};
