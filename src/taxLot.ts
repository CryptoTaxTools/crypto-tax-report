import { Record } from 'immutable';
import { BigNumber } from 'bignumber.js';

interface TaxLotType {
  unix: number;
  assetCode: string;
  assetAmount: BigNumber;
  basisCode: string;
  basisAmount: BigNumber;
  transactionId: string;
  isIncome: boolean;
  pricePerUnit: BigNumber;
}

const TaxLotRecordFactory = Record({
  unix: 0,
  assetCode: '',
  assetAmount: new BigNumber('0'),
  basisCode: '',
  basisAmount: new BigNumber('0'),
  transactionId: '',
  isIncome: false
});

export class TaxLot extends TaxLotRecordFactory implements TaxLotType {
  // used for HIFO/LIFO sorting
  get pricePerUnit() {
    return this.basisAmount.div(this.assetAmount);
  }
}

export default TaxLot;
