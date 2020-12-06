import createReport from '../../src/index';
import {
  taxReportFactory,
  depositFactory,
  tradeFactory,
  withdrawalFactory
} from '../utils/factories';

describe('withdrawal', () => {
  describe('crypto/fiat short term gains - withdraw BTC - with fees', () => {
    const deposit_1_fee = withdrawalFactory({
      timestamp: '2018-01-01T01:00:00Z',
      withdrawal_amount: '1',
      withdrawal_code: 'USD'
    });
    const deposit_1 = depositFactory({
      timestamp: '2018-01-01T01:00:00Z',
      deposit_amount: '10',
      deposit_code: 'BTC',
      fee_tx_ids: [deposit_1_fee.tx_id]
    });
    const withdrawal_1_fee = withdrawalFactory({
      timestamp: '2018-01-02T01:00:00Z',
      withdrawal_amount: '1',
      withdrawal_code: 'USD'
    });
    const withdrawal_1 = withdrawalFactory({
      timestamp: '2018-01-02T01:00:00Z',
      withdrawal_amount: '1',
      withdrawal_code: 'BTC',
      fee_tx_ids: [withdrawal_1_fee.tx_id]
    });
    const transactions = [deposit_1, deposit_1_fee, withdrawal_1, withdrawal_1_fee];
    const prices = [
      {
        tx_id: deposit_1.tx_id,
        timestamp: deposit_1.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: withdrawal_1.tx_id,
        timestamp: withdrawal_1.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '11000'
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
                holdings: '9',
                increase: '10',
                decrease: '1'
              },
              USD: {
                increase: '0',
                holdings: '-2',
                decrease: '2'
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
                tx_id_sale: deposit_1_fee.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '1',
                cost_basis: '0',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '1',
                tx_id_sale: withdrawal_1_fee.tx_id
              }
            ],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '10999',
                cost_basis: '10000.1',
                tx_id_lot: deposit_1.tx_id,
                tx_id_sale: withdrawal_1.tx_id
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
  describe('crypto/crypto short term gains - withdraw - no fees', () => {
    const trade_1 = tradeFactory({
      timestamp: '2018-01-01T01:00:00Z',
      side: 'NONE',
      base_amount: '10',
      base_code: 'BTC',
      quote_amount: '1000',
      quote_code: 'USD'
    });
    const withdrawal_1 = withdrawalFactory({
      timestamp: '2018-01-02T01:00:00Z',
      withdrawal_amount: '1',
      withdrawal_code: 'BTC'
    });
    const transactions = [trade_1, withdrawal_1];
    const prices = [
      {
        tx_id: trade_1.tx_id,
        timestamp: trade_1.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '100'
      },
      {
        tx_id: withdrawal_1.tx_id,
        timestamp: withdrawal_1.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '4000'
      }
    ];
    describe('use quote price', () => {
      const priceOption = 'QUOTE';
      test('FIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            local_currency: 'USD',
            price_method: priceOption,
            cost_basis_method: 'FIFO',
            decimal_places: 2
          }
        });
        let expected = taxReportFactory({
          report: {
            2018: {
              assets: {
                BTC: {
                  holdings: '9',
                  increase: '10',
                  decrease: '1'
                },
                USD: {
                  holdings: '-1000',
                  increase: '0',
                  decrease: '1000'
                }
              },
              unmatched: [
                {
                  asset: 'USD',
                  asset_amount: '1000',
                  cost_basis: '0',
                  date_acquired: '2018-01-01T01:00:00Z',
                  date_sold: '2018-01-01T01:00:00Z',
                  proceeds: '1000',
                  tx_id_sale: trade_1.tx_id
                }
              ],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '1',
                  date_acquired: '2018-01-01T01:00:00Z',
                  date_sold: '2018-01-02T01:00:00Z',
                  proceeds: '4000',
                  cost_basis: '100',
                  tx_id_lot: trade_1.tx_id,
                  tx_id_sale: withdrawal_1.tx_id
                }
              ],
              lost: [],
              interest_income: []
            }
          },
          config: {
            local_currency: 'USD',
            price_method: priceOption,
            cost_basis_method: 'FIFO',
            decimal_places: 2,
            allow_lot_overlap: true
          }
        });
        expect(received).toEqual(expected);
      });
    });
  });
});
