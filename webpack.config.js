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
        },
        {
          from: "src/html",
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