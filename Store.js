/**
 * Created by fisa on 8/20/15.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _findIndex2 = require('lodash/findIndex');

var _findIndex3 = _interopRequireDefault(_findIndex2);

var _pullAt2 = require('lodash/pullAt');

var _pullAt3 = _interopRequireDefault(_pullAt2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Private cache data storage
 * @type {Array}
 */
var _Data = [];

/**
 * Stores values according to specified key and owner
 * Whole class is static
 */
var Store = {
    /**
     * Public function which returns Value or Null
     * @param owner
     * @param key
     * @returns {*} | null
     */
    getValue: function getValue(owner, key) {
        var item = __get(owner, key);
        return item ? item.value : null;
    },


    /**
     * Adds new or update existing data, If update returns old Item
     * @param key
     * @param value
     * @param owner
     * @returns {*}
     */
    setValue: function setValue(owner, key, value) {
        var item = __get(owner, key),
            old = null;

        if (item === null) {
            old = new Item(owner, key, value);
            _Data.push(old);
        } else {
            old = new Item(item.owner, item.key, item.value);
            item.value = value;
        }
        return old.value;
    },


    /**
     * Finds all data stored by this owner
     * @param owner
     * @returns {Array.<Item>} | null
     */
    getAll: function getAll(owner) {
        var data = _Data.filter(function (item) {
            return owner === item.owner;
        });
        return data.length === 0 ? null : data;
    },


    /**
     * Remove stored value from Storage if owner and key exists
     * @param owner
     * @param key
     * @returns {*} | null
     */
    remove: function remove(owner, key) {
        var index = (0, _findIndex3.default)(_Data, function (item) {
            return item.key === key && item.owner === owner;
        });
        return index ? (0, _pullAt3.default)(_Data, index).value : null;
    }
};

/**
 * Wrapper for data stored in collection
 * @param key
 * @param value
 * @param owner
 */

var Item = function Item(owner, key, value) {
    _classCallCheck(this, Item);

    this.key = key;
    this.value = value;
    this.owner = owner;
};

/**
 * Export class representing data stored in Store
 * @type {Item}
 */


Store.Item = Item;

/**
 * Export private data property for texting purposes
 * @type {Array}
 * @private
 */
Store._data = _Data;

/**
 * Look for specified data by owner and key
 * @param key
 * @param owner
 * @returns {Item} | null
 * @private
 */
function __get(owner, key) {
    var length = _Data.length;
    for (var i = 0; i < length; i++) {
        if (owner === _Data[i].owner && key === _Data[i].key) {
            return _Data[i];
        }
    }
    return null;
}

exports.default = Store;