'use strict';
let path = require('path');

module.exports = {
    entry: './web/main.jsx',
    output: {
        path: path.join(__dirname, './app/public'),
        filename: 'webpack.bundle.js'
    },
    devtool: 'source-map',
    module: {
        loaders: [
            { test: /\.css$/, loader: 'style!css!'},
            { test: /\.less$/, loader: 'style!css!less!'},
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
        root: path.join(__dirname, "./node_modules")
    }
};