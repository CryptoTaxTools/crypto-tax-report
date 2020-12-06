import createReport from '../../src/index';
import { taxReportFactory, tradeFactory, withdrawalFactory } from './../utils/factories';

describe('crypto/crypto short term gains with fees', () => {
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
    withdrawal_amount: '2',
    withdrawal_code: 'ETH'
  });
  const trade_4 = tradeFactory({
    timestamp: '2018-01-04T01:00:00Z',
    side: 'SELL',
    base_amount: '3',
    base_code: 'BTC',
    quote_amount: '200',
    quote_code: 'ETH',
    fee_tx_ids: [trade_4_fee.tx_id]
  });
  const transactions = [
    trade_1,
    trade_1_fee,
    trade_2_fee,
    trade_2,
    trade_3,
    trade_3_fee,
    trade_4_fee,
    trade_4
  ];
  const prices = [
    {
      tx_id: trade_1.tx_id,
      timestamp: trade_1.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '100'
    },
    {
      tx_id: trade_1_fee.tx_id,
      timestamp: trade_1_fee.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '100'
    },
    {
      tx_id: trade_2.tx_id,
      timestamp: trade_2.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '300'
    },
    {
      tx_id: trade_2_fee.tx_id,
      timestamp: trade_2_fee.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '300'
    },
    {
      tx_id: trade_3.tx_id,
      timestamp: trade_3.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '200'
    },
    {
      tx_id: trade_3_fee.tx_id,
      timestamp: trade_3_fee.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '200'
    },
    {
      tx_id: trade_4.tx_id,
      timestamp: trade_4.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '4000'
    },
    {
      tx_id: trade_4.tx_id,
      timestamp: trade_4.timestamp,
      base_code: 'ETH',
      quote_code: 'USD',
      price: '60'
    },
    {
      tx_id: trade_4_fee.tx_id,
      timestamp: trade_4_fee.timestamp,
      base_code: 'BTC',
      quote_code: 'USD',
      price: '4000'
    },
    {
      tx_id: trade_4_fee.tx_id,
      timestamp: trade_4_fee.timestamp,
      base_code: 'ETH',
      quote_code: 'USD',
      price: '60'
    }
  ];

  describe('Use Base', () => {
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
      const expected = taxReportFactory({
        report: {
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                increase: '3',
                decrease: '3'
              },
              ETH: {
                holdings: '198',
                increase: '200',
                decrease: '2'
              },
              USD: {
                holdings: '-603',
                increase: '0',
                decrease: '603'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '100',
                cost_basis: '0',
                date_acquired: trade_1.timestamp,
                date_sold: trade_1.timestamp,
                proceeds: '100',
                tx_id_sale: trade_1.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '1',
                cost_basis: '0',
                date_acquired: trade_1_fee.timestamp,
                date_sold: trade_1_fee.timestamp,
                proceeds: '1',
                tx_id_sale: trade_1_fee.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '1',
                cost_basis: '0',
                date_acquired: trade_2_fee.timestamp,
                date_sold: trade_2_fee.timestamp,
                proceeds: '1',
                tx_id_sale: trade_2_fee.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '300',
                cost_basis: '0',
                date_acquired: trade_2.timestamp,
                date_sold: trade_2.timestamp,
                proceeds: '300',
                tx_id_sale: trade_2.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '200',
                cost_basis: '0',
                date_acquired: trade_3.timestamp,
                date_sold: trade_3.timestamp,
                proceeds: '200',
                tx_id_sale: trade_3.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '1',
                cost_basis: '0',
                proceeds: '1',
                date_acquired: trade_3_fee.timestamp,
                date_sold: trade_3_fee.timestamp,
                tx_id_sale: trade_3_fee.tx_id
              }
            ],
            income: [],
            long: [],
            short: [
              // ETH sale comes first due to position in
              // transactions array
              {
                asset: 'ETH',
                asset_amount: '2',
                cost_basis: '120',
                proceeds: '120',
                tx_id_lot: trade_4.tx_id,
                tx_id_sale: trade_4_fee.tx_id,
                date_acquired: trade_4.timestamp,
                date_sold: trade_4.timestamp
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '201',
                tx_id_lot: trade_3.tx_id,
                tx_id_sale: trade_4.tx_id
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '301',
                tx_id_lot: trade_2.tx_id,
                tx_id_sale: trade_4.tx_id
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '101',
                tx_id_lot: trade_1.tx_id,
                tx_id_sale: trade_4.tx_id
              }
            ],
            lost: [],
            interest_income: []
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
});
