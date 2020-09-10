/*
 * Test that the compiled bundle exports a function
 * instead of an object with a "default" property.
 */

// eslint-disable-next-line import/no-unresolved
const bundle = require('../lib/index.js');

test('commonjs bundle exports function', () => {
  expect(typeof bundle).toEqual('function');
});
