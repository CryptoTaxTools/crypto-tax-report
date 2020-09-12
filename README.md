# Crypto Tax Report

A javascript library for creating configurable tax reports. Supports generic transaction types as well as specific protocol support (such as Compound Finance).

*Note: This library is currently in alpha and subject to breaking changes. Please install with a pin to a version tag or commit.*

## Installation

```
npm install git://github.com/CryptoTaxTools/crypto-tax-report.git#v0.0.2
```

## Use

Here is an example of importing and using the library:

```js
import createReport from 'crypto-tax-report';

const report = createReport({
  transactions: [
    {
      tx_id: '1',
      tx_type: 'DEPOSIT',
      timestamp: '2020-09-09T01:00:00Z',
      deposit_code: 'USD',
      deposit_amount: '99'
    },
    {
      tx_id: '2',
      tx_type: 'TRADE',
      timestamp: '2020-09-10T01:00:00Z',
      side: 'BUY',
      base_code: 'BTC',
      base_amount: '1',
      quote_code: 'USD',
      quote_amount: '100'
    },
    {
      tx_id: '3',
      tx_type: 'TRADE',
      timestamp: '2020-09-11T01:00:00Z',
      side: 'BUY',
      base_code: 'USD',
      base_amount: '200',
      quote_code: 'BTC',
      quote_amount: '1'
    }
  ],
  prices: [
    {
      tx_id: '2',
      timestamp: '2020-09-10T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '100'
    },
    {
      tx_id: '3',
      timestamp: '2020-09-11T01:00:00Z',
      base_code: 'BTC',
      quote_code: 'USD',
      price: '200'
    }
  ],
  config: {
    localCurrency: 'USD',
    priceMethod: 'BASE',
    costBasisMethod: 'FIFO',
    decimalPlaces: 2
  }
});

// Example report output
{
  "report": {
    "2020": {
      "income": [],
      "long": [],
      "short": [
        {
          "asset": "BTC",
          "proceeds": "200",
          "date_sold": "2020-09-11T01:00:00Z",
          "cost_basis": "100",
          "asset_amount": "1",
          "date_acquired": "2020-09-10T01:00:00Z"
        }
      ],
      "unmatched": [
        {
          "asset": "USD",
          "proceeds": "1",
          "date_sold": "2020-09-10T01:00:00Z",
          "cost_basis": "0",
          "asset_amount": "1",
          "date_acquired": "2020-09-10T01:00:00Z",
          "transaction_id": "2"
        }
      ],
      "lost": [],
      "interest_income": [],
      "assets": {
        "USD": {
          "bought": "299",
          "sold": "100",
          "holdings": "199"
        },
        "BTC": {
          "bought": "1",
          "sold": "1",
          "holdings": "0"
        }
      }
    }
  },
  "config": {
    "price_method": "BASE",
    "cost_basis_method": "FIFO"
  }
}

```
