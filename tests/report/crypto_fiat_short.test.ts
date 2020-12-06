import createReport from '../../src/index';
import { taxReportFactory, tradeFactory, withdrawalFactory } from './../utils/factories';

describe('crypto/fiat short term gains with fees', () => {
  const trade_1_fee = withdrawalFactory({
    timestamp: '2018-01-01T01:00:00Z',
    withdrawal_amount: '1',
    withdrawal_code: 'USD'
  });
  const trade_1 = tradeFactory({
    timestamp: '2018-01-01T01:00:00Z',
    side: 'BUY',
    base_amount: '1',
    base_code: 'BTC',
    quote_amount: '100',
    quote_code: 'USD',
    fee_tx_ids: [trade_1_fee.tx_id]
  });
  const trade_2_fee = withdrawalFactory({
    timestamp: '2018-01-02T01:00:00Z',
    withdrawal_amount: '1',
    withdrawal_code: 'USD'
  });
  const trade_2 = tradeFactory({
    timestamp: '2018-01-02T01:00:00Z',
    side: 'BUY',
    base_amount: '1',
    base_code: 'BTC',
    quote_amount: '300',
    quote_code: 'USD',
    fee_tx_ids: [trade_2_fee.tx_id]
  });
  const trade_3_fee = withdrawalFactory({
    timestamp: '2018-01-03T01:00:00Z',
    withdrawal_amount: '1',
    withdrawal_code: 'USD'
  });
  const trade_3 = tradeFactory({
    timestamp: '2018-01-03T01:00:00Z',
    side: 'BUY',
    base_amount: '1',
    base_code: 'BTC',
    quote_amount: '200',
    quote_code: 'USD',
    fee_tx_ids: [trade_3_fee.tx_id]
  });
  const trade_4_fee = withdrawalFactory({
    timestamp: '2018-01-04T01:00:00Z',
    withdrawal_amount: '3',
    withdrawal_code: 'USD'
  });
  const trade_4 = tradeFactory({
    timestamp: '2018-01-04T01:00:00Z',
    side: 'SELL',
    base_amount: '3',
    base_code: 'BTC',
    quote_amount: '1000',
    quote_code: 'USD',
    fee_tx_ids: [trade_4_fee.tx_id]
  });

  const transactions = [
    trade_1_fee,
    trade_1,
    trade_2_fee,
    trade_2,
    trade_3_fee,
    trade_3,
    trade_4_fee,
    trade_4
  ];
  const prices = [
    {
      tx_id: trade_1.tx_id,
      timestamp: '2018-01-01T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '100'
    },
    {
      tx_id: trade_1.tx_id,
      timestamp: '2018-01-01T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: trade_2.tx_id,
      timestamp: '2018-01-02T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '300'
    },
    {
      tx_id: trade_2.tx_id,
      timestamp: '2018-01-02T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: trade_3.tx_id,
      timestamp: '2018-01-03T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '200'
    },
    {
      tx_id: trade_3.tx_id,
      timestamp: '2018-01-03T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: trade_4.tx_id,
      timestamp: '2018-01-04T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '333.3333333'
    },
    {
      tx_id: trade_4.tx_id,
      timestamp: '2018-01-04T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    }
  ];

  test('FIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        local_currency: 'USD',
        price_method: 'BASE',
        cost_basis_method: 'FIFO',
        decimal_places: 2
      }
    });
    let expected = taxReportFactory({
      report: {
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              increase: '3',
              decrease: '3'
            },
            USD: {
              holdings: '394',
              increase: '1000',
              decrease: '606'
            }
          },
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '101',
              tx_id_lot: trade_1.tx_id,
              tx_id_sale: trade_4.tx_id
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '301',
              tx_id_lot: trade_2.tx_id,
              tx_id_sale: trade_4.tx_id
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '201',
              tx_id_lot: trade_3.tx_id,
              tx_id_sale: trade_4.tx_id
            }
          ],
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              proceeds: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              tx_id_sale: trade_1_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '100',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '100',
              tx_id_sale: trade_1.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              proceeds: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              tx_id_sale: trade_2_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '300',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '300',
              tx_id_sale: trade_2.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              proceeds: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              tx_id_sale: trade_3_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '200',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '200',
              tx_id_sale: trade_3.tx_id
            }
          ]
        }
      },
      config: {
        local_currency: 'USD',
        price_method: 'BASE',
        cost_basis_method: 'FIFO',
        decimal_places: 2,
        allow_lot_overlap: true
      }
    });
    expect(received).toEqual(expected);
  });
  test('HIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        local_currency: 'USD',
        price_method: 'BASE',
        cost_basis_method: 'HIFO',
        decimal_places: 2
      }
    });
    let expected = taxReportFactory({
      report: {
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              increase: '3',
              decrease: '3'
            },
            USD: {
              holdings: '394',
              increase: '1000',
              decrease: '606'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '1',
              tx_id_sale: trade_1_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '100',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '100',
              tx_id_sale: trade_1.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '1',
              tx_id_sale: trade_2_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '300',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '300',
              tx_id_sale: trade_2.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '1',
              tx_id_sale: trade_3_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '200',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '200',
              tx_id_sale: trade_3.tx_id
            }
          ],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '301',
              tx_id_lot: trade_2.tx_id,
              tx_id_sale: trade_4.tx_id
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '201',
              tx_id_lot: trade_3.tx_id,
              tx_id_sale: trade_4.tx_id
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '101',
              tx_id_lot: trade_1.tx_id,
              tx_id_sale: trade_4.tx_id
            }
          ]
        }
      },
      config: {
        local_currency: 'USD',
        price_method: 'BASE',
        cost_basis_method: 'HIFO',
        decimal_places: 2,
        allow_lot_overlap: true
      }
    });
    expect(received).toEqual(expected);
  });
  test('LIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        local_currency: 'USD',
        price_method: 'BASE',
        cost_basis_method: 'LIFO',
        decimal_places: 2
      }
    });
    let expected = taxReportFactory({
      report: {
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              increase: '3',
              decrease: '3'
            },
            USD: {
              holdings: '394',
              increase: '1000',
              decrease: '606'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '1',
              tx_id_sale: trade_1_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '100',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '100',
              tx_id_sale: trade_1.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '1',
              tx_id_sale: trade_2_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '300',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '300',
              tx_id_sale: trade_2.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '1',
              tx_id_sale: trade_3_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '200',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '200',
              tx_id_sale: trade_3.tx_id
            }
          ],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '201',
              tx_id_lot: trade_3.tx_id,
              tx_id_sale: trade_4.tx_id
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '301',
              tx_id_lot: trade_2.tx_id,
              tx_id_sale: trade_4.tx_id
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '101',
              tx_id_lot: trade_1.tx_id,
              tx_id_sale: trade_4.tx_id
            }
          ]
        }
      },
      config: {
        local_currency: 'USD',
        price_method: 'BASE',
        cost_basis_method: 'LIFO',
        decimal_places: 2,
        allow_lot_overlap: true
      }
    });
    expect(received).toEqual(expected);
  });
});

describe('crypto/fiat short term unmatched gains and no fees', () => {
  const trade_1 = tradeFactory({
    timestamp: '2018-01-04T01:00:00Z',
    side: 'SELL',
    base_amount: '3',
    base_code: 'BTC',
    quote_amount: '1000',
    quote_code: 'USD'
  });
  const prices = [
    {
      tx_id: trade_1.tx_id,
      timestamp: trade_1.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '333.3333333'
    }
  ];
  const transactions = [trade_1];
  const received = createReport({
    transactions,
    prices,
    config: {
      local_currency: 'USD',
      price_method: 'BASE',
      cost_basis_method: 'FIFO',
      decimal_places: 2
    }
  });
  let expected = taxReportFactory({
    report: {
      2018: {
        assets: {
          BTC: {
            holdings: '-3',
            increase: '0',
            decrease: '3'
          },
          USD: {
            holdings: '1000',
            increase: '1000',
            decrease: '0'
          }
        },
        short: [
          {
            asset: 'BTC',
            asset_amount: '3',
            cost_basis: '0',
            date_acquired: '2018-01-04T01:00:00Z',
            date_sold: '2018-01-04T01:00:00Z',
            proceeds: '1000',
            tx_id_sale: trade_1.tx_id
          }
        ],
        unmatched: [
          {
            asset: 'BTC',
            asset_amount: '3',
            cost_basis: '0',
            date_acquired: '2018-01-04T01:00:00Z',
            date_sold: '2018-01-04T01:00:00Z',
            proceeds: '1000',
            tx_id_sale: trade_1.tx_id
          }
        ]
      }
    },
    config: {
      local_currency: 'USD',
      price_method: 'BASE',
      cost_basis_method: 'FIFO',
      decimal_places: 2,
      allow_lot_overlap: true
    }
  });
  expect(received).toEqual(expected);
});

describe('crypto/fiat short term gains with zero basis BTC and no fees', () => {
  const trade_1 = tradeFactory({
    timestamp: '2019-01-01T01:00:00Z',
    tx_id: '1',
    side: 'NONE',
    base_amount: '1',
    base_code: 'BTC',
    quote_amount: '3000',
    quote_code: 'USD'
  });
  const trade_2 = tradeFactory({
    timestamp: '2019-02-01T01:00:00Z',
    tx_id: '2',
    side: 'NONE',
    base_amount: '1',
    base_code: 'BTC',
    quote_amount: '0',
    quote_code: 'USD'
  });
  const trade_3 = tradeFactory({
    timestamp: '2019-03-01T01:00:00Z',
    tx_id: '3',
    side: 'NONE',
    base_amount: '3500',
    base_code: 'USD',
    quote_amount: '1',
    quote_code: 'BTC'
  });
  const transactions = [trade_1, trade_2, trade_3];
  const prices = [
    {
      tx_id: trade_1.tx_id,
      timestamp: trade_1.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '3000'
    },
    {
      tx_id: trade_1.tx_id,
      timestamp: trade_1.timestamp,
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: trade_2.tx_id,
      timestamp: trade_2.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '0'
    },
    {
      tx_id: trade_2.tx_id,
      timestamp: trade_2.timestamp,
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: trade_3.tx_id,
      timestamp: trade_3.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '3500'
    },
    {
      tx_id: trade_3.tx_id,
      timestamp: trade_3.timestamp,
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    }
  ];

  describe('Use quote price', () => {
    test('HIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          local_currency: 'USD',
          price_method: 'QUOTE',
          cost_basis_method: 'HIFO',
          decimal_places: 2
        }
      });
      let expected = taxReportFactory({
        report: {
          2019: {
            assets: {
              BTC: {
                holdings: '1',
                increase: '2',
                decrease: '1'
              },
              USD: {
                holdings: '500',
                increase: '3500',
                decrease: '3000'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '3000',
                cost_basis: '0',
                date_acquired: '2019-01-01T01:00:00Z',
                date_sold: '2019-01-01T01:00:00Z',
                proceeds: '3000',
                tx_id_sale: trade_1.tx_id
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2019-01-01T01:00:00Z',
                date_sold: '2019-03-01T01:00:00Z',
                proceeds: '3500',
                cost_basis: '3000',
                tx_id_sale: trade_3.tx_id,
                tx_id_lot: trade_1.tx_id
              }
            ],
            lost: [],
            interest_income: []
          }
        },
        config: {
          local_currency: 'USD',
          price_method: 'QUOTE',
          cost_basis_method: 'HIFO',
          decimal_places: 2,
          allow_lot_overlap: true
        }
      });
      expect(received).toEqual(expected);
    });
  });
  describe('Use base price', () => {
    test('FIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          local_currency: 'USD',
          price_method: 'BASE',
          cost_basis_method: 'FIFO',
          decimal_places: 2
        }
      });
      let expected = taxReportFactory({
        report: {
          2019: {
            assets: {
              BTC: {
                holdings: '1',
                increase: '2',
                decrease: '1'
              },
              USD: {
                holdings: '500',
                increase: '3500',
                decrease: '3000'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '3000',
                cost_basis: '0',
                date_acquired: '2019-01-01T01:00:00Z',
                date_sold: '2019-01-01T01:00:00Z',
                proceeds: '3000',
                tx_id_sale: trade_1.tx_id
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2019-01-01T01:00:00Z',
                date_sold: '2019-03-01T01:00:00Z',
                proceeds: '3500',
                cost_basis: '3000',
                tx_id_sale: trade_3.tx_id,
                tx_id_lot: trade_1.tx_id
              }
            ],
            lost: [],
            interest_income: []
          }
        },
        config: {
          local_currency: 'USD',
          price_method: 'BASE',
          cost_basis_method: 'FIFO',
          decimal_places: 2,
          allow_lot_overlap: true
        }
      });
      expect(received).toEqual(expected);
    });
  });
});
