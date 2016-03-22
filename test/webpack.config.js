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
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                loader: 'babel',
                query: {
                    presets: ['react', 'es2015']
                }
            }
        ]
    }
};