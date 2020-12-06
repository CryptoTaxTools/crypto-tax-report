import uuidv4 from 'uuid/v4';

export const taxReportFactory = (fullReport) => {
  const { report = {}, config = {} } = fullReport;
  const generatedReport = Object.entries(report).reduce(
    (reduction, [reportYear, reportEntries]) => {
      reduction[reportYear] = {
        income: [],
        long: [],
        short: [],
        unmatched: [],
        lost: [],
        interest_income: [],
        ...reportEntries
      };
      return reduction;
    },
    {}
  );
  return {
    report: generatedReport,
    config
  };
};

export const incomeFactory = (income) => ({
  tx_id: uuidv4(),
  tx_type: 'INCOME',
  ...income
});

export const lostFactory = (lost) => ({
  tx_id: uuidv4(),
  tx_type: 'LOST',
  ...lost
});

export const withdrawalFactory = (withdrawal) => ({
  tx_id: uuidv4(),
  tx_type: 'WITHDRAWAL',
  ...withdrawal
});

export const depositFactory = (mint) => {
  return {
    tx_id: uuidv4(),
    tx_type: 'DEPOSIT',
    ...mint
  };
};

export const mintFactory = (mint) => {
  return {
    tx_id: uuidv4(),
    tx_type: 'COMPOUND_MINT',
    ...mint
  };
};

export const borrowFactory = (mint) => {
  return {
    tx_id: uuidv4(),
    tx_type: 'COMPOUND_BORROW',
    ...mint
  };
};

export const redeemFactory = (redeem) => {
  return {
    tx_id: uuidv4(),
    tx_type: 'COMPOUND_REDEEM',
    ...redeem
  };
};

export const repayBorrowFactory = (repay) => {
  return {
    tx_id: uuidv4(),
    tx_type: 'COMPOUND_REPAYBORROW',
    ...repay
  };
};

export const liqBorrow_BorrowerFactory = (tx) => {
  return {
    tx_id: uuidv4(),
    tx_type: 'COMPOUND_LIQUIDATEBORROW_BORROWER',
    ...tx
  };
};

export const liqBorrow_LiquidatorFactory = (tx) => {
  return {
    tx_id: uuidv4(),
    tx_type: 'COMPOUND_LIQUIDATEBORROW_LIQUIDATOR',
    ...tx
  };
};

export const tradeFactory = (trade) => ({
  tx_id: uuidv4(),
  tx_type: 'TRADE',
  ...trade
});
