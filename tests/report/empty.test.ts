import createReport from '../../src/index';

test('Empty transactions', () => {
  try {
    createReport({
      transactions: [],
      prices: [],
      config: {
        local_currency: 'USD',
        price_method: 'BASE',
        cost_basis_method: 'FIFO',
        decimal_places: 2
      }
    });
  } catch (error) {
    expect(error.name).toEqual('EmptyParamError');
    expect(error.message).toEqual(
      'The "transactions" config parameter must include at least one object.'
    );
  }
});
