/**
 * Created by fisa on 8/20/15.
 */
'use strict';

import _findIndex from 'lodash/findIndex';
import _pullAt from 'lodash/pullAt';

/**
 * Private cache data storage
 * @type {Array}
 */
let _Data = [];

/**
 * Stores values according to specified key and owner
 * Whole class is static
 */
const Store = {
    /**
     * Public function which returns Value or Null
     * @param owner
     * @param key
     * @returns {*} | null
     */
    getValue(owner, key){
        let item = __get(owner, key);
        return item ? item.value : null;
    },

    /**
     * Adds new or update existing data, If update returns old Item
     * @param key
     * @param value
     * @param owner
     * @returns {*}
     */
    setValue(owner, key, value){
        let item = __get(owner, key),
            old = null;

        if(item === null){
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
    getAll(owner){
        let data = _Data.filter(function(item) {
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
    remove(owner, key){
        let index = _findIndex(_Data, function(item){
            return item.key === key && item.owner === owner;
        });
        return index ? _pullAt(_Data, index).value : null;
    }
};


/**
 * Wrapper for data stored in collection
 * @param key
 * @param value
 * @param owner
 */
class Item {
    constructor(owner, key, value) {
        this.key = key;
        this.value = value;
        this.owner = owner;
    }
}

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
function __get(owner, key){
    let length = _Data.length;
    for(let i = 0; i < length; i++){
        if(owner === _Data[i].owner && key === _Data[i].key){
            return _Data[i];
        }
    }
    return null;
}

export default Store;




