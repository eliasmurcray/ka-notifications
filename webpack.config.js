const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

module.exports = {
  mode: "production",
  entry: {
    "content": "/src/ts/content.ts",
    "background": "/src/ts/background.ts",
    "popup": "/src/ts/popup.ts"
  },
  externals: {
    "/src/notification.d.ts": true
  },
  experiments: {
    topLevelAwait: true
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader"
        ],
      },
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ],
  },
  output: {
    publicPath: "",
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[contenthash].js",
    clean: true
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
    }),
    new WebpackManifestPlugin({
      fileName: "manifest.json",
      basePath: ""
    })
  ]
};