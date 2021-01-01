import createReport from '../../src/index';
import { taxReportFactory, depositFactory, lostFactory, tradeFactory } from './../utils/factories';

describe('lost crypto or fiat', () => {
  test('buy bitcoin, lose more bitcoin than bought', () => {
    const trade = tradeFactory({
      timestamp: '2018-01-01T01:00:00Z',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '10000',
      quote_code: 'USD'
    });
    const lost = lostFactory({
      timestamp: '2018-01-01T02:00:00Z',
      lost_amount: '2',
      lost_code: 'BTC'
    });
    const transactions = [trade, lost];
    const prices = [
      {
        tx_id: trade.tx_id,
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: lost.tx_id,
        timestamp: '2018-01-01T02:00:00Z',
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
              holdings: '-1',
              increase: '1',
              decrease: '2'
            },
            USD: {
              increase: '0',
              holdings: '-10000',
              decrease: '10000'
            }
          },
          // First the program reduces the existing TaxLot,
          // then it records an unmatched disposal.
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '10000',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '10000',
              tx_id_sale: trade.tx_id
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-01T02:00:00Z',
              date_sold: '2018-01-01T02:00:00Z',
              proceeds: '10000',
              tx_id_sale: lost.tx_id
            }
          ],
          long: [],
          income: [],
          short: [],
          lost: [
            {
              asset: 'BTC',
              asset_amount: '1',
              cost_basis: '10000',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T02:00:00Z',
              proceeds: '10000',
              tx_id_sale: lost.tx_id,
              tx_id_lot: trade.tx_id
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-01T02:00:00Z',
              date_sold: '2018-01-01T02:00:00Z',
              proceeds: '10000',
              tx_id_sale: lost.tx_id
            }
          ],
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
  test('buy bitcoin, lose fraction of that bitcoin', () => {
    const trade = tradeFactory({
      timestamp: '2018-01-01T01:00:00Z',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '10000',
      quote_code: 'USD'
    });
    const lost = lostFactory({
      timestamp: '2018-01-01T02:00:00Z',
      lost_amount: '0.5',
      lost_code: 'BTC'
    });
    const transactions = [trade, lost];
    const prices = [
      {
        tx_id: trade.tx_id,
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: lost.tx_id,
        timestamp: '2018-01-01T02:00:00Z',
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
              holdings: '0.5',
              increase: '1',
              decrease: '0.5'
            },
            USD: {
              increase: '0',
              holdings: '-10000',
              decrease: '10000'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '10000',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '10000',
              tx_id_sale: trade.tx_id
            }
          ],
          long: [],
          income: [],
          short: [],
          lost: [
            {
              asset: 'BTC',
              asset_amount: '0.5',
              cost_basis: '5000',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T02:00:00Z',
              proceeds: '5000',
              tx_id_sale: lost.tx_id,
              tx_id_lot: trade.tx_id
            }
          ],
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
  test('deposit USD, lose fraction of that USD amount', () => {
    const deposit = depositFactory({
      timestamp: '2018-01-01T01:00:00Z',
      deposit_amount: '1',
      deposit_code: 'USD'
    });
    const lost = lostFactory({
      timestamp: '2018-01-01T02:00:00Z',
      lost_amount: '0.5',
      lost_code: 'USD'
    });
    const transactions = [deposit, lost];
    const received = createReport({
      transactions,
      prices: [],
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
            USD: {
              increase: '1',
              holdings: '0.5',
              decrease: '0.5'
            }
          },
          unmatched: [],
          long: [],
          income: [],
          short: [],
          lost: [
            {
              asset: 'USD',
              asset_amount: '0.5',
              cost_basis: '0.5',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T02:00:00Z',
              proceeds: '0.5',
              tx_id_sale: lost.tx_id,
              tx_id_lot: deposit.tx_id
            }
          ],
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
  test('lose USD unmatched', () => {
    const lost = lostFactory({
      timestamp: '2018-01-01T01:00:00Z',
      tx_id: '1',
      lost_amount: '1',
      lost_code: 'USD'
    });
    const transactions = [lost];
    const received = createReport({
      transactions,
      prices: [],
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
            USD: {
              holdings: '-1',
              increase: '0',
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
              tx_id_sale: lost.tx_id
            }
          ],
          long: [],
          income: [],
          short: [],
          lost: [
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '1',
              tx_id_sale: lost.tx_id
            }
          ],
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
