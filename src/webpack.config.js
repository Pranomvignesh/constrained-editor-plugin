//ignorei18n_start
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const SRC_PATH = '../src';
const ESM_FOLDER_PATH = '../dist/esm';
module.exports = [{
  mode: 'none',
  target: 'web',
  devtool: "source-map",
  entry: {
    'restrictor': path.join(__dirname, SRC_PATH, 'index.js'),
  },
  output: {
    filename: process.env.MODE === 'production' ? '[name].min.js' : '[name].js',
    library: {
      name : 'restrictor',
      type : 'window',
      export : 'default'
    },
  }
}, {
  entry: {},
  mode: "none",
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.join(__dirname, SRC_PATH),
          globOptions: {
            ignore: ["webpack.config.js"].map(filePath => path.join(__dirname, SRC_PATH, filePath)),
          },
          to: path.join(__dirname, ESM_FOLDER_PATH)
        }
      ]
    })
  ]
}];
//ignorei18n_end