import { EmptyParamError, InvalidParamError } from './errors';
import { TaxReportOptions } from './types';

export const validateOptions = (options: TaxReportOptions): void => {
  const {
    prices,
    transactions,
    config: {
      localCurrency = 'USD',
      priceMethod = 'BASE',
      costBasisMethod = 'FIFO',
      decimalPlaces = 2
    } = {}
  } = options;
  // Assert params are not null or undefined.
  const toValidate = { prices, transactions, ...options.config };
  Object.entries(toValidate).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      throw new InvalidParamError(`"${key}" must not be null or undefined.`);
    }
  });
  // Assert types
  if (!Array.isArray(transactions)) {
    throw new InvalidParamError('"transactions" must be an array.');
  }
  if (!Array.isArray(prices)) {
    throw new InvalidParamError('"prices" must be an array.');
  }
  if (typeof localCurrency !== 'string') {
    throw new InvalidParamError('"localCurrency" must be a string.');
  }
  if (typeof priceMethod !== 'string') {
    throw new InvalidParamError('"priceMethod" must be a string.');
  }
  if (typeof costBasisMethod !== 'string') {
    throw new InvalidParamError('"costBasisMethod" must be a string.');
  }
  if (typeof decimalPlaces !== 'number') {
    throw new InvalidParamError('"decimalPlaces" must be a number.');
  }
  // Assert length
  if (transactions.length === 0) {
    throw new EmptyParamError(
      'The "transactions" config parameter must include at least one object.'
    );
  }
};
