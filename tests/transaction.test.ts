import { Map as IMap, List } from 'immutable';
import { BigNumber } from 'bignumber.js';

import TaxLot from '../src/taxLot';
import Disposal from '../src/disposal';
import { makeLotsAndDisposals } from '../src/accounting';
import {
  depositFactory,
  withdrawalFactory,
  lostFactory,
  incomeFactory,
  tradeFactory
} from './utils/factories';

/*
  Every TRADE transaction scenario to base future tests on.

  TRADE.
    fiat/crypto
        Taxed currency and fiat trade portion are equal (USD)
            Note:
                Test BOTH crypto/fiat and fiat/crypto trades.
                Test both BASE & QUOTE price method in every test, since they should be equal.
            BTC/USD (crypto/fiat)
                side buy
                  no fee (test base & quote price method)
                  with fee fiat (test base & quote price method)
                  with fee crypto (test base & quote price method)
                  with foreign fee crypto (test base & quote price method)
                side sell
                  no fee (test base & quote price method)
                  with fee fiat (test base & quote price method)
                  with fee crypto (test base & quote price method)
                  with foreign fee crypto (test base & quote price method)
            USD/BTC (fiat/crypto)
                side buy
                  no fee (test base & quote price method)
                  with fee fiat (test base & quote price method)
                  with fee crypto (test base & quote price method)
                  with foreign fee crypto (test base & quote price method)
                side sell
                  no fee (test base & quote price method)
                  with fee fiat (test base & quote price method)
                  with fee crypto (test base & quote price method)
                  with foreign fee crypto (test base & quote price method)
        FUTURE: Taxed currency and fiat trade portion are unequal (Example: GBP & USD)
    crypto/crypto
        use BASE prices
            side buy
              no fee
              with fee fiat
              with fee crypto
              with foreign fee crypto
            side sell
              no fee
              with fee fiat
              with fee crypto
              with foreign fee crypto
        use QUOTE prices
            side buy
              no fee
              with fee fiat
              with fee crypto
              with foreign fee crypto
            side sell
              no fee
              with fee fiat
              with fee crypto
              with foreign fee crypto
 */

/*
  Currently tested scenarios:
  TRADE type
    side buy
      no fee (test base & quote price method)
      with fee fiat (test base & quote price method)
      with fee crypto (test base & quote price method)
      with foreign fee crypto (test base & quote price method)
    side sell
      no fee (test base & quote price method)
      with fee fiat (test base & quote price method)
      with fee crypto (test base & quote price method)
      with foreign fee crypto (test base & quote price method)
 */

// TODO: remove references to NONE once we refactor NONE out of the TRADE data model.
// NONE seems kind of unnecssary since we only use it to identify trades that were
// We can use another less important property to identify these trades.
// TODO: Need to test DEPOSIT when fee matches deposit asset and when it does not.

describe('TRADE transaction', () => {
  /*
   * The function we are testing does not differentiate
   * between crypto/crypto trades and crypto/fiat trades.
   * We test crypto/fiat but it does not matter.
   */
  describe('crypto base / fiat quote', () => {
    describe('BUY trade', () => {
      test('type: TRADE, assets: crypto/fiat, side: BUY, fee: none, price method: BASE & QUOTE', () => {
        const transactions = List([
          IMap(
            tradeFactory({
              timestamp: '2018-01-01T09:30:00Z',
              tx_id: '1',
              side: 'BUY',
              base_amount: '1',
              base_code: 'BTC',
              quote_amount: '100',
              quote_code: 'USD'
            })
          )
        ]);
        const priceTable = IMap({
          '1': List([
            IMap({
              base_code: 'BTC',
              quote_code: 'USD',
              price: '100'
            }),
            IMap({
              base_code: 'USD',
              quote_code: 'USD',
              price: '1'
            })
          ])
        });
        const actualBaseMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'BASE',
          localCurrency: 'USD'
        });
        const actualQuoteMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'QUOTE',
          localCurrency: 'USD'
        });
        const expected = IMap({
          taxLotList: List([
            new TaxLot({
              unix: 1514799000,
              assetCode: 'BTC',
              assetAmount: new BigNumber('1'),
              basisCode: 'USD',
              basisAmount: new BigNumber('100'),
              transactionId: '1',
              isIncome: false
            })
          ]),
          disposalList: List([
            new Disposal({
              unix: 1514799000,
              assetCode: 'USD',
              assetAmount: new BigNumber('100'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('100'),
              transactionId: '1'
            })
          ])
        });
        expect(actualBaseMethod.equals(expected)).toEqual(true);
        expect(actualQuoteMethod.equals(expected)).toEqual(true);

        expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('100')
        );
        expect(actualQuoteMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('100')
        );
      });
      test('type: TRADE, assets: crypto/fiat, side: BUY | NONE, fee: fiat, price method: BASE & QUOTE', () => {
        const transactions = List([
          IMap(
            tradeFactory({
              timestamp: '2018-01-01T09:30:00Z',
              tx_id: '1',
              side: 'NONE',
              base_amount: '1',
              base_code: 'BTC',
              quote_amount: '100',
              quote_code: 'USD',
              fee_amount: '5',
              fee_code: 'USD'
            })
          )
        ]);
        const priceTable = IMap({
          '1': List([
            IMap({
              base_code: 'BTC',
              quote_code: 'USD',
              price: '100'
            }),
            IMap({
              base_code: 'USD',
              quote_code: 'USD',
              price: '1'
            })
          ])
        });
        const actualBaseMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'BASE',
          localCurrency: 'USD'
        });
        const actualQuoteMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'QUOTE',
          localCurrency: 'USD'
        });
        const expected = IMap({
          taxLotList: List([
            new TaxLot({
              unix: 1514799000,
              assetCode: 'BTC',
              assetAmount: new BigNumber('1'),
              basisCode: 'USD',
              basisAmount: new BigNumber('105'),
              transactionId: '1',
              isIncome: false
            })
          ]),
          disposalList: List([
            new Disposal({
              unix: 1514799000,
              assetCode: 'USD',
              assetAmount: new BigNumber('105'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('100'),
              transactionId: '1'
            })
          ])
        });

        expect(actualBaseMethod.equals(expected)).toEqual(true);
        expect(actualQuoteMethod.equals(expected)).toEqual(true);

        expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('105')
        );
        expect(actualQuoteMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('105')
        );
      });
      test('type: TRADE, assets: crypto/fiat, side: BUY, fee: crypto, price method: BASE & QUOTE', () => {
        const transactions = List([
          IMap(
            tradeFactory({
              timestamp: '2018-01-01T09:30:00Z',
              tx_id: '1',
              side: 'BUY',
              base_amount: '1',
              base_code: 'BTC',
              quote_amount: '100',
              quote_code: 'USD',
              fee_amount: '0.1',
              fee_code: 'BTC'
            })
          )
        ]);
        const priceTable = IMap({
          '1': List([
            IMap({
              base_code: 'BTC',
              quote_code: 'USD',
              price: '100'
            }),
            IMap({
              base_code: 'USD',
              quote_code: 'USD',
              price: '1'
            })
          ])
        });
        const actualBaseMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'BASE',
          localCurrency: 'USD'
        });
        const actualQuoteMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'QUOTE',
          localCurrency: 'USD'
        });

        const expected = IMap({
          taxLotList: List([
            new TaxLot({
              unix: 1514799000,
              assetCode: 'BTC',
              assetAmount: new BigNumber('0.9'),
              basisCode: 'USD',
              basisAmount: new BigNumber('110'),
              transactionId: '1',
              isIncome: false
            })
          ]),
          disposalList: List([
            new Disposal({
              unix: 1514799000,
              assetCode: 'USD',
              assetAmount: new BigNumber('100'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('100'),
              transactionId: '1'
            })
          ])
        });

        expect(actualBaseMethod.equals(expected)).toEqual(true);
        expect(actualQuoteMethod.equals(expected)).toEqual(true);

        expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('122.22222222222222222222')
        );
        expect(actualQuoteMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('122.22222222222222222222')
        );
      });
      test('type: TRADE, assets: crypto/fiat, side: BUY | NONE, fee: foreign crypto, price method: BASE & QUOTE', () => {
        const transactions = List([
          IMap(
            tradeFactory({
              timestamp: '2018-01-01T09:30:00Z',
              tx_id: '1',
              side: 'NONE',
              base_amount: '1',
              base_code: 'BTC',
              quote_amount: '100',
              quote_code: 'USD',
              fee_amount: '1',
              fee_code: 'ETH'
            })
          )
        ]);
        const priceTable = IMap({
          '1': List([
            IMap({
              base_code: 'BTC',
              quote_code: 'USD',
              price: '100'
            }),
            IMap({
              base_code: 'USD',
              quote_code: 'USD',
              price: '1'
            }),
            IMap({
              base_code: 'ETH',
              quote_code: 'USD',
              price: '5'
            })
          ])
        });
        const actualBaseMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'BASE',
          localCurrency: 'USD'
        });
        const actualQuoteMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'QUOTE',
          localCurrency: 'USD'
        });

        const expected = IMap({
          taxLotList: List([
            new TaxLot({
              unix: 1514799000,
              assetCode: 'BTC',
              assetAmount: new BigNumber('1'),
              basisCode: 'USD',
              basisAmount: new BigNumber('105'),
              transactionId: '1',
              isIncome: false
            })
          ]),
          disposalList: List([
            new Disposal({
              unix: 1514799000,
              assetCode: 'USD',
              assetAmount: new BigNumber('100'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('100'),
              transactionId: '1'
            }),
            new Disposal({
              unix: 1514799000,
              assetCode: 'ETH',
              assetAmount: new BigNumber('1'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('5'),
              transactionId: '1'
            })
          ])
        });

        expect(actualBaseMethod.equals(expected)).toEqual(true);
        expect(actualQuoteMethod.equals(expected)).toEqual(true);

        expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('105')
        );
        expect(actualQuoteMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('105')
        );
      });
    });
    describe('SELL trade', () => {
      test('type: TRADE, assets: crypto/fiat, side: SELL, fee: none, price method: BASE & QUOTE', () => {
        const transactions = List([
          IMap(
            tradeFactory({
              timestamp: '2018-01-01T09:30:00Z',
              tx_id: '1',
              side: 'SELL',
              base_amount: '1',
              base_code: 'BTC',
              quote_amount: '100',
              quote_code: 'USD'
            })
          )
        ]);
        const priceTable = IMap({
          '1': List([
            IMap({
              base_code: 'BTC',
              quote_code: 'USD',
              price: '100'
            }),
            IMap({
              base_code: 'USD',
              quote_code: 'USD',
              price: '1'
            })
          ])
        });
        const actualBaseMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'BASE',
          localCurrency: 'USD'
        });
        const actualQuoteMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'QUOTE',
          localCurrency: 'USD'
        });
        const expected = IMap({
          taxLotList: List([
            new TaxLot({
              unix: 1514799000,
              assetCode: 'USD',
              assetAmount: new BigNumber('100'),
              basisCode: 'USD',
              basisAmount: new BigNumber('100'),
              transactionId: '1',
              isIncome: false
            })
          ]),
          disposalList: List([
            new Disposal({
              unix: 1514799000,
              assetCode: 'BTC',
              assetAmount: new BigNumber('1'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('100'),
              transactionId: '1'
            })
          ])
        });
        expect(actualBaseMethod.equals(expected)).toEqual(true);
        expect(actualQuoteMethod.equals(expected)).toEqual(true);

        expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(new BigNumber('1'));
        expect(actualQuoteMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(new BigNumber('1'));
      });
      test('type: TRADE, assets: crypto/fiat, side: SELL, fee: fiat, price method: BASE & QUOTE', () => {
        const transactions = List([
          IMap(
            tradeFactory({
              timestamp: '2018-01-01T09:30:00Z',
              tx_id: '1',
              side: 'SELL',
              base_amount: '1',
              base_code: 'BTC',
              quote_amount: '100',
              quote_code: 'USD',
              fee_amount: '10',
              fee_code: 'USD'
            })
          )
        ]);
        const priceTable = IMap({
          '1': List([
            IMap({
              base_code: 'BTC',
              quote_code: 'USD',
              price: '100'
            }),
            IMap({
              base_code: 'USD',
              quote_code: 'USD',
              price: '1'
            })
          ])
        });
        const actualBaseMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'BASE',
          localCurrency: 'USD'
        });
        const actualQuoteMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'QUOTE',
          localCurrency: 'USD'
        });
        const expected = IMap({
          taxLotList: List([
            new TaxLot({
              unix: 1514799000,
              assetCode: 'USD',
              assetAmount: new BigNumber('90'),
              basisCode: 'USD',
              basisAmount: new BigNumber('100'),
              transactionId: '1',
              isIncome: false
            })
          ]),
          disposalList: List([
            new Disposal({
              unix: 1514799000,
              assetCode: 'BTC',
              assetAmount: new BigNumber('1'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('90'),
              transactionId: '1'
            })
          ])
        });
        expect(actualBaseMethod.equals(expected)).toEqual(true);
        expect(actualQuoteMethod.equals(expected)).toEqual(true);

        expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('1.11111111111111111111')
        );
        expect(actualQuoteMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(
          new BigNumber('1.11111111111111111111')
        );
      });
      test('type: TRADE, assets: crypto/fiat, side: SELL, fee: crypto, price method: BASE & QUOTE', () => {
        const transactions = List([
          IMap(
            tradeFactory({
              timestamp: '2018-01-01T09:30:00Z',
              tx_id: '1',
              side: 'SELL',
              base_amount: '1',
              base_code: 'BTC',
              quote_amount: '100',
              quote_code: 'USD',
              fee_amount: '0.1',
              fee_code: 'BTC'
            })
          )
        ]);
        const priceTable = IMap({
          '1': List([
            IMap({
              base_code: 'BTC',
              quote_code: 'USD',
              price: '100'
            }),
            IMap({
              base_code: 'USD',
              quote_code: 'USD',
              price: '1'
            })
          ])
        });
        const actualBaseMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'BASE',
          localCurrency: 'USD'
        });
        const actualQuoteMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'QUOTE',
          localCurrency: 'USD'
        });
        const expected = IMap({
          taxLotList: List([
            new TaxLot({
              unix: 1514799000,
              assetCode: 'USD',
              assetAmount: new BigNumber('100'),
              basisCode: 'USD',
              basisAmount: new BigNumber('100'),
              transactionId: '1',
              isIncome: false
            })
          ]),
          disposalList: List([
            new Disposal({
              unix: 1514799000,
              assetCode: 'BTC',
              assetAmount: new BigNumber('1.1'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('90'),
              transactionId: '1'
            })
          ])
        });
        expect(actualBaseMethod.equals(expected)).toEqual(true);
        expect(actualQuoteMethod.equals(expected)).toEqual(true);

        expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(new BigNumber('1'));
        expect(actualQuoteMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(new BigNumber('1'));
      });
      test('type: TRADE, assets: crypto/fiat, side: BUY, fee: foreign crypto, price method: BASE & QUOTE', () => {
        const transactions = List([
          IMap(
            tradeFactory({
              timestamp: '2018-01-01T09:30:00Z',
              tx_id: '1',
              side: 'SELL',
              base_amount: '1',
              base_code: 'BTC',
              quote_amount: '100',
              quote_code: 'USD',
              fee_amount: '1',
              fee_code: 'ETH'
            })
          )
        ]);
        const priceTable = IMap({
          '1': List([
            IMap({
              base_code: 'BTC',
              quote_code: 'USD',
              price: '100'
            }),
            IMap({
              base_code: 'USD',
              quote_code: 'USD',
              price: '1'
            }),
            IMap({
              base_code: 'ETH',
              quote_code: 'USD',
              price: '5'
            })
          ])
        });
        const actualBaseMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'BASE',
          localCurrency: 'USD'
        });
        const actualQuoteMethod = makeLotsAndDisposals({
          transactions,
          priceTable,
          priceMethod: 'QUOTE',
          localCurrency: 'USD'
        });
        const expected = IMap({
          taxLotList: List([
            new TaxLot({
              unix: 1514799000,
              assetCode: 'USD',
              assetAmount: new BigNumber('100'),
              basisCode: 'USD',
              basisAmount: new BigNumber('100'),
              transactionId: '1',
              isIncome: false
            })
          ]),
          disposalList: List([
            new Disposal({
              unix: 1514799000,
              assetCode: 'BTC',
              assetAmount: new BigNumber('1'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('95'),
              transactionId: '1'
            }),
            new Disposal({
              unix: 1514799000,
              assetCode: 'ETH',
              assetAmount: new BigNumber('1'),
              proceedsCode: 'USD',
              proceedsAmount: new BigNumber('5'),
              transactionId: '1'
            })
          ])
        });
        expect(actualBaseMethod.equals(expected)).toEqual(true);
        expect(actualQuoteMethod.equals(expected)).toEqual(true);

        expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(new BigNumber('1'));
        expect(actualQuoteMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(new BigNumber('1'));
      });
    });
  });
});

describe('DEPOSIT transaction', () => {
  test('TaxLot from DEPOSIT', () => {
    const transactions = List([
      IMap(
        depositFactory({
          tx_id: '1',
          deposit_amount: '1',
          deposit_code: 'BTC',
          timestamp: '2018-01-01T09:30:00Z'
        })
      )
    ]);
    const priceTable = IMap({
      '1': List([
        IMap({
          base_code: 'BTC',
          quote_code: 'USD',
          price: '100'
        })
      ])
    });
    const actualBaseMethod = makeLotsAndDisposals({
      transactions,
      priceTable,
      priceMethod: 'BASE',
      localCurrency: 'USD'
    });
    const expected = IMap({
      taxLotList: List([
        new TaxLot({
          unix: 1514799000,
          assetCode: 'BTC',
          assetAmount: new BigNumber('1'),
          basisCode: 'USD',
          basisAmount: new BigNumber('100'),
          transactionId: '1',
          isIncome: false
        })
      ]),
      disposalList: List([])
    });

    expect(actualBaseMethod.equals(expected)).toEqual(true);

    expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(new BigNumber('100'));
  });
});

describe('INCOME transaction', () => {
  test('TaxLot from INCOME', () => {
    const transactions = List([
      IMap(
        incomeFactory({
          timestamp: '2018-01-01T09:30:00Z',
          tx_id: '1',
          income_amount: '1',
          income_code: 'BTC'
        })
      )
    ]);
    const priceTable = IMap({
      '1': List([
        IMap({
          base_code: 'BTC',
          quote_code: 'USD',
          price: '100'
        })
      ])
    });
    const actualBaseMethod = makeLotsAndDisposals({
      transactions,
      priceTable,
      priceMethod: 'BASE',
      localCurrency: 'USD'
    });
    const expected = IMap({
      taxLotList: List([
        new TaxLot({
          unix: 1514799000,
          assetCode: 'BTC',
          assetAmount: new BigNumber('1'),
          basisCode: 'USD',
          basisAmount: new BigNumber('100'),
          transactionId: '1',
          isIncome: true
        })
      ]),
      disposalList: List([])
    });

    expect(actualBaseMethod.equals(expected)).toEqual(true);

    expect(actualBaseMethod.getIn(['taxLotList', 0]).pricePerUnit).toEqual(new BigNumber('100'));
  });
});

describe('WITHDRAWAL transaction', () => {
  test('with no fee', () => {
    const transactions = List([
      IMap(
        withdrawalFactory({
          timestamp: '2018-01-01T09:30:00Z',
          tx_id: '1',
          withdrawal_amount: '1',
          withdrawal_code: 'BTC'
        })
      )
    ]);
    const priceTable = IMap({
      '1': List([
        IMap({
          base_code: 'BTC',
          quote_code: 'USD',
          price: '100'
        })
      ])
    });
    const actualBaseMethod = makeLotsAndDisposals({
      transactions,
      priceTable,
      priceMethod: 'BASE',
      localCurrency: 'USD'
    });
    const expected = IMap({
      taxLotList: List([]),
      disposalList: List([
        new Disposal({
          unix: 1514799000,
          assetCode: 'BTC',
          assetAmount: new BigNumber('1'),
          proceedsCode: 'USD',
          proceedsAmount: new BigNumber('100'),
          transactionId: '1'
        })
      ])
    });

    expect(actualBaseMethod.equals(expected)).toEqual(true);
  });
  test('with fee matching withdrawn asset', () => {
    const transactions = List([
      IMap(
        withdrawalFactory({
          timestamp: '2018-01-01T09:30:00Z',
          tx_id: '1',
          withdrawal_amount: '1',
          withdrawal_code: 'BTC',
          fee_amount: '0.01',
          fee_code: 'BTC'
        })
      )
    ]);
    const priceTable = IMap({
      '1': List([
        IMap({
          base_code: 'BTC',
          quote_code: 'USD',
          price: '100'
        })
      ])
    });
    const actualBaseMethod = makeLotsAndDisposals({
      transactions,
      priceTable,
      priceMethod: 'BASE',
      localCurrency: 'USD'
    });
    const expected = IMap({
      taxLotList: List([]),
      disposalList: List([
        new Disposal({
          unix: 1514799000,
          assetCode: 'BTC',
          assetAmount: new BigNumber('1.01'),
          proceedsCode: 'USD',
          proceedsAmount: new BigNumber('99'),
          transactionId: '1'
        })
      ])
    });

    expect(actualBaseMethod.equals(expected)).toEqual(true);
  });
  test('with fee not matching', () => {
    const transactions = List([
      IMap(
        withdrawalFactory({
          timestamp: '2018-01-01T09:30:00Z',
          tx_id: '1',
          withdrawal_amount: '1',
          withdrawal_code: 'BTC',
          fee_amount: '1',
          fee_code: 'ETH'
        })
      )
    ]);
    const priceTable = IMap({
      '1': List([
        IMap({
          base_code: 'BTC',
          quote_code: 'USD',
          price: '100'
        }),
        IMap({
          base_code: 'ETH',
          quote_code: 'USD',
          price: '10'
        })
      ])
    });
    const actualBaseMethod = makeLotsAndDisposals({
      transactions,
      priceTable,
      priceMethod: 'BASE',
      localCurrency: 'USD'
    });
    const expected = IMap({
      taxLotList: List([]),
      disposalList: List([
        new Disposal({
          unix: 1514799000,
          assetCode: 'BTC',
          assetAmount: new BigNumber('1'),
          proceedsCode: 'USD',
          proceedsAmount: new BigNumber('90'),
          transactionId: '1'
        }),
        new Disposal({
          unix: 1514799000,
          assetCode: 'ETH',
          assetAmount: new BigNumber('1'),
          proceedsCode: 'USD',
          proceedsAmount: new BigNumber('10'),
          transactionId: '1'
        })
      ])
    });

    expect(actualBaseMethod.equals(expected)).toEqual(true);
  });
});

describe('LOST transaction', () => {
  test('with no fee', () => {
    const transactions = List([
      IMap(
        lostFactory({
          timestamp: '2018-01-01T09:30:00Z',
          tx_id: '1',
          lost_amount: '1',
          lost_code: 'BTC'
        })
      )
    ]);
    const priceTable = IMap({
      '1': List([
        IMap({
          base_code: 'BTC',
          quote_code: 'USD',
          price: '100'
        })
      ])
    });
    const actualBaseMethod = makeLotsAndDisposals({
      transactions,
      priceTable,
      priceMethod: 'BASE',
      localCurrency: 'USD'
    });
    const expected = IMap({
      taxLotList: List([]),
      disposalList: List([
        new Disposal({
          unix: 1514799000,
          assetCode: 'BTC',
          assetAmount: new BigNumber('1'),
          proceedsCode: 'USD',
          proceedsAmount: new BigNumber('100'),
          transactionId: '1',
          isLost: true
        })
      ])
    });

    expect(actualBaseMethod.equals(expected)).toEqual(true);
  });
  test('with fee matching lost asset', () => {
    const transactions = List([
      IMap(
        lostFactory({
          timestamp: '2018-01-01T09:30:00Z',
          tx_id: '1',
          lost_amount: '1',
          lost_code: 'BTC',
          fee_amount: '0.01',
          fee_code: 'BTC'
        })
      )
    ]);
    const priceTable = IMap({
      '1': List([
        IMap({
          base_code: 'BTC',
          quote_code: 'USD',
          price: '100'
        })
      ])
    });
    const actualBaseMethod = makeLotsAndDisposals({
      transactions,
      priceTable,
      priceMethod: 'BASE',
      localCurrency: 'USD'
    });
    const expected = IMap({
      taxLotList: List([]),
      disposalList: List([
        new Disposal({
          unix: 1514799000,
          assetCode: 'BTC',
          assetAmount: new BigNumber('1.01'),
          proceedsCode: 'USD',
          proceedsAmount: new BigNumber('99'),
          transactionId: '1',
          isLost: true
        })
      ])
    });

    expect(actualBaseMethod.equals(expected)).toEqual(true);
  });
  test('with fee not matching', () => {
    const transactions = List([
      IMap(
        lostFactory({
          timestamp: '2018-01-01T09:30:00Z',
          tx_id: '1',
          lost_amount: '1',
          lost_code: 'BTC',
          fee_amount: '1',
          fee_code: 'ETH'
        })
      )
    ]);
    const priceTable = IMap({
      '1': List([
        IMap({
          base_code: 'BTC',
          quote_code: 'USD',
          price: '100'
        }),
        IMap({
          base_code: 'ETH',
          quote_code: 'USD',
          price: '10'
        })
      ])
    });
    const actualBaseMethod = makeLotsAndDisposals({
      transactions,
      priceTable,
      priceMethod: 'BASE',
      localCurrency: 'USD'
    });
    const expected = IMap({
      taxLotList: List([]),
      disposalList: List([
        new Disposal({
          unix: 1514799000,
          assetCode: 'BTC',
          assetAmount: new BigNumber('1'),
          proceedsCode: 'USD',
          proceedsAmount: new BigNumber('90'),
          transactionId: '1',
          isLost: true
        }),
        new Disposal({
          unix: 1514799000,
          assetCode: 'ETH',
          assetAmount: new BigNumber('1'),
          proceedsCode: 'USD',
          proceedsAmount: new BigNumber('10'),
          transactionId: '1'
        })
      ])
    });

    expect(actualBaseMethod.equals(expected)).toEqual(true);
  });
});
