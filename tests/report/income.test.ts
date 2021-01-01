import createReport from '../../src/index';
import {
  taxReportFactory,
  depositFactory,
  tradeFactory,
  incomeFactory,
  withdrawalFactory
} from '../utils/factories';

describe('receive income', () => {
  test('single income txn is reported', () => {
    const income_fee = withdrawalFactory({
      timestamp: '2018-01-01T01:00:00Z',
      withdrawal_code: 'USD',
      withdrawal_amount: '1'
    });
    const income = incomeFactory({
      timestamp: '2018-01-01T01:00:00Z',
      income_amount: '10',
      income_code: 'BTC',
      fee_tx_ids: [income_fee.tx_id]
    });
    const transactions = [income, income_fee];
    const prices = [
      {
        tx_id: income.tx_id,
        timestamp: income.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      }
    ];
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
              holdings: '10',
              increase: '10',
              decrease: '0'
            },
            USD: {
              increase: '0',
              holdings: '-1',
              decrease: '1'
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
              tx_id_sale: income_fee.tx_id
            }
          ],
          long: [],
          income: [
            {
              asset: 'BTC',
              asset_amount: '10',
              date_acquired: '2018-01-01T01:00:00Z',
              basis_amount: '100001',
              basis: 'USD',
              tx_id_lot: income.tx_id
            }
          ],
          short: [],
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
  test('single income, short term gains on trade', () => {
    const income_fee = withdrawalFactory({
      timestamp: '2018-01-01T01:00:00Z',
      withdrawal_code: 'USD',
      withdrawal_amount: '1'
    });
    const income = incomeFactory({
      timestamp: '2018-01-01T01:00:00Z',
      income_amount: '10',
      income_code: 'BTC',
      fee_tx_ids: [income_fee.tx_id]
    });
    const deposit_fee = withdrawalFactory({
      timestamp: '2018-01-02T01:00:00Z',
      withdrawal_code: 'USD',
      withdrawal_amount: '1'
    });
    const deposit = depositFactory({
      timestamp: '2018-01-02T01:00:00Z',
      deposit_amount: '10',
      deposit_code: 'BTC',
      fee_tx_ids: [deposit_fee.tx_id]
    });
    const trade_fee = withdrawalFactory({
      timestamp: '2018-01-03T01:00:00Z',
      withdrawal_code: 'USD',
      withdrawal_amount: '1'
    });
    const trade = tradeFactory({
      timestamp: '2018-01-03T01:00:00Z',
      side: 'SELL',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '11000',
      quote_code: 'USD',
      fee_tx_ids: [trade_fee.tx_id]
    });
    const transactions = [income, income_fee, deposit, deposit_fee, trade, trade_fee];
    const prices = [
      {
        tx_id: income.tx_id,
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: deposit.tx_id,
        timestamp: '2018-01-02T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: trade.tx_id,
        timestamp: '2018-01-03T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '11000'
      }
    ];
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
              holdings: '19',
              increase: '20',
              decrease: '1'
            },
            USD: {
              holdings: '10997',
              increase: '11000',
              decrease: '3'
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
              tx_id_sale: income_fee.tx_id
            },
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '1',
              tx_id_sale: deposit_fee.tx_id
            }
          ],
          long: [],
          income: [
            {
              asset: 'BTC',
              asset_amount: '10',
              date_acquired: '2018-01-01T01:00:00Z',
              basis_amount: '100001',
              basis: 'USD',
              tx_id_lot: income.tx_id
            }
          ],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '10999',
              cost_basis: '10000.1',
              tx_id_lot: income.tx_id,
              tx_id_sale: trade.tx_id
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
