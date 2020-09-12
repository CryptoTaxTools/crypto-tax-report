# Crypto Tax Report

A javascript library for creating configurable tax reports. Supports generic transaction types as well as specific protocol support (such as Compound Finance).

*Note: This library is currently in alpha and subject to breaking changes. Please install with a pin to a version tag or commit.*

## Installation

```
npm install git://github.com/CryptoTaxTools/crypto-tax-report.git#commit
```

## Use

```js
import createReport from 'crypto-tax-report';

const report = createReport({
  transactions: [],
  prices: [],
  config: {
    localCurrency: 'USD',
    priceMethod: 'BASE',
    costBasisMethod: 'FIFO',
    decimalPlaces: 2
  },
});
```
