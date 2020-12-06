import { BigNumber } from 'bignumber.js';

// setup main method
export function bigNumberToString(obj, base, places = 2) {
  // setup base
  base = base || 10;

  // check if obj is type object, not an array and does not have BN properties
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj) && !('lessThan' in obj)) {
    // move through plain object
    Object.keys(obj).forEach(function(key) {
      // recursively convert item
      obj[key] = bigNumberToString(
        obj[key],
        base,
        ['increase', 'decrease', 'holdings', 'asset_amount'].includes(key) ? 18 : places
      );
    });
  }

  // obj is an array
  if (Array.isArray(obj)) {
    // convert items in array
    obj = obj.map(function(item) {
      // convert item to a string if bignumber
      return bigNumberToString(item, base, places);
    });
  }

  // if not an object bypass
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // if the object to does not have BigNumber properties, bypass
  if (!BigNumber.isBigNumber(obj)) {
    return obj;
  }

  // if object has bignumber properties, convert to string with base
  return obj.dp(places).toString(base);
}
