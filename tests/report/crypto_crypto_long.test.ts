import createReport from '../../src/index';
import { taxReportFactory, tradeFactory, withdrawalFactory } from './../utils/factories';

describe('crypto/crypto long term gains', () => {
  const trade_1_fee = withdrawalFactory({
    timestamp: '2018-01-01T09:30:00Z',
    withdrawal_amount: '5',
    withdrawal_code: 'USD'
  });
  const trade_1 = tradeFactory({
    timestamp: '2018-01-01T09:30:00Z',
    side: 'BUY',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '200',
    quote_code: 'USD',
    fee_tx_ids: [trade_1_fee.tx_id]
  });
  const trade_2_fee = withdrawalFactory({
    timestamp: '2019-01-04T12:00:00Z',
    withdrawal_amount: '2',
    withdrawal_code: 'USD'
  });
  const trade_2 = tradeFactory({
    timestamp: '2019-01-04T12:00:00Z',
    side: 'BUY',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '153.19',
    quote_code: 'USD',
    fee_tx_ids: [trade_2_fee.tx_id]
  });
  const trade_3_fee = withdrawalFactory({
    timestamp: '2019-01-31T13:00:00Z',
    withdrawal_amount: '5',
    withdrawal_code: 'USD'
  });
  const trade_3 = tradeFactory({
    timestamp: '2019-01-31T13:00:00Z',
    side: 'BUY',
    base_amount: '2',
    base_code: 'ETH',
    quote_amount: '250',
    quote_code: 'USD',
    fee_amount: '5',
    fee_code: 'USD',
    fee_tx_ids: [trade_3_fee.tx_id]
  });
  const trade_4_fee = withdrawalFactory({
    timestamp: '2020-03-03T15:00:00Z',
    withdrawal_amount: '0.001',
    withdrawal_code: 'BTC'
  });
  const trade_4 = tradeFactory({
    timestamp: '2020-03-03T15:00:00Z',
    side: 'SELL',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '0.07',
    quote_code: 'BTC',
    fee_tx_ids: [trade_4_fee.tx_id]
  });
  const trade_5_fee = withdrawalFactory({
    timestamp: '2021-05-01T20:00:00Z',
    withdrawal_amount: '4',
    withdrawal_code: 'USD'
  });
  const trade_5 = tradeFactory({
    timestamp: '2021-05-01T20:00:00Z',
    side: 'SELL',
    base_amount: '0.069',
    base_code: 'BTC',
    quote_amount: '345',
    quote_code: 'USD',
    fee_tx_ids: [trade_5_fee.tx_id]
  });
  const transactions = [
    trade_1_fee,
    trade_1,
    trade_2_fee,
    trade_2,
    trade_3_fee,
    trade_3,
    trade_4_fee,
    trade_4,
    trade_5_fee,
    trade_5
  ];
  const prices = [
    {
      tx_id: trade_1.tx_id,
      timestamp: '2018-01-01T09:30:00Z',
      base_code: 'ETH',
      quote_code: 'USD',
      price: '200'
    },
    {
      tx_id: trade_1.tx_id,
      timestamp: '2018-01-01T09:30:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: trade_2.tx_id,
      timestamp: '2019-01-04T12:00:00Z',
      base_code: 'ETH',
      quote_code: 'USD',
      price: '153.19'
    },
    {
      tx_id: trade_2.tx_id,
      timestamp: '2019-01-04T12:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: trade_3.tx_id,
      timestamp: '2019-01-31T13:00:00Z',
      base_code: 'ETH',
      quote_code: 'USD',
      price: '125'
    },
    {
      tx_id: trade_3.tx_id,
      timestamp: '2019-01-31T13:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: trade_4.tx_id,
      timestamp: '2020-03-03T15:00:00Z',
      base_code: 'ETH',
      quote_code: 'USD',
      price: '135'
    },
    {
      tx_id: trade_4.tx_id,
      timestamp: '2020-03-03T15:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '1925'
    },
    {
      tx_id: trade_4_fee.tx_id,
      timestamp: '2020-03-03T15:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '1925'
    },
    {
      tx_id: trade_5.tx_id,
      timestamp: '2021-05-01T20:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '5000'
    },
    {
      tx_id: trade_5.tx_id,
      timestamp: '2021-05-01T20:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    }
  ];

  describe('Use Base', () => {
    // Only cover FIFO here, since LIFO/HIFO is covered under quote pricing
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
                increase: '0',
                decrease: '0',
                holdings: '0'
              },
              ETH: {
                holdings: '1',
                increase: '1',
                decrease: '0'
              },
              USD: {
                holdings: '-205',
                increase: '0',
                decrease: '205'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '5',
                cost_basis: '0',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                proceeds: '5',
                tx_id_sale: trade_1_fee.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '200',
                cost_basis: '0',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                proceeds: '200',
                tx_id_sale: trade_1.tx_id
              }
            ]
          },
          2019: {
            assets: {
              BTC: {
                holdings: '0',
                increase: '0',
                decrease: '0'
              },
              ETH: {
                holdings: '4',
                increase: '3',
                decrease: '0'
              },
              USD: {
                holdings: '-615.19',
                increase: '0',
                decrease: '410.19'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '2',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '2',
                tx_id_sale: trade_2_fee.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '153.19',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '153.19',
                tx_id_sale: trade_2.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '5',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '5',
                tx_id_sale: trade_3_fee.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '250',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '250',
                tx_id_sale: trade_3.tx_id
              }
            ]
          },
          2020: {
            assets: {
              ETH: {
                holdings: '3',
                increase: '0',
                decrease: '1'
              },
              USD: {
                holdings: '-615.19',
                increase: '0',
                decrease: '0'
              },
              BTC: {
                holdings: '0.069',
                increase: '0.07',
                decrease: '0.001'
              }
            },
            short: [
              {
                asset: 'BTC',
                asset_amount: '0.001',
                cost_basis: '1.93',
                proceeds: '1.93',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                tx_id_lot: trade_4.tx_id,
                tx_id_sale: trade_4_fee.tx_id
              }
            ],
            long: [
              {
                asset: 'ETH',
                asset_amount: '1',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                proceeds: '133.08',
                cost_basis: '205',
                tx_id_lot: trade_1.tx_id,
                tx_id_sale: trade_4.tx_id
              }
            ]
          },
          2021: {
            assets: {
              ETH: {
                holdings: '3',
                increase: '0',
                decrease: '0'
              },
              USD: {
                holdings: '-274.19',
                increase: '345',
                decrease: '4'
              },
              BTC: {
                holdings: '0',
                increase: '0',
                decrease: '0.069'
              }
            },
            long: [
              {
                asset: 'BTC',
                asset_amount: '0.069',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2021-05-01T20:00:00Z',
                proceeds: '341',
                cost_basis: '133.07',
                tx_id_lot: trade_4.tx_id,
                tx_id_sale: trade_5.tx_id
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
  });
  describe('Use Quote', () => {
    test('LIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          local_currency: 'USD',
          price_method: 'QUOTE',
          cost_basis_method: 'LIFO',
          decimal_places: 3
        }
      });
      let expected = taxReportFactory({
        report: {
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                increase: '0',
                decrease: '0'
              },
              ETH: {
                holdings: '1',
                increase: '1',
                decrease: '0'
              },
              USD: {
                holdings: '-205',
                increase: '0',
                decrease: '205'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '5',
                cost_basis: '0',
                proceeds: '5',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                tx_id_sale: trade_1_fee.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '200',
                cost_basis: '0',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                proceeds: '200',
                tx_id_sale: trade_1.tx_id
              }
            ]
          },
          2019: {
            assets: {
              BTC: {
                holdings: '0',
                increase: '0',
                decrease: '0'
              },
              ETH: {
                holdings: '4',
                increase: '3',
                decrease: '0'
              },
              USD: {
                holdings: '-615.19',
                increase: '0',
                decrease: '410.19'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '2',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '2',
                tx_id_sale: trade_2_fee.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '153.19',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '153.19',
                tx_id_sale: trade_2.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '5',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '5',
                tx_id_sale: trade_3_fee.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '250',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '250',
                tx_id_sale: trade_3.tx_id
              }
            ]
          },
          2020: {
            assets: {
              ETH: {
                holdings: '3',
                increase: '0',
                decrease: '1'
              },
              USD: {
                holdings: '-615.19',
                increase: '0',
                decrease: '0'
              },
              BTC: {
                holdings: '0.069',
                increase: '0.07',
                decrease: '0.001'
              }
            },
            short: [
              {
                asset: 'BTC',
                asset_amount: '0.001',
                cost_basis: '1.925',
                proceeds: '1.925',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                tx_id_lot: trade_4.tx_id,
                tx_id_sale: trade_4_fee.tx_id
              }
            ],
            long: [
              {
                asset: 'ETH',
                asset_amount: '1',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                proceeds: '132.825',
                cost_basis: '127.5',
                tx_id_lot: trade_3.tx_id,
                tx_id_sale: trade_4.tx_id
              }
            ]
          },
          2021: {
            assets: {
              ETH: {
                holdings: '3',
                increase: '0',
                decrease: '0'
              },
              USD: {
                holdings: '-274.19',
                increase: '345',
                decrease: '4'
              },
              BTC: {
                holdings: '0',
                increase: '0',
                decrease: '0.069'
              }
            },
            long: [
              {
                asset: 'BTC',
                asset_amount: '0.069',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2021-05-01T20:00:00Z',
                proceeds: '341',
                cost_basis: '132.825',
                tx_id_lot: trade_4.tx_id,
                tx_id_sale: trade_5.tx_id
              }
            ]
          }
        },
        config: {
          local_currency: 'USD',
          price_method: 'QUOTE',
          cost_basis_method: 'LIFO',
          decimal_places: 3,
          allow_lot_overlap: true
        }
      });
      expect(received).toEqual(expected);
    });
  });
});
