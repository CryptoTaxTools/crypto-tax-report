var path = require('path');
var nodeExternals = require('webpack-node-externals');
var babelConfig = require('./babel.config.js');

var config = {
  mode: 'production',
  entry: './src/index.ts',
  target: 'node',
  output: {
    filename: 'index.js',
    library: 'crypto-tax-report',
    libraryTarget: 'commonjs2',
    libraryExport: 'default',
    path: path.join(__dirname, 'lib'),
  },
  externals: [nodeExternals()],
  resolve: {
    extensions: ['.ts', '.mjs', '.js', '.json']
  },
  optimization: {
    minimize: false,
  },
  module: {
    rules: [
      {
        test: /\.(ts|js)x?$/,
        include: __dirname,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelConfig,
        },
      },
    ],
  },
  node: {
    __filename: false,
    __dirname: false,
  },
};

module.exports = config;
