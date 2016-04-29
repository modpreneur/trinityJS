'use strict';

let path = require('path');
let webpack = require('webpack');
let ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: ['./web/main.jsx', './web/testLess.less'],
    output: {
        path: path.join(__dirname, './app/public'),
        filename: 'app.bundle.js'
    },
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.less$/,
                loader: 'style-loader!css-loader!less-loader'
            },
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                loader: 'babel',
                query: {
                    presets: [
                        require.resolve('babel-preset-react'),
                        require.resolve('babel-preset-es2015')
                    ]
                }
            }
        ]
    },
    resolveLoader: {
        root: path.join(__dirname, "../node_modules")
    },
    externals: {
        lodash: '_'
    }
};