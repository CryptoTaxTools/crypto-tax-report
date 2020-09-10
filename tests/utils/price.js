import { BigNumber } from 'bignumber.js';

export const impliedPrice = ({ amountPriced, amountUnpriced, price }) => {
  return new BigNumber(amountPriced)
    .dividedBy(new BigNumber(amountUnpriced))
    .multipliedBy(new BigNumber(price))
    .dp(18)
    .toString(10);
};
