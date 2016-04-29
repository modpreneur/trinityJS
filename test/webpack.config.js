'use strict';

let path = require('path');

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

console.log(process.env.NODE_ENV);

let config = null;

switch (process.env.NODE_ENV){
    case 'dev':{
        config = require(path.join(__dirname, './env/dev.config.js'))
    } break;
    default: {
        config = require(path.join(__dirname, './env/dev.config.js'))
    } break;
}

module.exports = config;