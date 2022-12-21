const path = require("path");
// const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

//       new HtmlWebpackPlugin({
//         template: `./src/html/${name}.html`,
//         filename: name + ".html",
//         chunks: [name],
//         scriptLoading: "module"
//       });

module.exports = {
  mode: "development",
  entry: {
    "index": "/src/js/index.js",
    "background": "/src/js/background.js"
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css"
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/images",
          to: ""
        },
        {
          from: "src/LICENSE",
          to: ""
        }
      ]
    }),
    new WebpackManifestPlugin({
      fileName: "manifest.json",
      basePath: ""
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ],
      }
    ],
  },
  output: {
    publicPath: "",
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    clean: true
  }
};