const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    background: "/src/ts/background.ts",
    popup: "/src/ts/popup.ts",
  },
  resolve: {
    extensions: [".ts"],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    publicPath: "",
    path: path.resolve(__dirname, "chrome"),
    filename: "[name].js",
    clean: true,
    iife: false,
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/images",
          to: "",
        },
        {
          from: "src/manifest.json",
          to: "",
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: "./src/html/popup.html",
      filename: "popup.html",
      chunks: ["popup"],
    }),
  ],
};
