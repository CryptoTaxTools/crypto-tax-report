import createReport from '../../src/index';
import { PriceMethod, CostBasisMethod, Price } from '../../src/types';
import {
  taxReportFactory,
  depositFactory,
  tradeFactory,
  withdrawalFactory
} from '../utils/factories';

describe('deposit assets', () => {
  describe('crypto/fiat short term gains - deposit BTC - null fees on deposit', () => {
    const deposit_1 = depositFactory({
      timestamp: '2018-01-01T01:00:00Z',
      deposit_amount: '1',
      deposit_code: 'BTC'
    });
    const deposit_2 = depositFactory({
      timestamp: '2018-01-02T01:00:00Z',
      deposit_amount: '1',
      deposit_code: 'BTC'
    });
    const deposit_3 = depositFactory({
      timestamp: '2018-01-03T01:00:00Z',
      deposit_amount: '1',
      deposit_code: 'BTC'
    });
    const trade_1_fee = withdrawalFactory({
      timestamp: '2018-01-04T01:00:00Z',
      withdrawal_code: 'USD',
      withdrawal_amount: '3'
    });
    const trade_1 = tradeFactory({
      timestamp: '2018-01-04T01:00:00Z',
      side: 'SELL',
      base_amount: '3',
      base_code: 'BTC',
      quote_amount: '1000',
      quote_code: 'USD',
      fee_tx_ids: [trade_1_fee.tx_id]
    });
    const transactions = [deposit_1, deposit_2, deposit_3, trade_1, trade_1_fee];
    const prices = [
      {
        tx_id: deposit_1.tx_id,
        timestamp: deposit_1.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '100'
      },
      {
        tx_id: deposit_2.tx_id,
        timestamp: deposit_2.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '300'
      },
      {
        tx_id: deposit_3.tx_id,
        timestamp: deposit_3.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '200'
      },
      {
        tx_id: trade_1.tx_id,
        timestamp: trade_1.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '333.3333333'
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
                holdings: '997',
                increase: '1000',
                decrease: '3'
              }
            },
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '100',
                tx_id_lot: deposit_1.tx_id,
                tx_id_sale: trade_1.tx_id
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '300',
                tx_id_lot: deposit_2.tx_id,
                tx_id_sale: trade_1.tx_id
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '200',
                tx_id_lot: deposit_3.tx_id,
                tx_id_sale: trade_1.tx_id
              }
            ],
            unmatched: [],
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

  test('crypto/crypto short term gains - deposit BTC, deposit BNB - fees with fee code !== quote code', () => {
    const deposit_1 = depositFactory({
      timestamp: '2019-01-01T01:00:00Z',
      deposit_amount: '10',
      deposit_code: 'BNB'
    });
    const deposit_2_fee = withdrawalFactory({
      timestamp: '2019-01-01T01:00:00Z',
      withdrawal_code: 'BNB',
      withdrawal_amount: '2'
    });
    const deposit_2 = depositFactory({
      timestamp: '2019-01-01T01:00:00Z',
      deposit_amount: '10',
      deposit_code: 'BTC',
      fee_tx_ids: [deposit_2_fee.tx_id]
    });
    const trade_1_fee = withdrawalFactory({
      timestamp: '2019-01-02T01:00:00Z',
      withdrawal_code: 'BNB',
      withdrawal_amount: '2'
    });
    const trade_1 = tradeFactory({
      timestamp: '2019-01-02T01:00:00Z',
      side: 'SELL',
      base_amount: '5',
      base_code: 'BTC',
      quote_amount: '200',
      quote_code: 'ETH',
      fee_tx_ids: [trade_1_fee.tx_id]
    });
    const transactions = [deposit_1, deposit_2, deposit_2_fee, trade_1, trade_1_fee];
    const prices = [
      {
        tx_id: deposit_1.tx_id,
        timestamp: deposit_1.timestamp,
        base_code: 'BNB',
        quote_code: 'USD',
        price: '50'
      },
      {
        tx_id: deposit_2.tx_id,
        timestamp: deposit_2.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '1000'
      },
      {
        tx_id: deposit_2.tx_id,
        timestamp: deposit_2.timestamp,
        base_code: 'ETH',
        quote_code: 'USD',
        price: '50'
      },
      {
        tx_id: deposit_2_fee.tx_id,
        timestamp: deposit_2_fee.timestamp,
        base_code: 'BNB',
        quote_code: 'USD',
        price: '50'
      },
      {
        tx_id: trade_1.tx_id,
        timestamp: trade_1.timestamp,
        base_code: 'BTC',
        quote_code: 'USD',
        price: '1000'
      },
      {
        tx_id: trade_1.tx_id,
        timestamp: trade_1.timestamp,
        base_code: 'ETH',
        quote_code: 'USD',
        price: '100'
      },
      {
        tx_id: trade_1_fee.tx_id,
        timestamp: trade_1_fee.timestamp,
        base_code: 'BNB',
        quote_code: 'USD',
        price: '100'
      }
    ];
    const priceMethods: PriceMethod[] = ['BASE', 'QUOTE'];
    const accountingMethods: CostBasisMethod[] = ['FIFO', 'LIFO', 'HIFO'];
    priceMethods.forEach((price_method) => {
      accountingMethods.forEach((cost_basis_method) => {
        const received = createReport({
          transactions,
          prices,
          config: {
            local_currency: 'USD',
            price_method,
            cost_basis_method,
            decimal_places: 2
          }
        });
        let expected = taxReportFactory({
          report: {
            2019: {
              assets: {
                BTC: {
                  holdings: '5',
                  increase: '10',
                  decrease: '5'
                },
                ETH: {
                  holdings: '200',
                  increase: '200',
                  decrease: '0'
                },
                BNB: {
                  holdings: '6',
                  increase: '10',
                  decrease: '4'
                }
              },
              short: [
                {
                  asset: 'BNB',
                  asset_amount: '2',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-01T01:00:00Z',
                  proceeds: '100',
                  cost_basis: '100',
                  tx_id_lot: deposit_1.tx_id,
                  tx_id_sale: deposit_2_fee.tx_id
                },
                {
                  asset: 'BTC',
                  asset_amount: '5',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: price_method === 'QUOTE' ? '19800' : '4800',
                  cost_basis: '5050',
                  tx_id_lot: deposit_2.tx_id,
                  tx_id_sale: trade_1.tx_id
                },
                {
                  asset: 'BNB',
                  asset_amount: '2',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: '200',
                  cost_basis: '100',
                  tx_id_lot: deposit_1.tx_id,
                  tx_id_sale: trade_1_fee.tx_id
                }
              ]
            }
          },
          config: {
            local_currency: 'USD',
            price_method,
            cost_basis_method,
            decimal_places: 2,
            allow_lot_overlap: true
          }
        });
        expect(received).toEqual(expected);
      });
    });
  });
});
