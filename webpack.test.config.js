const path = require('path');

module.exports = {
  resolve: {
    extensions: ['.ts', '.js']
  },
  entry: './spec/main.spec.ts',
  output: {
    path: path.join(process.cwd(), 'dist'),
    publicPath: 'dist/',
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          'ts-loader'
        ]
      }
    ]
  }
};