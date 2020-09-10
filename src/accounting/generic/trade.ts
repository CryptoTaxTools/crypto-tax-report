import { Map as IMap, List } from 'immutable';
import { BigNumber } from 'bignumber.js';

import TaxLot from '../../taxLot';
import Disposal from '../../disposal';
import { Trade, Price, PriceMethod, LocalCurrency } from '../../types';
import {
  transactionUnixNumber,
  transactionIsBuy,
  transactionHasFee,
  transactionFeeCode,
  getPriceBigNumber
} from '../helpers';

/*
 * TRADE
 *
 * EVERY side of a transaction (including fee) has a price record.
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
  transaction,
  prices,
  priceMethod,
  localCurrency,
  gainsAsInterestIncome = false
}: {
  transaction: Trade;
  prices: List<Price>;
  priceMethod: PriceMethod;
  localCurrency: LocalCurrency;
  gainsAsInterestIncome?: boolean;
}) => {
  const transactionPricesList = prices;
  // Setup helper constants.
  const txID = transaction.get('tx_id');
  const unixNumber = transactionUnixNumber(transaction);
  const isBuy = transactionIsBuy(transaction);
  const isSell = !isBuy;
  const hasFee = transactionHasFee(transaction);

  /*
   * (1) Get the taxable amount to setup initial values for basis and proceeds.
   */
  const priceStrategy = priceMethod.toLowerCase(); // either BASE or QUOTE
  const tradeAmount = new BigNumber(transaction.get(`${priceStrategy}_amount`));
  const tradeCode = transaction.get(`${priceStrategy}_code`);
  const tradePrice = getPriceBigNumber(transactionPricesList, tradeCode, localCurrency);
  const taxableAmount = tradeAmount.times(tradePrice);
  let basisAmount = taxableAmount;
  let proceedsAmount = taxableAmount;

  /*
   * (2) Adjust basis and proceeds with applicable fees.
   */
  let feeCode;
  let feeAmount = new BigNumber('0');
  let feePrice;
  let taxableFeeAmount;
  if (hasFee) {
    feeCode = transactionFeeCode(transaction);
    feeAmount = new BigNumber(transaction.get('fee_amount'));
    feePrice = getPriceBigNumber(transactionPricesList, feeCode, localCurrency);
    taxableFeeAmount = feeAmount.times(feePrice);

    if (isBuy) {
      // If transaction is type BUY or NONE, fee increases basis.
      basisAmount = BigNumber.sum(basisAmount, taxableFeeAmount);
    } else {
      // If transaction is type SELL, fee reduces basis.
      proceedsAmount = proceedsAmount.minus(taxableFeeAmount);
    }
  }

  /*
   * (3) Determine TaxLot values.
   */
  const lotSide = isBuy ? 'base' : 'quote';
  const lotCode = transaction.get(`${lotSide}_code`).toUpperCase();
  let lotAmount = new BigNumber(transaction.get(`${lotSide}_amount`));
  if (hasFee && feeCode === lotCode) {
    lotAmount = lotAmount.minus(feeAmount);
  }

  const taxLots = List([
    new TaxLot({
      unix: unixNumber,
      assetCode: lotCode,
      assetAmount: lotAmount,
      basisCode: localCurrency,
      basisAmount: basisAmount,
      transactionId: txID,
      isIncome: false
    })
  ]);

  /*
   * (4) Determine Disposal values.
   */
  const disposalSide = isSell ? 'base' : 'quote';
  const disposalCode = transaction.get(`${disposalSide}_code`).toUpperCase();
  let disposalAmount = new BigNumber(transaction.get(`${disposalSide}_amount`));
  if (hasFee && feeCode === disposalCode) {
    disposalAmount = BigNumber.sum(disposalAmount, feeAmount);
  }

  const disposalList = List([
    new Disposal({
      unix: unixNumber,
      assetCode: disposalCode,
      assetAmount: disposalAmount,
      proceedsCode: localCurrency,
      proceedsAmount: proceedsAmount,
      transactionId: txID,
      gainsAsInterestIncome
    })
  ]);

  let otherDisposals = List();

  /*
   * (5) Standalone fees create their own disposal records.
   */
  if (hasFee && feeCode !== disposalCode && feeCode !== lotCode) {
    otherDisposals = otherDisposals.push(
      new Disposal({
        unix: unixNumber,
        assetCode: feeCode,
        assetAmount: feeAmount,
        proceedsCode: localCurrency,
        proceedsAmount: taxableFeeAmount,
        transactionId: txID
      })
    );
  }

  const disposals = disposalList.merge(otherDisposals);

  return IMap({
    taxLots: taxLots,
    disposals: disposals
  });
};
