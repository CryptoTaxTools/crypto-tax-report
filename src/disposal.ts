import { Record } from 'immutable';
import { BigNumber } from 'bignumber.js';

interface DisposalType {
  unix: number;
  assetCode: string;
  assetAmount: BigNumber;
  proceedsCode: string;
  proceedsAmount: BigNumber;
  transactionId: string;
  isLost: boolean;
  gainsAsInterestIncome: boolean;
  isBorrowRepay: boolean;
  isCompoundLiquidated: boolean;
}

const DisposalRecordFactory = Record({
  unix: 0,
  assetCode: '',
  assetAmount: new BigNumber('0'),
  proceedsCode: '',
  proceedsAmount: new BigNumber('0'),
  transactionId: '',
  isLost: false,
  gainsAsInterestIncome: false,
  isBorrowRepay: false,
  isCompoundLiquidated: false
});

class Disposal extends DisposalRecordFactory implements DisposalType {
  // Set computed methods here.
}

export default Disposal;
