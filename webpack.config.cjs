const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports = {
	mode: "production",
	entry: {
		background: "/src/ts/background.ts",
		popup: "/src/ts/popup.ts",
		content: "/src/ts/content.ts",
		"fetch-override": "/src/ts/fetch-override.ts",
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
	optimization: {
		minimizer: [new CssMinimizerPlugin(), new TerserPlugin()],
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
