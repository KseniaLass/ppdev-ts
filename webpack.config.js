const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const devMode = process.env.NODE_ENV !== "production";

module.exports = {
    entry: './src/ts/index.ts',
    mode: process.env.NODE_ENV,
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(css|scss)$/i,
                use: [
                  {
                    loader: MiniCssExtractPlugin.loader,
                    // options: {
                    //   hmr: devMode,
                    // },
                  },
                  {
                    loader: "css-loader",
                    options: {
                      sourceMap: true,
                      importLoaders: 2,
                    },
                  },
                  {
                    loader: "postcss-loader",
                    options: {
                      sourceMap: true,
                    },
                  },
                  {
                    loader: "sass-loader",
                    options: { sourceMap: true },
                  },
                ],
              }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'PPDEV', 
            template: 'src/index.html'
        }),
        new MiniCssExtractPlugin({
            filename: devMode ? "[name].css" : "[name].[hash].css",
            chunkFilename: devMode ? "[id].css" : "[id].[hash].css",
        }),
        new CopyPlugin({
            patterns: [
                { from: "src/img", to: "img" }
            ]
        })
    ],
    optimization: {
        minimizer: [
          new CssMinimizerPlugin()
        ],
    },
    devServer: {
        static: path.join(__dirname, "dist"),
        compress: true,
        hot: true,
        port: 4000,
    },
};