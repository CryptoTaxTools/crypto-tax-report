const base = require('./jest.config.js');

base.moduleNameMapper = {
  '/src/index$': '<rootDir>/lib/index',
};

module.exports = base;
