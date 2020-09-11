import createReport from '../src/index';
import { PriceMethod, CostBasisMethod } from '../src/types';
import {
  taxReportFactory,
  depositFactory,
  withdrawalFactory,
  lostFactory,
  incomeFactory,
  tradeFactory
} from './utils/factories';

test('Empty transactions', () => {
  try {
    createReport({
      transactions: [],
      prices: [],
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
  } catch (error) {
    expect(error.name).toEqual('EmptyParamError');
    expect(error.message).toEqual(
      'The "transactions" config parameter must include at least one object.'
    );
  }
});

describe('crypto/fiat long term gains', () => {
  const trade_1 = tradeFactory({
    timestamp: '2018-01-01T09:30:00Z',
    side: 'BUY',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '200',
    quote_code: 'USD',
    fee_amount: '5',
    fee_code: 'USD'
  });
  const trade_2 = tradeFactory({
    timestamp: '2019-01-04T12:00:00Z',
    side: 'BUY',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '153.19',
    quote_code: 'USD',
    fee_amount: '2',
    fee_code: 'USD'
  });
  const trade_3 = tradeFactory({
    timestamp: '2020-01-31T13:00:00Z',
    side: 'SELL',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '250',
    quote_code: 'USD',
    fee_amount: '5',
    fee_code: 'USD'
  });
  const transactions = [trade_1, trade_2, trade_3];
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
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            ETH: {
              holdings: '1',
              bought: '1',
              sold: '0'
            },
            USD: {
              holdings: '-205',
              bought: '0',
              sold: '205'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              proceeds: '200',
              date_sold: '2018-01-01T09:30:00Z',
              cost_basis: '0',
              asset_amount: '205',
              date_acquired: '2018-01-01T09:30:00Z',
              transaction_id: trade_1.tx_id
            }
          ]
        },
        2019: {
          assets: {
            ETH: {
              holdings: '2',
              bought: '1',
              sold: '0'
            },
            USD: {
              holdings: '-360.19',
              bought: '0',
              sold: '155.19'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              proceeds: '153.19',
              date_sold: '2019-01-04T12:00:00Z',
              cost_basis: '0',
              asset_amount: '155.19',
              date_acquired: '2019-01-04T12:00:00Z',
              transaction_id: trade_2.tx_id
            }
          ]
        },
        2020: {
          assets: {
            ETH: {
              holdings: '1',
              bought: '0',
              sold: '1'
            },
            USD: {
              holdings: '-115.19',
              bought: '245',
              sold: '0'
            }
          },
          long: [
            {
              asset: 'ETH',
              asset_amount: '1',
              date_acquired: '2018-01-01T09:30:00Z',
              date_sold: '2020-01-31T13:00:00Z',
              proceeds: '245',
              cost_basis: '205'
            }
          ]
        }
      }),
      config: {
        price_method: 'BASE',
        cost_basis_method: 'FIFO'
      }
    };
    expect(received).toEqual(expected);
  });
  test('HIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'HIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            ETH: {
              holdings: '1',
              bought: '1',
              sold: '0'
            },
            USD: {
              holdings: '-205',
              bought: '0',
              sold: '205'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '205',
              cost_basis: '0',
              date_acquired: '2018-01-01T09:30:00Z',
              date_sold: '2018-01-01T09:30:00Z',
              proceeds: '200',
              transaction_id: trade_1.tx_id
            }
          ]
        },
        2019: {
          assets: {
            ETH: {
              holdings: '2',
              bought: '1',
              sold: '0'
            },
            USD: {
              holdings: '-360.19',
              bought: '0',
              sold: '155.19'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '155.19',
              cost_basis: '0',
              date_acquired: '2019-01-04T12:00:00Z',
              date_sold: '2019-01-04T12:00:00Z',
              proceeds: '153.19',
              transaction_id: trade_2.tx_id
            }
          ]
        },
        2020: {
          assets: {
            ETH: {
              holdings: '1',
              bought: '0',
              sold: '1'
            },
            USD: {
              holdings: '-115.19',
              bought: '245',
              sold: '0'
            }
          },
          long: [
            {
              asset: 'ETH',
              asset_amount: '1',
              date_acquired: '2018-01-01T09:30:00Z',
              date_sold: '2020-01-31T13:00:00Z',
              proceeds: '245',
              cost_basis: '205'
            }
          ]
        }
      }),
      config: {
        price_method: 'BASE',
        cost_basis_method: 'HIFO'
      }
    };
    expect(received).toEqual(expected);
  });
  test('LIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'LIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            ETH: {
              holdings: '1',
              bought: '1',
              sold: '0'
            },
            USD: {
              holdings: '-205',
              bought: '0',
              sold: '205'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '205',
              cost_basis: '0',
              date_acquired: '2018-01-01T09:30:00Z',
              date_sold: '2018-01-01T09:30:00Z',
              proceeds: '200',
              transaction_id: trade_1.tx_id
            }
          ]
        },
        2019: {
          assets: {
            ETH: {
              holdings: '2',
              bought: '1',
              sold: '0'
            },
            USD: {
              holdings: '-360.19',
              bought: '0',
              sold: '155.19'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '155.19',
              cost_basis: '0',
              date_acquired: '2019-01-04T12:00:00Z',
              date_sold: '2019-01-04T12:00:00Z',
              proceeds: '153.19',
              transaction_id: trade_2.tx_id
            }
          ]
        },
        2020: {
          assets: {
            ETH: {
              holdings: '1',
              bought: '0',
              sold: '1'
            },
            USD: {
              holdings: '-115.19',
              bought: '245',
              sold: '0'
            }
          },
          long: [
            {
              asset: 'ETH',
              asset_amount: '1',
              date_acquired: '2019-01-04T12:00:00Z',
              date_sold: '2020-01-31T13:00:00Z',
              proceeds: '245',
              cost_basis: '155.19'
            }
          ]
        }
      }),
      config: {
        price_method: 'BASE',
        cost_basis_method: 'LIFO'
      }
    };
    expect(received).toEqual(expected);
  });
});

describe('crypto/fiat short term gains', () => {
  const transactions = [
    tradeFactory({
      timestamp: '2018-01-01T01:00:00Z',
      tx_id: '1',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '100',
      quote_code: 'USD',
      fee_amount: '1',
      fee_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2018-01-02T01:00:00Z',
      tx_id: '2',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '300',
      quote_code: 'USD',
      fee_amount: '1',
      fee_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2018-01-03T01:00:00Z',
      tx_id: '3',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '200',
      quote_code: 'USD',
      fee_amount: '1',
      fee_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2018-01-04T01:00:00Z',
      tx_id: '4',
      side: 'SELL',
      base_amount: '3',
      base_code: 'BTC',
      quote_amount: '1000',
      quote_code: 'USD',
      fee_amount: '3',
      fee_code: 'USD'
    })
  ];
  const prices = [
    {
      tx_id: '1',
      timestamp: '2018-01-01T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '100'
    },
    {
      tx_id: '1',
      timestamp: '2018-01-01T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: '2',
      timestamp: '2018-01-02T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '300'
    },
    {
      tx_id: '2',
      timestamp: '2018-01-02T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: '3',
      timestamp: '2018-01-03T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '200'
    },
    {
      tx_id: '3',
      timestamp: '2018-01-03T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: '4',
      timestamp: '2018-01-04T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '333.3333333'
    },
    {
      tx_id: '4',
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
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              bought: '3',
              sold: '3'
            },
            USD: {
              holdings: '394',
              bought: '997',
              sold: '603'
            }
          },
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '101'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '301'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '201'
            }
          ],
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '101',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '100',
              transaction_id: '1'
            },
            {
              asset: 'USD',
              asset_amount: '301',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '300',
              transaction_id: '2'
            },
            {
              asset: 'USD',
              asset_amount: '201',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '200',
              transaction_id: '3'
            }
          ]
        }
      }),
      config: {
        price_method: 'BASE',
        cost_basis_method: 'FIFO'
      }
    };
    expect(received).toEqual(expected);
  });
  test('HIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'HIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              bought: '3',
              sold: '3'
            },
            USD: {
              holdings: '394',
              bought: '997',
              sold: '603'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '101',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '100',
              transaction_id: '1'
            },
            {
              asset: 'USD',
              asset_amount: '301',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '300',
              transaction_id: '2'
            },
            {
              asset: 'USD',
              asset_amount: '201',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '200',
              transaction_id: '3'
            }
          ],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '301'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '201'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '101'
            }
          ]
        }
      }),
      config: {
        cost_basis_method: 'HIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('LIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'LIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              bought: '3',
              sold: '3'
            },
            USD: {
              holdings: '394',
              bought: '997',
              sold: '603'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '101',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '100',
              transaction_id: '1'
            },
            {
              asset: 'USD',
              asset_amount: '301',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '300',
              transaction_id: '2'
            },
            {
              asset: 'USD',
              asset_amount: '201',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '200',
              transaction_id: '3'
            }
          ],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '201'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '301'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '101'
            }
          ]
        }
      }),
      config: {
        cost_basis_method: 'LIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
});

describe('crypto/fiat short term unmatched gains', () => {
  const prices = [
    {
      tx_id: '1',
      timestamp: '2018-01-04T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '333.3333333'
    }
  ];
  const transactions = [
    tradeFactory({
      timestamp: '2018-01-04T01:00:00Z',
      tx_id: '1',
      side: 'SELL',
      base_amount: '3',
      base_code: 'BTC',
      quote_amount: '1000',
      quote_code: 'USD',
      fee_amount: '3',
      fee_code: 'USD'
    })
  ];
  const received = createReport({
    transactions,
    prices,
    config: {
      localCurrency: 'USD',
      priceMethod: 'BASE',
      costBasisMethod: 'FIFO',
      decimalPlaces: 2
    }
  });
  let expected = {
    report: taxReportFactory({
      2018: {
        assets: {
          BTC: {
            holdings: '-3',
            bought: '0',
            sold: '3'
          },
          USD: {
            holdings: '997',
            bought: '997',
            sold: '0'
          }
        },
        short: [
          {
            asset: 'BTC',
            asset_amount: '3',
            cost_basis: '0',
            date_acquired: '2018-01-04T01:00:00Z',
            date_sold: '2018-01-04T01:00:00Z',
            proceeds: '997'
          }
        ],
        unmatched: [
          {
            asset: 'BTC',
            asset_amount: '3',
            cost_basis: '0',
            date_acquired: '2018-01-04T01:00:00Z',
            date_sold: '2018-01-04T01:00:00Z',
            proceeds: '997',
            transaction_id: '1'
          }
        ]
      }
    }),
    config: {
      price_method: 'BASE',
      cost_basis_method: 'FIFO'
    }
  };
  expect(received).toEqual(expected);
});

describe('crypto/fiat short term gains with null fees', () => {
  const prices = [
    {
      tx_id: '1',
      timestamp: '2018-01-01T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '101'
    },
    {
      tx_id: '1',
      timestamp: '2018-01-01T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: '2',
      timestamp: '2018-01-02T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '301'
    },
    {
      tx_id: '2',
      timestamp: '2018-01-02T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: '3',
      timestamp: '2018-01-03T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '201'
    },
    {
      tx_id: '3',
      timestamp: '2018-01-03T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: '4',
      timestamp: '2018-01-04T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '332.33'
    },
    {
      tx_id: '4',
      timestamp: '2018-01-04T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    }
  ];

  const transactions = [
    tradeFactory({
      timestamp: '2018-01-01T01:00:00Z',
      tx_id: '1',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '101',
      quote_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2018-01-02T01:00:00Z',
      tx_id: '2',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '301',
      quote_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2018-01-03T01:00:00Z',
      tx_id: '3',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '201',
      quote_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2018-01-04T01:00:00Z',
      tx_id: '4',
      side: 'SELL',
      base_amount: '3',
      base_code: 'BTC',
      quote_amount: '997',
      quote_code: 'USD'
    })
  ];

  test('FIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              bought: '3',
              sold: '3'
            },
            USD: {
              holdings: '394',
              bought: '997',
              sold: '603'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '101',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '101',
              transaction_id: '1'
            },
            {
              asset: 'USD',
              asset_amount: '301',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '301',
              transaction_id: '2'
            },
            {
              asset: 'USD',
              asset_amount: '201',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '201',
              transaction_id: '3'
            }
          ],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '101'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '301'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '201'
            }
          ]
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('HIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'HIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              bought: '3',
              sold: '3'
            },
            USD: {
              holdings: '394',
              bought: '997',
              sold: '603'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '101',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '101',
              transaction_id: '1'
            },
            {
              asset: 'USD',
              asset_amount: '301',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '301',
              transaction_id: '2'
            },
            {
              asset: 'USD',
              asset_amount: '201',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '201',
              transaction_id: '3'
            }
          ],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '301'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '201'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '101'
            }
          ]
        }
      }),
      config: {
        cost_basis_method: 'HIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('LIFO', () => {
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'LIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              bought: '3',
              sold: '3'
            },
            USD: {
              holdings: '394',
              bought: '997',
              sold: '603'
            }
          },
          unmatched: [
            {
              asset: 'USD',
              asset_amount: '101',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '101',
              transaction_id: '1'
            },
            {
              asset: 'USD',
              asset_amount: '301',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '301',
              transaction_id: '2'
            },
            {
              asset: 'USD',
              asset_amount: '201',
              cost_basis: '0',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '201',
              transaction_id: '3'
            }
          ],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-03T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '201'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '301'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-04T01:00:00Z',
              proceeds: '332.33',
              cost_basis: '101'
            }
          ]
        }
      }),
      config: {
        cost_basis_method: 'LIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
});

describe('crypto/crypto long term gains', () => {
  const trade_1 = tradeFactory({
    timestamp: '2018-01-01T09:30:00Z',
    side: 'BUY',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '200',
    quote_code: 'USD',
    fee_amount: '5',
    fee_code: 'USD'
  });
  const trade_2 = tradeFactory({
    timestamp: '2019-01-04T12:00:00Z',
    side: 'BUY',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '153.19',
    quote_code: 'USD',
    fee_amount: '2',
    fee_code: 'USD'
  });
  const trade_3 = tradeFactory({
    timestamp: '2019-01-31T13:00:00Z',
    side: 'BUY',
    base_amount: '2',
    base_code: 'ETH',
    quote_amount: '250',
    quote_code: 'USD',
    fee_amount: '5',
    fee_code: 'USD'
  });
  const trade_4 = tradeFactory({
    timestamp: '2020-03-03T15:00:00Z',
    side: 'SELL',
    base_amount: '1',
    base_code: 'ETH',
    quote_amount: '0.07',
    quote_code: 'BTC',
    fee_amount: '0.001',
    fee_code: 'BTC'
  });
  const trade_5 = tradeFactory({
    timestamp: '2021-05-01T20:00:00Z',
    side: 'SELL',
    base_amount: '0.069',
    base_code: 'BTC',
    quote_amount: '345',
    quote_code: 'USD',
    fee_amount: '4',
    fee_code: 'USD'
  });
  const transactions = [trade_1, trade_2, trade_3, trade_4, trade_5];
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
    test('FIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'FIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                bought: '0',
                sold: '0',
                holdings: '0'
              },
              ETH: {
                holdings: '1',
                bought: '1',
                sold: '0'
              },
              USD: {
                holdings: '-205',
                bought: '0',
                sold: '205'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '205',
                cost_basis: '0',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                proceeds: '200',
                transaction_id: trade_1.tx_id
              }
            ]
          },
          2019: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '4',
                bought: '3',
                sold: '0'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '410.19'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '155.19',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '153.19',
                transaction_id: trade_2.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '255',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '250',
                transaction_id: trade_3.tx_id
              }
            ]
          },
          2020: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '1'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '0'
              },
              BTC: {
                holdings: '0.069',
                bought: '0.069',
                sold: '0'
              }
            },
            long: [
              {
                asset: 'ETH',
                asset_amount: '1',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                proceeds: '133.08',
                cost_basis: '205'
              }
            ]
          },
          2021: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '0'
              },
              USD: {
                holdings: '-274.19',
                bought: '341',
                sold: '0'
              },
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0.069'
              }
            },
            long: [
              {
                asset: 'BTC',
                asset_amount: '0.069',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2021-05-01T20:00:00Z',
                proceeds: '341',
                cost_basis: '135'
              }
            ]
          }
        }),
        config: {
          cost_basis_method: 'FIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('LIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'LIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '1',
                bought: '1',
                sold: '0'
              },
              USD: {
                holdings: '-205',
                bought: '0',
                sold: '205'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '205',
                cost_basis: '0',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                proceeds: '200',
                transaction_id: trade_1.tx_id
              }
            ]
          },
          2019: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '4',
                bought: '3',
                sold: '0'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '410.19'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '155.19',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '153.19',
                transaction_id: trade_2.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '255',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '250',
                transaction_id: trade_3.tx_id
              }
            ]
          },
          2020: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '1'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '0'
              },
              BTC: {
                holdings: '0.069',
                bought: '0.069',
                sold: '0'
              }
            },
            long: [
              {
                asset: 'ETH',
                asset_amount: '1',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                proceeds: '133.08',
                cost_basis: '127.5'
              }
            ]
          },
          2021: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '0'
              },
              USD: {
                holdings: '-274.19',
                bought: '341',
                sold: '0'
              },
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0.069'
              }
            },
            long: [
              {
                asset: 'BTC',
                asset_amount: '0.069',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2021-05-01T20:00:00Z',
                proceeds: '341',
                cost_basis: '135'
              }
            ]
          }
        }),
        config: {
          cost_basis_method: 'LIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('HIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'HIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '1',
                bought: '1',
                sold: '0'
              },
              USD: {
                holdings: '-205',
                bought: '0',
                sold: '205'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '205',
                cost_basis: '0',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                proceeds: '200',
                transaction_id: trade_1.tx_id
              }
            ]
          },
          2019: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '4',
                bought: '3',
                sold: '0'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '410.19'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '155.19',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '153.19',
                transaction_id: trade_2.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '255',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '250',
                transaction_id: trade_3.tx_id
              }
            ]
          },
          2020: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '1'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '0'
              },
              BTC: {
                holdings: '0.069',
                bought: '0.069',
                sold: '0'
              }
            },
            long: [
              {
                asset: 'ETH',
                asset_amount: '1',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                proceeds: '133.08',
                cost_basis: '205'
              }
            ]
          },
          2021: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '0'
              },
              USD: {
                holdings: '-274.19',
                bought: '341',
                sold: '0'
              },
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0.069'
              }
            },
            long: [
              {
                asset: 'BTC',
                asset_amount: '0.069',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2021-05-01T20:00:00Z',
                proceeds: '341',
                cost_basis: '135'
              }
            ]
          }
        }),
        config: {
          cost_basis_method: 'HIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
  });
  describe('Use Quote', () => {
    test('FIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'QUOTE',
          costBasisMethod: 'FIFO',
          decimalPlaces: 3
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '1',
                bought: '1',
                sold: '0'
              },
              USD: {
                holdings: '-205',
                bought: '0',
                sold: '205'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '205',
                cost_basis: '0',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                proceeds: '200',
                transaction_id: trade_1.tx_id
              }
            ]
          },
          2019: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '4',
                bought: '3',
                sold: '0'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '410.19'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '155.19',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '153.19',
                transaction_id: trade_2.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '255',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '250',
                transaction_id: trade_3.tx_id
              }
            ]
          },
          2020: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '1'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '0'
              },
              BTC: {
                holdings: '0.069',
                bought: '0.069',
                sold: '0'
              }
            },
            long: [
              {
                asset: 'ETH',
                asset_amount: '1',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                proceeds: '132.83',
                cost_basis: '205'
              }
            ]
          },
          2021: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '0'
              },
              USD: {
                holdings: '-274.19',
                bought: '341',
                sold: '0'
              },
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0.069'
              }
            },
            long: [
              {
                asset: 'BTC',
                asset_amount: '0.069',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2021-05-01T20:00:00Z',
                proceeds: '341',
                cost_basis: '134.75'
              }
            ]
          }
        }),
        config: {
          cost_basis_method: 'FIFO',
          price_method: 'QUOTE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('LIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'QUOTE',
          costBasisMethod: 'LIFO',
          decimalPlaces: 3
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '1',
                bought: '1',
                sold: '0'
              },
              USD: {
                holdings: '-205',
                bought: '0',
                sold: '205'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '205',
                cost_basis: '0',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                proceeds: '200',
                transaction_id: trade_1.tx_id
              }
            ]
          },
          2019: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '4',
                bought: '3',
                sold: '0'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '410.19'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '155.19',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '153.19',
                transaction_id: trade_2.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '255',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '250',
                transaction_id: trade_3.tx_id
              }
            ]
          },
          2020: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '1'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '0'
              },
              BTC: {
                holdings: '0.069',
                bought: '0.069',
                sold: '0'
              }
            },
            long: [
              {
                asset: 'ETH',
                asset_amount: '1',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                proceeds: '132.83',
                cost_basis: '127.5'
              }
            ]
          },
          2021: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '0'
              },
              USD: {
                holdings: '-274.19',
                bought: '341',
                sold: '0'
              },
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0.069'
              }
            },
            long: [
              {
                asset: 'BTC',
                asset_amount: '0.069',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2021-05-01T20:00:00Z',
                proceeds: '341',
                cost_basis: '134.75'
              }
            ]
          }
        }),
        config: {
          cost_basis_method: 'LIFO',
          price_method: 'QUOTE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('HIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'QUOTE',
          costBasisMethod: 'HIFO',
          decimalPlaces: 3
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '1',
                bought: '1',
                sold: '0'
              },
              USD: {
                holdings: '-205',
                bought: '0',
                sold: '205'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '205',
                cost_basis: '0',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2018-01-01T09:30:00Z',
                proceeds: '200',
                transaction_id: trade_1.tx_id
              }
            ],
            lost: [],
            interest_income: []
          },
          2019: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0'
              },
              ETH: {
                holdings: '4',
                bought: '3',
                sold: '0'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '410.19'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '155.19',
                cost_basis: '0',
                date_acquired: '2019-01-04T12:00:00Z',
                date_sold: '2019-01-04T12:00:00Z',
                proceeds: '153.19',
                transaction_id: trade_2.tx_id
              },
              {
                asset: 'USD',
                asset_amount: '255',
                cost_basis: '0',
                date_acquired: '2019-01-31T13:00:00Z',
                date_sold: '2019-01-31T13:00:00Z',
                proceeds: '250',
                transaction_id: trade_3.tx_id
              }
            ]
          },
          2020: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '1'
              },
              USD: {
                holdings: '-615.19',
                bought: '0',
                sold: '0'
              },
              BTC: {
                holdings: '0.069',
                bought: '0.069',
                sold: '0'
              }
            },
            long: [
              {
                asset: 'ETH',
                asset_amount: '1',
                date_acquired: '2018-01-01T09:30:00Z',
                date_sold: '2020-03-03T15:00:00Z',
                proceeds: '132.83',
                cost_basis: '205'
              }
            ]
          },
          2021: {
            assets: {
              ETH: {
                holdings: '3',
                bought: '0',
                sold: '0'
              },
              USD: {
                holdings: '-274.19',
                bought: '341',
                sold: '0'
              },
              BTC: {
                holdings: '0',
                bought: '0',
                sold: '0.069'
              }
            },
            long: [
              {
                asset: 'BTC',
                asset_amount: '0.069',
                date_acquired: '2020-03-03T15:00:00Z',
                date_sold: '2021-05-01T20:00:00Z',
                proceeds: '341',
                cost_basis: '134.75'
              }
            ]
          }
        }),
        config: {
          cost_basis_method: 'HIFO',
          price_method: 'QUOTE'
        }
      };
      expect(received).toEqual(expected);
    });
  });
});

describe('crypto/fiat short term gains with free BTC and null fees', () => {
  const prices = [
    {
      tx_id: '1',
      timestamp: '2019-01-01T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '3000'
    },
    {
      tx_id: '1',
      timestamp: '2019-01-01T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: '2',
      timestamp: '2019-02-01T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '0'
    },
    {
      tx_id: '2',
      timestamp: '2019-02-01T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    },
    {
      tx_id: '3',
      timestamp: '2019-03-01T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '3500'
    },
    {
      tx_id: '3',
      timestamp: '2019-03-01T01:00:00Z',
      base_code: 'USD',
      quote_code: 'USD',
      price: '1'
    }
  ];

  const transactions = [
    tradeFactory({
      timestamp: '2019-01-01T01:00:00Z',
      tx_id: '1',
      side: 'NONE',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '3000',
      quote_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2019-02-01T01:00:00Z',
      tx_id: '2',
      side: 'NONE',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '0',
      quote_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2019-03-01T01:00:00Z',
      tx_id: '3',
      side: 'NONE',
      base_amount: '3500',
      base_code: 'USD',
      quote_amount: '1',
      quote_code: 'BTC'
    })
  ];

  describe('Use quote price', () => {
    test('FIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'QUOTE',
          costBasisMethod: 'FIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2019: {
            assets: {
              BTC: {
                holdings: '1',
                bought: '2',
                sold: '1'
              },
              USD: {
                holdings: '500',
                bought: '3500',
                sold: '3000'
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
                transaction_id: '1'
              }
            ],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2019-01-01T01:00:00Z',
                date_sold: '2019-03-01T01:00:00Z',
                proceeds: '3500',
                cost_basis: '3000'
              }
            ]
          }
        }),
        config: {
          cost_basis_method: 'FIFO',
          price_method: 'QUOTE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('LIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'QUOTE',
          costBasisMethod: 'LIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2019: {
            assets: {
              BTC: {
                holdings: '1',
                bought: '2',
                sold: '1'
              },
              USD: {
                holdings: '500',
                bought: '3500',
                sold: '3000'
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
                transaction_id: '1'
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2019-02-01T01:00:00Z',
                date_sold: '2019-03-01T01:00:00Z',
                proceeds: '3500',
                cost_basis: '0'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'LIFO',
          price_method: 'QUOTE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('HIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'QUOTE',
          costBasisMethod: 'HIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2019: {
            assets: {
              BTC: {
                holdings: '1',
                bought: '2',
                sold: '1'
              },
              USD: {
                holdings: '500',
                bought: '3500',
                sold: '3000'
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
                transaction_id: '1'
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
                cost_basis: '3000'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'HIFO',
          price_method: 'QUOTE'
        }
      };
      expect(received).toEqual(expected);
    });
  });
  describe('Use base price', () => {
    test('FIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'FIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2019: {
            assets: {
              BTC: {
                holdings: '1',
                bought: '2',
                sold: '1'
              },
              USD: {
                holdings: '500',
                bought: '3500',
                sold: '3000'
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
                transaction_id: '1'
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
                cost_basis: '3000'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'FIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('LIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'LIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2019: {
            assets: {
              BTC: {
                holdings: '1',
                bought: '2',
                sold: '1'
              },
              USD: {
                holdings: '500',
                bought: '3500',
                sold: '3000'
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
                transaction_id: '1'
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2019-02-01T01:00:00Z',
                date_sold: '2019-03-01T01:00:00Z',
                proceeds: '3500',
                cost_basis: '0'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'LIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('HIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'HIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2019: {
            assets: {
              BTC: {
                holdings: '1',
                bought: '2',
                sold: '1'
              },
              USD: {
                holdings: '500',
                bought: '3500',
                sold: '3000'
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
                transaction_id: '1'
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
                cost_basis: '3000'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'HIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
  });
});

describe('crypto/crypto short term gains', () => {
  const prices = [
    {
      tx_id: '1',
      timestamp: '2018-01-01T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '100'
    },
    {
      tx_id: '2',
      timestamp: '2018-01-02T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '300'
    },
    {
      tx_id: '3',
      timestamp: '2018-01-03T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '200'
    },
    {
      tx_id: '4',
      timestamp: '2018-01-04T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '4000'
    },
    {
      tx_id: '4',
      timestamp: '2018-01-04T01:00:00Z',
      base_code: 'ETH',
      quote_code: 'USD',
      price: '60'
    }
  ];

  const transactions = [
    tradeFactory({
      timestamp: '2018-01-01T01:00:00Z',
      tx_id: '1',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '100',
      quote_code: 'USD',
      fee_amount: '1',
      fee_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2018-01-02T01:00:00Z',
      tx_id: '2',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '300',
      quote_code: 'USD',
      fee_amount: '1',
      fee_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2018-01-03T01:00:00Z',
      tx_id: '3',
      side: 'BUY',
      base_amount: '1',
      base_code: 'BTC',
      quote_amount: '200',
      quote_code: 'USD',
      fee_amount: '1',
      fee_code: 'USD'
    }),
    tradeFactory({
      timestamp: '2018-01-04T01:00:00Z',
      tx_id: '4',
      side: 'SELL',
      base_amount: '3',
      base_code: 'BTC',
      quote_amount: '200',
      quote_code: 'ETH',
      fee_amount: '2',
      fee_code: 'ETH'
    })
  ];

  describe('Use Base', () => {
    let decimalPlaces = 2;
    test('FIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'FIFO',
          decimalPlaces
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '3',
                sold: '3'
              },
              ETH: {
                holdings: '198',
                bought: '198',
                sold: '0'
              },
              USD: {
                holdings: '-603',
                bought: '0',
                sold: '603'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '101',
                cost_basis: '0',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-01T01:00:00Z',
                proceeds: '100',
                transaction_id: '1'
              },
              {
                asset: 'USD',
                asset_amount: '301',
                cost_basis: '0',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '300',
                transaction_id: '2'
              },
              {
                asset: 'USD',
                asset_amount: '201',
                cost_basis: '0',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-03T01:00:00Z',
                proceeds: '200',
                transaction_id: '3'
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '101'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '301'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '201'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'FIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('LIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'LIFO',
          decimalPlaces
        }
      });
      const expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '3',
                sold: '3'
              },
              ETH: {
                holdings: '198',
                bought: '198',
                sold: '0'
              },
              USD: {
                holdings: '-603',
                bought: '0',
                sold: '603'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '101',
                cost_basis: '0',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-01T01:00:00Z',
                proceeds: '100',
                transaction_id: '1'
              },
              {
                asset: 'USD',
                asset_amount: '301',
                cost_basis: '0',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '300',
                transaction_id: '2'
              },
              {
                asset: 'USD',
                asset_amount: '201',
                cost_basis: '0',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-03T01:00:00Z',
                proceeds: '200',
                transaction_id: '3'
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '201'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '301'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '101'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'LIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('HIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'HIFO',
          decimalPlaces
        }
      });
      const expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '3',
                sold: '3'
              },
              ETH: {
                holdings: '198',
                bought: '198',
                sold: '0'
              },
              USD: {
                holdings: '-603',
                bought: '0',
                sold: '603'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '101',
                cost_basis: '0',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-01T01:00:00Z',
                proceeds: '100',
                transaction_id: '1'
              },
              {
                asset: 'USD',
                asset_amount: '301',
                cost_basis: '0',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '300',
                transaction_id: '2'
              },
              {
                asset: 'USD',
                asset_amount: '201',
                cost_basis: '0',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-03T01:00:00Z',
                proceeds: '200',
                transaction_id: '3'
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '301'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '201'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '101'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'HIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
  });
  describe('Use Quote', () => {
    const decimalPlaces = 2;
    test('FIFO', () => {
      const expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '3',
                sold: '3'
              },
              ETH: {
                holdings: '198',
                bought: '198',
                sold: '0'
              },
              USD: {
                holdings: '-603',
                bought: '0',
                sold: '603'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '101',
                cost_basis: '0',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-01T01:00:00Z',
                proceeds: '100',
                transaction_id: '1'
              },
              {
                asset: 'USD',
                asset_amount: '301',
                cost_basis: '0',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '300',
                transaction_id: '2'
              },
              {
                asset: 'USD',
                asset_amount: '201',
                cost_basis: '0',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-03T01:00:00Z',
                proceeds: '200',
                transaction_id: '3'
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '101'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '301'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '201'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'FIFO',
          price_method: 'QUOTE'
        }
      };
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'QUOTE',
          costBasisMethod: 'FIFO',
          decimalPlaces
        }
      });
      expect(received).toEqual(expected);
    });
    test('LIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'QUOTE',
          costBasisMethod: 'LIFO',
          decimalPlaces
        }
      });
      const expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '3',
                sold: '3'
              },
              ETH: {
                holdings: '198',
                bought: '198',
                sold: '0'
              },
              USD: {
                holdings: '-603',
                bought: '0',
                sold: '603'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '101',
                cost_basis: '0',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-01T01:00:00Z',
                proceeds: '100',
                transaction_id: '1'
              },
              {
                asset: 'USD',
                asset_amount: '301',
                cost_basis: '0',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '300',
                transaction_id: '2'
              },
              {
                asset: 'USD',
                asset_amount: '201',
                cost_basis: '0',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-03T01:00:00Z',
                proceeds: '200',
                transaction_id: '3'
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '201'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '301'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '101'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'LIFO',
          price_method: 'QUOTE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('HIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'QUOTE',
          costBasisMethod: 'HIFO',
          decimalPlaces
        }
      });
      const expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '3',
                sold: '3'
              },
              ETH: {
                holdings: '198',
                bought: '198',
                sold: '0'
              },
              USD: {
                holdings: '-603',
                bought: '0',
                sold: '603'
              }
            },
            unmatched: [
              {
                asset: 'USD',
                asset_amount: '101',
                cost_basis: '0',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-01T01:00:00Z',
                proceeds: '100',
                transaction_id: '1'
              },
              {
                asset: 'USD',
                asset_amount: '301',
                cost_basis: '0',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '300',
                transaction_id: '2'
              },
              {
                asset: 'USD',
                asset_amount: '201',
                cost_basis: '0',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-03T01:00:00Z',
                proceeds: '200',
                transaction_id: '3'
              }
            ],
            income: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '301'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '201'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '3960',
                cost_basis: '101'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'HIFO',
          price_method: 'QUOTE'
        }
      };
      expect(received).toEqual(expected);
    });
  });
});

describe('fiat -> crypto -> fiat -> crypto scenario', () => {
  test('No fiat sales in short/long array', () => {
    const transactions = [
      tradeFactory({
        timestamp: '2018-01-01T09:30:00Z',
        tx_id: '1',
        side: 'BUY',
        base_amount: '1',
        base_code: 'BTC',
        quote_amount: '100',
        quote_code: 'USD'
      }),
      tradeFactory({
        timestamp: '2018-01-02T09:30:00Z',
        tx_id: '2',
        side: 'NONE',
        base_amount: '1000',
        base_code: 'USD',
        quote_amount: '1',
        quote_code: 'BTC'
      }),
      tradeFactory({
        timestamp: '2018-01-03T09:30:00Z',
        tx_id: '3',
        side: 'NONE',
        base_amount: '20',
        base_code: 'ETH',
        quote_amount: '500',
        quote_code: 'USD'
      })
    ];

    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T09:30:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '100'
      },
      {
        tx_id: '1',
        timestamp: '2018-01-01T09:30:00Z',
        base_code: 'USD',
        quote_code: 'USD',
        price: '1'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-02T09:30:00Z',
        base_code: 'USD',
        quote_code: 'USD',
        price: '1'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-02T09:30:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '1000'
      },
      {
        tx_id: '3',
        timestamp: '2018-01-03T09:30:00Z',
        base_code: 'USD',
        quote_code: 'USD',
        price: '1'
      },
      {
        tx_id: '3',
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
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    const expected = {
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      },
      report: taxReportFactory({
        '2018': {
          assets: {
            BTC: {
              bought: '1',
              holdings: '0',
              sold: '1'
            },
            ETH: {
              bought: '20',
              holdings: '20',
              sold: '0'
            },
            USD: {
              bought: '1000',
              holdings: '400',
              sold: '600'
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
              proceeds: '1000'
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
              transaction_id: '1'
            }
          ],
          lost: [],
          interest_income: []
        }
      })
    };
    expect(result).toEqual(expected);
  });
});

describe('deposit assets', () => {
  describe('crypto/fiat short term gains - deposit BTC - null fees on deposit', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '100'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-02T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '300'
      },
      {
        tx_id: '3',
        timestamp: '2018-01-03T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '200'
      },
      {
        tx_id: '4',
        timestamp: '2018-01-04T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '333.3333333'
      }
    ];

    const transactions = [
      depositFactory({
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        deposit_amount: '1',
        deposit_code: 'BTC'
      }),
      depositFactory({
        tx_id: '2',
        timestamp: '2018-01-02T01:00:00Z',
        deposit_amount: '1',
        deposit_code: 'BTC'
      }),
      depositFactory({
        tx_id: '3',
        timestamp: '2018-01-03T01:00:00Z',
        deposit_amount: '1',
        deposit_code: 'BTC'
      }),
      tradeFactory({
        timestamp: '2018-01-04T01:00:00Z',
        tx_id: '4',
        side: 'SELL',
        base_amount: '3',
        base_code: 'BTC',
        quote_amount: '1000',
        quote_code: 'USD',
        fee_amount: '3',
        fee_code: 'USD'
      })
    ];

    test('FIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'FIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '3',
                sold: '3'
              },
              USD: {
                holdings: '997',
                bought: '997',
                sold: '0'
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
                cost_basis: '100'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '300'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '200'
              }
            ],
            unmatched: [],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          price_method: 'BASE',
          cost_basis_method: 'FIFO'
        }
      };
      expect(received).toEqual(expected);
    });
    test('HIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'HIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '3',
                sold: '3'
              },
              USD: {
                holdings: '997',
                bought: '997',
                sold: '0'
              }
            },
            income: [],
            unmatched: [],
            long: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '300'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '200'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '100'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'HIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
    test('LIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'LIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '0',
                bought: '3',
                sold: '3'
              },
              USD: {
                holdings: '997',
                bought: '997',
                sold: '0'
              }
            },
            unmatched: [],
            long: [],
            income: [],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-03T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '200'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '300'
              },
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-04T01:00:00Z',
                proceeds: '332.33',
                cost_basis: '100'
              }
            ],
            lost: [],
            interest_income: []
          }
        }),
        config: {
          cost_basis_method: 'LIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
  });

  describe('crypto/fiat short term gains with - deposit BTC - null fees', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2019-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '3000'
      },
      {
        tx_id: '2',
        timestamp: '2019-02-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '0'
      },
      {
        tx_id: '3',
        timestamp: '2019-03-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '3500'
      }
    ];

    const transactions = [
      depositFactory({
        timestamp: '2019-01-01T01:00:00Z',
        tx_id: '1',
        deposit_amount: '1',
        deposit_code: 'BTC'
      }),
      depositFactory({
        timestamp: '2019-02-01T01:00:00Z',
        tx_id: '2',
        deposit_amount: '1',
        deposit_code: 'BTC'
      }),
      tradeFactory({
        timestamp: '2019-03-01T01:00:00Z',
        tx_id: '3',
        side: 'NONE',
        base_amount: '3500',
        base_code: 'USD',
        quote_amount: '1',
        quote_code: 'BTC'
      })
    ];

    describe('use_quote price', () => {
      const priceOption = 'QUOTE';
      test('FIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'FIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '1',
                  bought: '2',
                  sold: '1'
                },
                USD: {
                  holdings: '3500',
                  bought: '3500',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '1',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-03-01T01:00:00Z',
                  proceeds: '3500',
                  cost_basis: '3000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'FIFO',
            price_method: 'QUOTE'
          }
        };
        expect(received).toEqual(expected);
      });
      test('LIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'LIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '1',
                  bought: '2',
                  sold: '1'
                },
                USD: {
                  holdings: '3500',
                  bought: '3500',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '1',
                  date_acquired: '2019-02-01T01:00:00Z',
                  date_sold: '2019-03-01T01:00:00Z',
                  proceeds: '3500',
                  cost_basis: '0'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'LIFO',
            price_method: 'QUOTE'
          }
        };
        expect(received).toEqual(expected);
      });
      test('HIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'HIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '1',
                  bought: '2',
                  sold: '1'
                },
                USD: {
                  holdings: '3500',
                  bought: '3500',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '1',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-03-01T01:00:00Z',
                  proceeds: '3500',
                  cost_basis: '3000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'HIFO',
            price_method: 'QUOTE'
          }
        };
        expect(received).toEqual(expected);
      });
    });
    describe('use_base price', () => {
      const priceOption = 'BASE';
      test('FIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'FIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '1',
                  bought: '2',
                  sold: '1'
                },
                USD: {
                  holdings: '3500',
                  bought: '3500',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '1',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-03-01T01:00:00Z',
                  proceeds: '3500',
                  cost_basis: '3000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'FIFO',
            price_method: 'BASE'
          }
        };
        expect(received).toEqual(expected);
      });
      test('LIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'LIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '1',
                  bought: '2',
                  sold: '1'
                },
                USD: {
                  holdings: '3500',
                  bought: '3500',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '1',
                  date_acquired: '2019-02-01T01:00:00Z',
                  date_sold: '2019-03-01T01:00:00Z',
                  proceeds: '3500',
                  cost_basis: '0'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'LIFO',
            price_method: 'BASE'
          }
        };
        expect(received).toEqual(expected);
      });
      test('HIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'HIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '1',
                  bought: '2',
                  sold: '1'
                },
                USD: {
                  holdings: '3500',
                  bought: '3500',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '1',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-03-01T01:00:00Z',
                  proceeds: '3500',
                  cost_basis: '3000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'HIFO',
            price_method: 'BASE'
          }
        };
        expect(received).toEqual(expected);
      });
    });
  });

  describe('crypto/crypto short term gains - deposit BTC - fees with fee code === quote code', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2019-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '1000'
      },
      {
        tx_id: '2',
        timestamp: '2019-01-02T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '1000'
      },
      {
        tx_id: '2',
        timestamp: '2019-01-02T01:00:00Z',
        base_code: 'ETH',
        quote_code: 'USD',
        price: '100'
      }
    ];
    const transactions = [
      depositFactory({
        timestamp: '2019-01-01T01:00:00Z',
        tx_id: '1',
        deposit_amount: '10',
        deposit_code: 'BTC'
      }),
      tradeFactory({
        timestamp: '2019-01-02T01:00:00Z',
        tx_id: '2',
        side: 'SELL',
        base_amount: '5',
        base_code: 'BTC',
        quote_amount: '200',
        quote_code: 'ETH',
        fee_amount: '2',
        fee_code: 'ETH'
      })
    ];

    describe('use quote price', () => {
      const priceOption = 'QUOTE';
      test('FIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'FIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '5',
                  bought: '10',
                  sold: '5'
                },
                ETH: {
                  holdings: '198',
                  bought: '198',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '5',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: '19800',
                  cost_basis: '5000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'FIFO',
            price_method: 'QUOTE'
          }
        };
        expect(received).toEqual(expected);
      });
      test('LIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'LIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '5',
                  bought: '10',
                  sold: '5'
                },
                ETH: {
                  holdings: '198',
                  bought: '198',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '5',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: '19800',
                  cost_basis: '5000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'LIFO',
            price_method: 'QUOTE'
          }
        };
        expect(received).toEqual(expected);
      });
      test('HIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'HIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '5',
                  bought: '10',
                  sold: '5'
                },
                ETH: {
                  holdings: '198',
                  bought: '198',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '5',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: '19800',
                  cost_basis: '5000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'HIFO',
            price_method: 'QUOTE'
          }
        };
        expect(received).toEqual(expected);
      });
    });
    describe('use base price', () => {
      const priceOption = 'BASE';
      test('FIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'FIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '5',
                  bought: '10',
                  sold: '5'
                },
                ETH: {
                  holdings: '198',
                  bought: '198',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '5',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: '4800',
                  cost_basis: '5000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'FIFO',
            price_method: 'BASE'
          }
        };
        expect(received).toEqual(expected);
      });
      test('LIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'LIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '5',
                  bought: '10',
                  sold: '5'
                },
                ETH: {
                  holdings: '198',
                  bought: '198',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '5',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: '4800',
                  cost_basis: '5000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'LIFO',
            price_method: 'BASE'
          }
        };
        expect(received).toEqual(expected);
      });
      test('HIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'HIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '5',
                  bought: '10',
                  sold: '5'
                },
                ETH: {
                  holdings: '198',
                  bought: '198',
                  sold: '0'
                }
              },
              unmatched: [],
              long: [],
              income: [],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '5',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: '4800',
                  cost_basis: '5000'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'HIFO',
            price_method: 'BASE'
          }
        };
        expect(received).toEqual(expected);
      });
    });
  });

  test('crypto/crypto short term gains - deposit BTC, deposit BNB - fees with fee code !== quote code', () => {
    const prices = [
      {
        tx_id: '0',
        timestamp: '2019-01-01T01:00:00Z',
        base_code: 'BNB',
        quote_code: 'USD',
        price: '50'
      },
      {
        tx_id: '1',
        timestamp: '2019-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '1000'
      },
      {
        tx_id: '1',
        timestamp: '2019-01-01T01:00:00Z',
        base_code: 'ETH',
        quote_code: 'USD',
        price: '50'
      },
      {
        tx_id: '1',
        timestamp: '2019-01-01T01:00:00Z',
        base_code: 'BNB',
        quote_code: 'USD',
        price: '50'
      },
      {
        tx_id: '2',
        timestamp: '2019-01-02T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '1000'
      },
      {
        tx_id: '2',
        timestamp: '2019-01-02T01:00:00Z',
        base_code: 'ETH',
        quote_code: 'USD',
        price: '100'
      },
      {
        tx_id: '2',
        timestamp: '2019-01-02T01:00:00Z',
        base_code: 'BNB',
        quote_code: 'USD',
        price: '100'
      }
    ];

    const transactions = [
      depositFactory({
        timestamp: '2019-01-01T01:00:00Z',
        tx_id: '0',
        deposit_amount: '10',
        deposit_code: 'BNB'
      }),
      depositFactory({
        timestamp: '2019-01-01T01:00:00Z',
        tx_id: '1',
        deposit_amount: '10',
        deposit_code: 'BTC',
        fee_code: 'BNB',
        fee_amount: '2'
      }),
      tradeFactory({
        timestamp: '2019-01-02T01:00:00Z',
        tx_id: '2',
        side: 'SELL',
        base_amount: '5',
        base_code: 'BTC',
        quote_amount: '200',
        quote_code: 'ETH',
        fee_amount: '2',
        fee_code: 'BNB'
      })
    ];

    ['BASE', 'QUOTE'].forEach((priceMethod: PriceMethod) => {
      ['FIFO', 'LIFO', 'HIFO'].forEach((costBasisMethod: CostBasisMethod) => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod,
            costBasisMethod,
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2019: {
              assets: {
                BTC: {
                  holdings: '5',
                  bought: '10',
                  sold: '5'
                },
                ETH: {
                  holdings: '200',
                  bought: '200',
                  sold: '0'
                },
                BNB: {
                  holdings: '6',
                  bought: '10',
                  sold: '4'
                }
              },
              short: [
                {
                  asset: 'BNB',
                  asset_amount: '2',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-01T01:00:00Z',
                  proceeds: '100',
                  cost_basis: '100'
                },
                {
                  asset: 'BTC',
                  asset_amount: '5',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: priceMethod === 'QUOTE' ? '19800' : '4800',
                  cost_basis: '5050'
                },
                {
                  asset: 'BNB',
                  asset_amount: '2',
                  date_acquired: '2019-01-01T01:00:00Z',
                  date_sold: '2019-01-02T01:00:00Z',
                  proceeds: '200',
                  cost_basis: '100'
                }
              ]
            }
          }),
          config: {
            cost_basis_method: costBasisMethod,
            price_method: priceMethod
          }
        };
        expect(received).toEqual(expected);
      });
    });
  });
});

describe('withdraw assets', () => {
  describe('crypto/fiat short term gains - withdraw BTC - fees with fee code === quote code', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-02T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '11000'
      }
    ];

    const transactions = [
      depositFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        deposit_amount: '10',
        deposit_code: 'BTC',
        fee_amount: '1',
        fee_code: 'USD'
      }),
      withdrawalFactory({
        timestamp: '2018-01-02T01:00:00Z',
        tx_id: '2',
        withdrawal_amount: '1',
        withdrawal_code: 'BTC',
        fee_amount: '1',
        fee_code: 'USD'
      })
    ];
    test('FIFO', () => {
      const received = createReport({
        transactions,
        prices,
        config: {
          localCurrency: 'USD',
          priceMethod: 'BASE',
          costBasisMethod: 'FIFO',
          decimalPlaces: 2
        }
      });
      let expected = {
        report: taxReportFactory({
          2018: {
            assets: {
              BTC: {
                holdings: '9',
                bought: '10',
                sold: '1'
              },
              USD: {
                bought: '0',
                holdings: '-2',
                sold: '2'
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
                transaction_id: '1'
              },
              {
                asset: 'USD',
                asset_amount: '1',
                cost_basis: '0',
                date_acquired: '2018-01-02T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '1',
                transaction_id: '2'
              }
            ],
            short: [
              {
                asset: 'BTC',
                asset_amount: '1',
                date_acquired: '2018-01-01T01:00:00Z',
                date_sold: '2018-01-02T01:00:00Z',
                proceeds: '10999',
                cost_basis: '10000.1'
              }
            ]
          }
        }),
        config: {
          cost_basis_method: 'FIFO',
          price_method: 'BASE'
        }
      };
      expect(received).toEqual(expected);
    });
  });
  describe('crypto/crypto short term gains - withdraw - null fees ', () => {
    const transactions = [
      tradeFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        side: 'None',
        base_amount: '10',
        base_code: 'BTC',
        quote_amount: '1000',
        quote_code: 'USD'
      }),
      withdrawalFactory({
        timestamp: '2018-01-02T01:00:00Z',
        tx_id: '2',
        withdrawal_amount: '1',
        withdrawal_code: 'BTC'
      })
    ];
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '100'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-02T01:00:00Z',
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
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'FIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2018: {
              assets: {
                BTC: {
                  holdings: '9',
                  bought: '10',
                  sold: '1'
                },
                USD: {
                  holdings: '-1000',
                  bought: '0',
                  sold: '1000'
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
                  transaction_id: '1'
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
                  cost_basis: '100'
                }
              ],
              lost: [],
              interest_income: []
            }
          }),
          config: {
            cost_basis_method: 'FIFO',
            price_method: 'QUOTE'
          }
        };
        expect(received).toEqual(expected);
      });
    });
    describe('use base price', () => {
      const priceOption = 'BASE';
      test('FIFO', () => {
        const received = createReport({
          transactions,
          prices,
          config: {
            localCurrency: 'USD',
            priceMethod: priceOption,
            costBasisMethod: 'FIFO',
            decimalPlaces: 2
          }
        });
        let expected = {
          report: taxReportFactory({
            2018: {
              assets: {
                BTC: {
                  holdings: '9',
                  bought: '10',
                  sold: '1'
                },
                USD: {
                  holdings: '-1000',
                  bought: '0',
                  sold: '1000'
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
                  transaction_id: '1'
                }
              ],
              short: [
                {
                  asset: 'BTC',
                  asset_amount: '1',
                  date_acquired: '2018-01-01T01:00:00Z',
                  date_sold: '2018-01-02T01:00:00Z',
                  proceeds: '4000',
                  cost_basis: '100'
                }
              ]
            }
          }),
          config: {
            cost_basis_method: 'FIFO',
            price_method: 'BASE'
          }
        };
        expect(received).toEqual(expected);
      });
    });
  });
});

describe('receive income', () => {
  test('single income txn is reported', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      }
    ];

    const transactions = [
      incomeFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        income_amount: '10',
        income_code: 'BTC',
        fee_amount: '1',
        fee_code: 'USD'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '10',
              bought: '10',
              sold: '0'
            },
            USD: {
              bought: '0',
              holdings: '-1',
              sold: '1'
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
              transaction_id: '1'
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
              tx_id: '1'
            }
          ],
          short: [],
          lost: [],
          interest_income: []
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('income and deposit txns reported', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-02T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      }
    ];

    const transactions = [
      incomeFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        income_amount: '10',
        income_code: 'BTC',
        fee_amount: '1',
        fee_code: 'USD'
      }),
      depositFactory({
        timestamp: '2018-01-02T01:00:00Z',
        tx_id: '2',
        deposit_amount: '10',
        deposit_code: 'BTC',
        fee_amount: '1',
        fee_code: 'USD'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '20',
              bought: '20',
              sold: '0'
            },
            USD: {
              bought: '0',
              holdings: '-2',
              sold: '2'
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
              transaction_id: '1'
            },
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '1',
              transaction_id: '2'
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
              tx_id: '1'
            }
          ],
          short: [],
          lost: [],
          interest_income: []
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('single income, short term gains on trade', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-02T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: '3',
        timestamp: '2018-01-03T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '11000'
      }
    ];

    const transactions = [
      incomeFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        income_amount: '10',
        income_code: 'BTC',
        fee_amount: '1',
        fee_code: 'USD'
      }),
      depositFactory({
        timestamp: '2018-01-02T01:00:00Z',
        tx_id: '2',
        deposit_amount: '10',
        deposit_code: 'BTC',
        fee_amount: '1',
        fee_code: 'USD'
      }),
      tradeFactory({
        timestamp: '2018-01-03T01:00:00Z',
        tx_id: '3',
        side: 'SELL',
        base_amount: '1',
        base_code: 'BTC',
        quote_amount: '11000',
        quote_code: 'USD',
        fee_amount: '1',
        fee_code: 'USD'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '19',
              bought: '20',
              sold: '1'
            },
            USD: {
              holdings: '10997',
              bought: '10999',
              sold: '2'
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
              transaction_id: '1'
            },
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-02T01:00:00Z',
              date_sold: '2018-01-02T01:00:00Z',
              proceeds: '1',
              transaction_id: '2'
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
              tx_id: '1'
            }
          ],
          short: [
            {
              asset: 'BTC',
              asset_amount: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-03T01:00:00Z',
              proceeds: '10999',
              cost_basis: '10000.1'
            }
          ],
          lost: [],
          interest_income: []
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
});

describe('lost crypto or fiat', () => {
  test('buy bitcoin, lose equal bitcoin amount', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-01T02:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      }
    ];
    const transactions = [
      tradeFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        side: 'BUY',
        base_amount: '1',
        base_code: 'BTC',
        quote_amount: '10000',
        quote_code: 'USD'
      }),
      lostFactory({
        timestamp: '2018-01-01T02:00:00Z',
        tx_id: '2',
        lost_amount: '1',
        lost_code: 'BTC'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '0',
              bought: '1',
              sold: '1'
            },
            USD: {
              bought: '0',
              holdings: '-10000',
              sold: '10000'
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
              transaction_id: '1'
            }
          ],
          lost: [
            {
              asset: 'BTC',
              asset_amount: '1',
              cost_basis: '10000',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T02:00:00Z',
              proceeds: '10000'
            }
          ]
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('buy bitcoin, lose more bitcoin than bought', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-01T02:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      }
    ];

    const transactions = [
      tradeFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        side: 'BUY',
        base_amount: '1',
        base_code: 'BTC',
        quote_amount: '10000',
        quote_code: 'USD'
      }),
      lostFactory({
        timestamp: '2018-01-01T02:00:00Z',
        tx_id: '2',
        lost_amount: '2',
        lost_code: 'BTC'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '-1',
              bought: '1',
              sold: '2'
            },
            USD: {
              bought: '0',
              holdings: '-10000',
              sold: '10000'
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
              transaction_id: '1'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-01T02:00:00Z',
              date_sold: '2018-01-01T02:00:00Z',
              proceeds: '10000',
              transaction_id: '2'
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
              proceeds: '10000'
            },
            {
              asset: 'BTC',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-01T02:00:00Z',
              date_sold: '2018-01-01T02:00:00Z',
              proceeds: '10000'
            }
          ],
          interest_income: []
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('buy bitcoin, lose fraction of that bitcoin', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T01:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      },
      {
        tx_id: '2',
        timestamp: '2018-01-01T02:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      }
    ];

    const transactions = [
      tradeFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        side: 'BUY',
        base_amount: '1',
        base_code: 'BTC',
        quote_amount: '10000',
        quote_code: 'USD'
      }),
      lostFactory({
        timestamp: '2018-01-01T02:00:00Z',
        tx_id: '2',
        lost_amount: '0.5',
        lost_code: 'BTC'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '0.5',
              bought: '1',
              sold: '0.5'
            },
            USD: {
              bought: '0',
              holdings: '-10000',
              sold: '10000'
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
              transaction_id: '1'
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
              proceeds: '5000'
            }
          ],
          interest_income: []
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('lose bitcoin unmatched', () => {
    const prices = [
      {
        tx_id: '1',
        timestamp: '2018-01-01T02:00:00Z',
        base_code: 'BTC',
        quote_code: 'USD',
        price: '10000'
      }
    ];

    const transactions = [
      lostFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        lost_amount: '1',
        lost_code: 'BTC'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            BTC: {
              holdings: '-1',
              bought: '0',
              sold: '1'
            }
          },
          unmatched: [
            {
              asset: 'BTC',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '10000',
              transaction_id: '1'
            }
          ],
          lost: [
            {
              asset: 'BTC',
              asset_amount: '1',
              cost_basis: '0',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T01:00:00Z',
              proceeds: '10000'
            }
          ]
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('deposit USD, lose equal USD amount', () => {
    const prices = [];

    const transactions = [
      depositFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        deposit_amount: '1',
        deposit_code: 'USD'
      }),
      lostFactory({
        timestamp: '2018-01-01T02:00:00Z',
        tx_id: '2',
        lost_amount: '1',
        lost_code: 'USD'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            USD: {
              bought: '1',
              holdings: '0',
              sold: '1'
            }
          },
          unmatched: [],
          long: [],
          income: [],
          short: [],
          lost: [
            {
              asset: 'USD',
              asset_amount: '1',
              cost_basis: '1',
              date_acquired: '2018-01-01T01:00:00Z',
              date_sold: '2018-01-01T02:00:00Z',
              proceeds: '1'
            }
          ],
          interest_income: []
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('deposit USD, lose fraction of that USD amount', () => {
    const prices = [];
    const transactions = [
      depositFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        deposit_amount: '1',
        deposit_code: 'USD'
      }),
      lostFactory({
        timestamp: '2018-01-01T02:00:00Z',
        tx_id: '2',
        lost_amount: '0.5',
        lost_code: 'USD'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            USD: {
              bought: '1',
              holdings: '0.5',
              sold: '0.5'
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
              proceeds: '0.5'
            }
          ],
          interest_income: []
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
  test('lose USD unmatched', () => {
    const prices = [];

    const transactions = [
      lostFactory({
        timestamp: '2018-01-01T01:00:00Z',
        tx_id: '1',
        lost_amount: '1',
        lost_code: 'USD'
      })
    ];
    const received = createReport({
      transactions,
      prices,
      config: {
        localCurrency: 'USD',
        priceMethod: 'BASE',
        costBasisMethod: 'FIFO',
        decimalPlaces: 2
      }
    });
    let expected = {
      report: taxReportFactory({
        2018: {
          assets: {
            USD: {
              holdings: '-1',
              bought: '0',
              sold: '1'
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
              transaction_id: '1'
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
              proceeds: '1'
            }
          ],
          interest_income: []
        }
      }),
      config: {
        cost_basis_method: 'FIFO',
        price_method: 'BASE'
      }
    };
    expect(received).toEqual(expected);
  });
});
