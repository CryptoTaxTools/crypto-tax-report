import { Map as IMap, List } from 'immutable';
import moment from 'moment';
import { BigNumber } from 'bignumber.js';

import { ITransaction } from '../types';
import { InvalidParamError } from '../errors';

export const transactionIsBuy = (transaction: ITransaction) => {
  return transaction.get('side').toUpperCase() !== 'SELL';
};

export const transactionFeeCode = (transaction: ITransaction) => {
  const feeCode = transaction.get('fee_code');
  return feeCode ? feeCode.toUpperCase() : feeCode;
};

export const transactionHasFee = (transaction: ITransaction) => {
  return Boolean(transactionFeeCode(transaction)) && Boolean(transaction.get('fee_amount'));
};

export const transactionUnixNumber = (transaction: ITransaction) => {
  const txMoment = moment.utc(transaction.get('timestamp'), moment.ISO_8601);
  if (!txMoment.isValid()) {
    throw new InvalidParamError(
      `Transaction ID ${transaction.get(
        'tx_id'
      )} contains an invalid timestamp. Must be ISO-8601 format.`
    );
  }
  return Number(txMoment.format('X'));
};

export const getPriceBigNumber = (priceList: List<any>, baseCode: string, quoteCode: string) => {
  if (baseCode === quoteCode) {
    return new BigNumber('1');
  }
  try {
    const stringPrice = priceList
      .find(
        (p: IMap<any, any>) => p.get('base_code') === baseCode && p.get('quote_code') === quoteCode
      )
      .get('price');
    return new BigNumber(stringPrice);
  } catch (e) {
    console.error(`No price found for ${baseCode} in ${quoteCode}`);
    throw e;
  }
};
