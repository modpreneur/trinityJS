'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodashEs = require('lodash-es');

var lodash = {
    each: _lodashEs.each,
    map: _lodashEs.map,
    defaultsDeep: _lodashEs.defaultsDeep,
    extend: _lodashEs.extend,
    find: _lodashEs.find,
    isEmpty: _lodashEs.isEmpty,
    isNull: _lodashEs.isNull,
    isUndefined: _lodashEs.isUndefined,
    isArray: _lodashEs.isArray,
    isString: _lodashEs.isString,
    filter: _lodashEs.filter,
    includes: _lodashEs.includes,
    pullAt: _lodashEs.pullAt,
    noop: _lodashEs.noop,
    isFunction: _lodashEs.isFunction,
    some: _lodashEs.some,
    remove: _lodashEs.remove,
    cloneDeep: _lodashEs.cloneDeep
};

lodash.default = lodash;
exports.default = lodash;

// (_\.)(?!|isString|contains|filter|includes|pullAt|noop|isFunction|some|remove|cloneDeep)