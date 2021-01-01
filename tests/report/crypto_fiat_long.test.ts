import createReport from '../../src/index';
import { taxReportFactory, tradeFactory, withdrawalFactory } from '../utils/factories';

describe('crypto/fiat long term gains', () => {
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
    timestamp: '2020-01-31T13:00:00Z',
    withdrawal_amount: '5',
    withdrawal_code: 'USD'
  });
  const trade_3 = tradeFactory({
    timestamp: '2020-01-31T13:00:00Z',
    side: 'SELL',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '250',
    quote_code: 'USD',
    fee_tx_ids: [trade_3_fee.tx_id]
  });
  const transactions = [trade_1_fee, trade_1, trade_2_fee, trade_2, trade_3_fee, trade_3];
  const prices = [
    {
      tx_id: trade_1.tx_id,
      timestamp: trade_1.timestamp,
      base_code: 'ETH',
      quote_code: 'USD',
      price: '200'
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
      base_code: 'ETH',
      quote_code: 'USD',
      price: '153.19'
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
      base_code: 'ETH',
      quote_code: 'USD',
      price: '250'
    },
    {
      tx_id: trade_3.tx_id,
      timestamp: trade_3.timestamp,
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
              proceeds: '200',
              date_sold: '2018-01-01T09:30:00Z',
              cost_basis: '0',
              asset_amount: '200',
              date_acquired: '2018-01-01T09:30:00Z',
              tx_id_sale: trade_1.tx_id
            }
          ]
        },
        2019: {
          assets: {
            ETH: {
              holdings: '2',
              increase: '1',
              decrease: '0'
            },
            USD: {
              holdings: '-360.19',
              increase: '0',
              decrease: '155.19'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              proceeds: '2',
              date_sold: '2019-01-04T12:00:00Z',
              cost_basis: '0',
              asset_amount: '2',
              date_acquired: '2019-01-04T12:00:00Z',
              tx_id_sale: trade_2_fee.tx_id
            },
            {
              asset: 'USD',
              proceeds: '153.19',
              date_sold: '2019-01-04T12:00:00Z',
              cost_basis: '0',
              asset_amount: '153.19',
              date_acquired: '2019-01-04T12:00:00Z',
              tx_id_sale: trade_2.tx_id
            }
          ]
        },
        2020: {
          assets: {
            ETH: {
              holdings: '1',
              increase: '0',
              decrease: '1'
            },
            USD: {
              holdings: '-115.19',
              increase: '250',
              decrease: '5'
            }
          },
          long: [
            {
              asset: 'ETH',
              asset_amount: '1',
              date_acquired: '2018-01-01T09:30:00Z',
              date_sold: '2020-01-31T13:00:00Z',
              proceeds: '245',
              cost_basis: '205',
              tx_id_lot: trade_1.tx_id,
              tx_id_sale: trade_3.tx_id
            }
          ]
        }
      },
      config: {
        price_method: 'BASE',
        cost_basis_method: 'FIFO',
        local_currency: 'USD',
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
            ETH: {
              holdings: '2',
              increase: '1',
              decrease: '0'
            },
            USD: {
              holdings: '-360.19',
              increase: '0',
              decrease: '155.19'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '2',
              cost_basis: '0',
              proceeds: '2',
              date_acquired: '2019-01-04T12:00:00Z',
              date_sold: '2019-01-04T12:00:00Z',
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
            }
          ]
        },
        2020: {
          assets: {
            ETH: {
              holdings: '1',
              increase: '0',
              decrease: '1'
            },
            USD: {
              holdings: '-115.19',
              increase: '250',
              decrease: '5'
            }
          },
          long: [
            {
              asset: 'ETH',
              asset_amount: '1',
              date_acquired: '2018-01-01T09:30:00Z',
              date_sold: '2020-01-31T13:00:00Z',
              proceeds: '245',
              cost_basis: '205',
              tx_id_lot: trade_1.tx_id,
              tx_id_sale: trade_3.tx_id
            }
          ]
        }
      },
      config: {
        price_method: 'BASE',
        cost_basis_method: 'HIFO',
        local_currency: 'USD',
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
            ETH: {
              holdings: '2',
              increase: '1',
              decrease: '0'
            },
            USD: {
              holdings: '-360.19',
              increase: '0',
              decrease: '155.19'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '2',
              cost_basis: '0',
              proceeds: '2',
              date_acquired: '2019-01-04T12:00:00Z',
              date_sold: '2019-01-04T12:00:00Z',
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
            }
          ]
        },
        2020: {
          assets: {
            ETH: {
              holdings: '1',
              increase: '0',
              decrease: '1'
            },
            USD: {
              holdings: '-115.19',
              increase: '250',
              decrease: '5'
            }
          },
          long: [
            {
              asset: 'ETH',
              asset_amount: '1',
              date_acquired: '2019-01-04T12:00:00Z',
              date_sold: '2020-01-31T13:00:00Z',
              proceeds: '245',
              cost_basis: '155.19',
              tx_id_lot: trade_2.tx_id,
              tx_id_sale: trade_3.tx_id
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
