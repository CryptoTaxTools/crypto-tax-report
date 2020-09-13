# Crypto Tax Report

A javascript library for creating configurable tax reports. Supports generic transaction types as well as specific protocol support (such as Compound Finance).

*Note: This library is currently in alpha and subject to breaking changes. Please install with a pin to a version tag or commit.*

## Installation

```
npm install git://github.com/CryptoTaxTools/crypto-tax-report.git#v0.0.2
```

## Example Use

Here is an example of importing and using the library. If you'd like more examples of using the library, please reference the [tests](https://github.com/CryptoTaxTools/crypto-tax-report/tree/master/tests).

```js
import createReport from 'crypto-tax-report';

const report = createReport({
  config: {
    localCurrency: 'USD',
    priceMethod: 'BASE',
    costBasisMethod: 'FIFO',
    decimalPlaces: 2
  },
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
  ]
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

## Input Specs

The `createReport` function accepts a single object as it's first and only parameter. This object has three properties: `config`, `transactions`, and `prices`.

Report Input Property | Required | Data Type
------------ | ------------- | -------------
config | Yes | Object
transactions | Yes | Array
prices | Yes | Array 

### Config

The `config` object sets the local currency to use for asset prices, the price method, the accounting method, and the number of decimal places to use for report outputs.

Config Property | Default Value | Allowed Value  | Required      | Data Type
------------    | ------------- | --------------- | ------------- | -------------
localCurrency   | `'USD'`       | Any String      | No            | String 
priceMethod     | `'BASE'`      | `'BASE'`, `'QUOTE'` | No            | String
costBasisMethod | `'FIFO'`      | `'FIFO'`, `'HIFO'`, `'LIFO'` | No     | String 
decimalPlaces   | `2`           | Any Number      | No            | Number


**localCurrency**: A local currency must be specified in order to determine which price record to use. For example, if your trade is between BTC and LTC, and you specify GBP as your local currency, then the report code will look for price records that include GBP as the quote code.

**priceMethod**: The price method determines which code in a transaction to use for determining cost basis. For a trade between BTC and LTC where BTC is the base and LTC is the quote, if the price method is `BASE`, the tax code will use a BTC price record for determining the cost basis for the resulting tax lot from the trade.

**costBasisMethod**: Your options for cost basis accounting are FIFO (first-in, first-out), LIFO (last-in, first-out), and HIFO (highest-in, first-out).

**decimalPlaces**: The number of decimals places to use for figures in report output.


### Transactions

Transactions are an array of objects. At least 1 transaction is required, otherwise an exception is thrown. Please reference `types.ts` for a full list of transaction types. There are generic types, which apply to any protocol, and there are protocol-specific transaction types, like the ones modeled after Compound Finance activity.

#### Specific Protocol Transaction Types

* [Compound Finance Transaction Docs](https://github.com/CryptoTaxTools/crypto-tax-report/blob/master/docs/compound.md)

#### Generic Transaction Types

##### Trade

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'TRADE'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
side | String | `BUY`, `SELL`, `NONE` | Yes
base_code | String | Any String | Yes
base_amount | String | Any String | Yes
quote_code | String | Any String | Yes
quote_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

##### Deposit

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'DEPOSIT'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
deposit_code | String | Any String | Yes
deposit_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

##### Withdrawal

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'WITHDRAWAL'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
withdrawal_code | String | Any String | Yes
withdrawal_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

##### Income

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'INCOME'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
income_code | String | Any String | Yes
income_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

##### Lost

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'LOST'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
lost_code | String | Any String | Yes
lost_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

### Prices

Prices are required for transactions that use any asset other than the localCurrency. Please reference `types.ts` for the Price object type definition.

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
timestamp | String | ISO 8601 DateTime String | Yes
base_code | String | Any String | Yes
quote_code | String | Any String | Yes
price | String | Any String | Yes
