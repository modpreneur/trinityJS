'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * Created by fisa on 8/20/15.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Dom = require('./utils/Dom.js');

var _Dom2 = _interopRequireDefault(_Dom);

var _closureEvents = require('./utils/closureEvents.js');

var _closureEvents2 = _interopRequireDefault(_closureEvents);

var _Store = require('./Store.js');

var _Store2 = _interopRequireDefault(_Store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Default settings of Collection Object
 * @type {{addButton: string, deleteButton: string, onAdd: null, onDelete: null, name: string}}
 */
var defaultSettings = {
    addButton: '<div class="collection-add display-inline-block">\n            <div class="span-medium-8 span-large-6 span-xlarge-10"></div>\n            <div class="display-inline-block">\n                <a href="#" id="addButton" class="add-collection-item button button-info button-medium button-circle">\n                    <i class="tiecons tiecons-plus-radius-large"></i>\n                </a>\n            </div>\n        </div>',
    deleteButton: '<a title="Remove item" href="#" id="deleteButton" class="delete-collection-item">\n            <span class="trinity trinity-trash circle"></span>\n        </a>',
    onAdd: null,
    onDelete: null,
    label: false,
    addFirst: true,
    name: '[Element Name]'
};

/**
 * TODO: Test it
 * Collection class, handles one layer of Collection form
 * @param element {HTMLElement}
 * @param [globalOptions] {Object}
 * @param [prototypeData] {PrototypeData}
 * @param [layer] {number}
 * @constructor
 */

var Collection = (function () {
    function Collection(element, globalOptions, prototypeData, layer) {
        _classCallCheck(this, Collection);

        this.collectionHolder = element;
        this.prototype = null;
        this.protoChildren = [];
        this.children = [];
        this.globalOptions = globalOptions;
        this.layer = layer || 0;

        if (!prototypeData) {
            prototypeData = _parsePrototypeData(element);
            _Store2.default.setValue(element, 'collection', this);
        }
        this.settings = _lodash2.default.extend(_lodash2.default.clone(defaultSettings), globalOptions ? _lodash2.default.extend(prototypeData.options, globalOptions) : prototypeData.options);
        this.settings.addButton = _Dom2.default.htmlToDocumentFragment(this.settings.addButton.trim());
        this.settings.deleteButton = _Dom2.default.htmlToDocumentFragment(this.settings.deleteButton.trim());
        /** Make it live **/
        _initialize.call(this, prototypeData);
    }

    /**
     * Adds new child to collection
     */

    _createClass(Collection, [{
        key: 'add',
        value: function add() {
            var settings = this.settings,
                addButton = settings.addButton,
                prototype = this.prototype,
                prototypeChildren = this.protoChildren;

            var childrenCount = _lodash2.default.filter(this.collectionHolder.children, function (node) {
                return _Dom2.default.classlist.contains(node, 'collection-child');
            });

            var newChildStr = _fillPlaceholders(settings['prototype_name'], settings.name, childrenCount.length, prototype);
            var newChildNode = _Dom2.default.htmlToDocumentFragment(newChildStr.trim());
            var child = new CollectionChild(newChildNode, childrenCount.length, this, prototypeChildren);
            this.children.push(child);
            _addRemoveBtn.call(this, child);

            //Insert new Child
            addButton.parentNode.insertBefore(newChildNode, addButton);

            if (_lodash2.default.isFunction(settings.onAdd)) {
                settings.onAdd(newChildNode);
            }
        }
    }]);

    return Collection;
})();

/**
 * Initialize Collection object
 * @param data {PrototypeData}
 * @private
 */

exports.default = Collection;
function _initialize(data) {
    // init
    var prototypeDom = _Dom2.default.htmlToDocumentFragment(data.prototype);
    var protoChildren = _lodash2.default.map(prototypeDom.querySelectorAll('[data-prototype]'), function (node) {
        return _parsePrototypeData(node);
    });

    this.prototype = _getHtmlString(prototypeDom);
    this.protoChildren = protoChildren;
    _addCreateBtn.call(this);

    // Add class and delete button to children
    var children = _lodash2.default.filter(this.collectionHolder.children, function (node) {
        return _Dom2.default.classlist.contains(node, 'row');
    });
    this.children = _lodash2.default.each(children, function (child, index, coll) {
        var newChild = new CollectionChild(child, index, this);
        _addRemoveBtn.call(this, newChild);
        coll[index] = newChild;
    }, this);
    //Add first?
    if (children.length === 0 && this.settings.addFirst) {
        this.add();
    }
}

/**
 * Parse prototype data from element and remove [data-prototype] and [data-options] values
 * [data-prototype] value is set to "prototype_name" of parsed element, found in options
 * @param element
 * @returns {PrototypeData}
 * @private
 */
function _parsePrototypeData(element) {
    var data = new PrototypeData(element.getAttribute('data-prototype'), JSON.parse(element.getAttribute('data-options')));
    //clean up
    element.removeAttribute('data-options');
    element.setAttribute('data-prototype', data.options['prototype_name']);
    return data;
}

/**
 * Add remove button to element
 * @param child {CollectionChild}
 * @private
 */
function _addRemoveBtn(child) {
    var settings = this.settings,
        removeButton = settings.deleteButton.cloneNode(true);

    // right ID to delete button
    removeButton.setAttribute('id', [removeButton.getAttribute('id'), '_', child.node.getAttribute('id')].join(''));

    _closureEvents2.default.listenOnce(removeButton, 'click', (function (e) {
        // prevent the link from creating a "#" on the URL
        e.preventDefault();

        if (_lodash2.default.isFunction(settings.onDelete)) {
            settings.onDelete(child.node);
        }
        var id = child.id;
        // remove collection child
        child.remove();
        // Update all other children
        this.children = _lodash2.default.filter(this.children, function (item) {
            if (item.id > id) {
                item.setID(item.id - 1);
                return true;
            }
            return !(item.id === id);
        });
    }).bind(this));

    //Append child to right
    child.node.querySelector('.form-right').appendChild(removeButton);
}

/**
 * Add Add button to collection
 * @private
 */
function _addCreateBtn() {
    var settings = this.settings;
    _closureEvents2.default.listen(settings.addButton, 'click', (function (e) {
        e.preventDefault();
        // add a new tag form (see next code block)
        this.add();
    }).bind(this));
    //append add button
    this.collectionHolder.appendChild(settings.addButton);
}

/**
 * Fills placeholders in prototype string
 * @param key {string}
 * @param name {string}
 * @param number {Number}
 * @param prototype {string}
 * @returns {XML|string}
 * @private
 */
function _fillPlaceholders(key, name, number, prototype) {
    var labelRegx = new RegExp(key + 'label__', 'g'),
        nameRegx = new RegExp(key, 'g');
    return prototype.replace(labelRegx, name + number).replace(nameRegx, '' + number);
}

/**
 * Return HTML string representation of HTML Element object
 * @param element {HTMLElement}
 * @returns {string}
 * @private
 */
function _getHtmlString(element) {
    var wrap = document.createElement('div');
    wrap.appendChild(element);
    return wrap.innerHTML;
}

/**
 * Remove label of node
 * @param node {HTMLElement}
 * @private
 */
function _removeLabel(node) {
    _Dom2.default.removeNode(node.querySelector('.form-left'));
    var formRight = node.querySelector('.form-right');
    _Dom2.default.classlist.removeAll(formRight, ['span-none-padding-medium-16', 'span-none-padding-large-18', 'span-none-padding-xlarge-14']);
    _Dom2.default.classlist.addAll(formRight, ['span-none-padding-medium-24', 'span-none-padding-large-24', 'span-none-padding-xlarge-24']);
}

/**
 * Simple class which keeps basic prototype data
 * @class PrototypeData
 * @param proto {string}
 * @param options {Object}
 * @constructor
 */

var PrototypeData = function PrototypeData(proto, options) {
    _classCallCheck(this, PrototypeData);

    this.prototype = proto;
    this.options = options;
};

/**
 * Class representing child of collection
 * @class CollectionChild
 * @param node {HTMLElement}
 * @param id {string}
 * @param parent {Collection}
 * @param [prototypeData] {Array}
 * @constructor
 */

var CollectionChild = (function () {
    function CollectionChild(node, id, parent, prototypeData) {
        _classCallCheck(this, CollectionChild);

        this.id = id;
        this.node = node;
        this.parent = parent;

        _Dom2.default.classlist.add(node, 'collection-child');
        //Label?
        if (parent.settings.label === false) {
            _removeLabel(node);
        }

        var prototypeElements = node.querySelectorAll('[data-prototype]');
        if (prototypeElements.length > 0) {
            this.collections = _initializeCollections.call(this, prototypeElements, prototypeData);
        }
    }

    /**
     * Safety remove of child
     */

    _createClass(CollectionChild, [{
        key: 'remove',
        value: function remove() {
            _Dom2.default.removeNode(this.node);
        }

        /**
         * Set ID of child and update all elements descendant
         * @param id
         */

    }, {
        key: 'setID',
        value: function setID(id) {
            var layer = this.parent.layer;
            this.id = id;
            // ID
            _lodash2.default.map(this.node.querySelectorAll('[id]'), function (el) {
                _updateAttribute(el, id, layer, 'id');
            }, this);
            // NAME
            _lodash2.default.map(this.node.querySelectorAll('[name]'), function (el) {
                _updateAttribute(el, id, layer, 'name');
            }, this);
            // LABEL
            _lodash2.default.map(this.node.querySelectorAll('label[for]'), function (el) {
                _updateAttribute(el, id, layer, 'for');
            }, this);
            // change to self
            _updateAttribute(this.node, id, layer, 'id');
        }
    }]);

    return CollectionChild;
})();

/**
 * Initialize new collections of child
 * @param prototypeElements {HTMLCollection | Array}
 * @param prototypeDataSource {Array}
 * @returns {*|Array}
 * @private
 */

function _initializeCollections(prototypeElements, prototypeDataSource) {
    if (!prototypeDataSource) {
        return _lodash2.default.map(prototypeElements, function (el) {
            return _Store2.default.getValue(el, 'collection');
        });
    } else {
        // Init next level
        return _lodash2.default.map(prototypeElements, function (el) {
            var prototypeName = el.getAttribute('data-prototype');
            var prototypeData = _lodash2.default.cloneDeep(_lodash2.default.find(prototypeDataSource, function (data) {
                return data.options['prototype_name'] === prototypeName;
            }));
            prototypeData.prototype = _fillPlaceholders(this.parent.settings['prototype_name'], this.parent.settings.name, this.id, prototypeData.prototype);
            return new Collection(el, this.parent.globalOptions, prototypeData, this.parent.layer + 1);
        }, this);
    }
}

/**
 * Change identifier on particular level of selected attribute
 * @param node {HTMLElement}
 * @param id {string}
 * @param layer {Number}
 * @param attribute {string}
 * @private
 */
function _updateAttribute(node, id, layer, attribute) {
    var isName = attribute === 'name';
    var regex = isName ? /\[\d]/g : /_\d_|_\d$/g;
    var parameterStr = node.getAttribute(attribute);
    var resultStr = '';

    var i = 0;
    var rgxResult = null;
    var next = true;

    while (next) {
        rgxResult = regex.exec(parameterStr);
        if (i === layer) {
            resultStr += parameterStr.substring(0, rgxResult.index + 1);
            resultStr += id;

            if (!isName && parameterStr.length === rgxResult.index + rgxResult[0].length) {
                break;
            }
            // Add trailing
            resultStr += isName ? ']' : '_';
            //Add end of string
            resultStr += parameterStr.substring(rgxResult.index + rgxResult[0].length);
            next = false;
            break;
        }
        i++;
    }
    //Set new ID
    node.setAttribute(attribute, resultStr);
}