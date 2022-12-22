const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

module.exports = {
  mode: "production",
  entry: {
    "content": "/src/js/content.js",
    "background": "/src/js/background.js",
    "popup": "/src/js/popup.js"
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
    new HtmlWebpackPlugin({
      template: "./src/html/popup.html",
      filename: "popup.html",
      chunks: ["popup"]
      // scriptLoading: "module"
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
  experiments: {
    topLevelAwait: true
  },
  output: {
    publicPath: "",
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    clean: true
  }
};