class EmptyParamError extends Error {}

Object.defineProperty(EmptyParamError.prototype, 'name', {
  value: 'EmptyParamError'
});

class InvalidParamError extends Error {}

Object.defineProperty(InvalidParamError.prototype, 'name', {
  value: 'InvalidParamError'
});

export { EmptyParamError, InvalidParamError };
