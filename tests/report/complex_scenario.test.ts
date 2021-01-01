import createReport from '../../src/index';
import { taxReportFactory, tradeFactory, withdrawalFactory } from './../utils/factories';

describe('fiat -> crypto -> fiat -> crypto scenario', () => {
  test('No fiat sales in short/long array', () => {
    const trade_1 = tradeFactory({
      timestamp: '2018-01-01T09:30:00Z',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '100',
      quote_code: 'USD'
    });
    const trade_2 = tradeFactory({
      timestamp: '2018-01-02T09:30:00Z',
      side: 'NONE',
      base_amount: '1000',
      base_code: 'USD',
      quote_amount: '1',
      quote_code: 'BTC'
    });
    const trade_3 = tradeFactory({
      timestamp: '2018-01-03T09:30:00Z',
      tx_id: '3',
      side: 'NONE',
      base_amount: '20',
      base_code: 'ETH',
      quote_amount: '500',
      quote_code: 'USD'
    });
    const transactions = [trade_1, trade_2, trade_3];
    const prices = [
      {
        tx_id: trade_1.tx_id,
        timestamp: '2018-01-01T09:30:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '100'
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
        timestamp: '2018-01-02T09:30:00Z',
        base_code: 'USD',
        quote_code: 'USD',
        price: '1'
      },
      {
        tx_id: trade_2.tx_id,
        timestamp: '2018-01-02T09:30:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '1000'
      },
      {
        tx_id: trade_3.tx_id,
        timestamp: '2018-01-03T09:30:00Z',
        base_code: 'USD',
        quote_code: 'USD',
        price: '1'
      },
      {
        tx_id: trade_3.tx_id,
        timestamp: '2018-01-03T09:30:00Z',
        base_code: 'ETH',
        quote_code: 'USD',
        price: '25'
      }
    ];

    const result = createReport({
      transactions,
      prices,
      config: {
        local_currency: 'USD',
        price_method: 'BASE',
        cost_basis_method: 'FIFO',
        decimal_places: 2
      }
    });
    const expected = taxReportFactory({
      config: {
        local_currency: 'USD',
        price_method: 'BASE',
        cost_basis_method: 'FIFO',
        decimal_places: 2,
        allow_lot_overlap: true
      },
      report: {
        '2018': {
          assets: {
            BTC: {
              increase: '1',
              holdings: '0',
              decrease: '1'
            },
            ETH: {
              increase: '20',
              holdings: '20',
              decrease: '0'
            },
            USD: {
              increase: '1000',
              holdings: '400',
              decrease: '600'
            }
          },
          long: [],
          income: [],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              cost_basis: '100',
              date_acquired: '2018-01-01T09:30:00Z',
              date_sold: '2018-01-02T09:30:00Z',
              proceeds: '1000',
              tx_id_lot: trade_1.tx_id,
              tx_id_sale: trade_2.tx_id
            }
          ],
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '100',
              cost_basis: '0',
              date_acquired: '2018-01-01T09:30:00Z',
              date_sold: '2018-01-01T09:30:00Z',
              proceeds: '100',
              tx_id_sale: trade_1.tx_id
            }
          ],
          lost: [],
          interest_income: []
        }
      }
    });
    expect(result).toEqual(expected);
  });
});
