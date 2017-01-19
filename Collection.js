/**
 * Created by fisa on 8/20/15.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('./utils/lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Dom = require('./utils/Dom');

var _Dom2 = _interopRequireDefault(_Dom);

var _Events = require('./utils/Events');

var _Events2 = _interopRequireDefault(_Events);

var _Store = require('./Store');

var _Store2 = _interopRequireDefault(_Store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Default settings of Collection Object
 * @type {{addButton: string, deleteButton: string, onAdd: null, onDelete: null, name: string}}
 */
var defaultSettings = {
    addButton: '       <div class="collection-add display-inline-block">\n                <div class="span-medium-8 span-large-6 span-xlarge-10"></div>\n                <div class="display-inline-block">\n                    <a href="#" id="addButton" class="add-collection-item">\n                        <i class="tiecons tiecons-plus-radius-large"></i>\n                    </a>\n                </div>\n            </div>',
    deleteButton: '       <a title="Remove item" href="#" id="deleteButton" class="delete-collection-item">\n                <span class="trinity trinity-trash circle"></span>\n            </a>',
    onAdd: null,
    onDelete: null,
    label: false,
    addFirst: true,
    name: '[Element Name]'
};

/**
 * Collection class, handles one layer of Collection form
 * @param element {HTMLElement}
 * @param [globalOptions] {Object}
 * @param [prototypeData] {PrototypeData}
 * @param [layer] {number}
 * @constructor
 */

var Collection = function () {
    function Collection(element) {
        var globalOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var prototypeData = arguments[2];
        var layer = arguments[3];

        _classCallCheck(this, Collection);

        this.collectionHolder = element;
        this.prototype = null;
        this.protoChildren = [];
        this.children = [];
        this.globalOptions = globalOptions;
        this.layer = layer || 0;
        // Listeners
        this.unlistenAddButton = null;

        if (!prototypeData) {
            prototypeData = __parsePrototypeData(element);
            _Store2.default.setValue(element, 'collection', this);
        }
        this.settings = _lodash2.default.defaultsDeep({}, globalOptions, prototypeData.options, defaultSettings);
        //this.settings = _.extend(_.clone(defaultSettings), (globalOptions ? _.extend(prototypeData.options, globalOptions) : prototypeData.options));
        this.settings.addButton = _Dom2.default.htmlToDocumentFragment(this.settings.addButton.trim());
        this.settings.deleteButton = _Dom2.default.htmlToDocumentFragment(this.settings.deleteButton.trim());

        /** Make it live **/
        __initialize.call(this, prototypeData);
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
                prototypeChildren = this.protoChildren,

            // children count?
            childrenCount = _lodash2.default.filter(this.collectionHolder.children, function (node) {
                return _Dom2.default.classlist.contains(node, 'collection-child');
            }),

            // Placeholders
            newChildStr = __fillPlaceholders(settings['prototype_name'], settings.name, childrenCount.length, prototype);

            var newChildNode = _Dom2.default.htmlToDocumentFragment(newChildStr.trim()),
                child = new CollectionChild(newChildNode, childrenCount.length, this, prototypeChildren);

            this.children.push(child);
            __addRemoveBtn.call(this, child);

            //Insert new Child
            addButton.parentNode.insertBefore(newChildNode, addButton);

            if (_lodash2.default.isFunction(settings.onAdd)) {
                settings.onAdd(newChildNode);
            }
        }
    }, {
        key: 'removeAll',
        value: function removeAll() {
            _lodash2.default.each(this.children, function (child) {
                child.detach();
                child.remove();
            });
        }
    }, {
        key: 'detach',
        value: function detach() {
            _lodash2.default.each(this.children, function (child) {
                return child.detach();
            });
            this.unlistenAddButton();
        }
    }]);

    return Collection;
}();

/**
 * Initialize Collection object
 * @param data {PrototypeData}
 * @private
 */


exports.default = Collection;
function __initialize(data) {
    var _this = this;

    // init
    var prototypeDom = _Dom2.default.htmlToDocumentFragment(data.prototype),
        children = prototypeDom.querySelectorAll('[data-prototype]'),
        protoChildren = _lodash2.default.map(children, function (node) {
        return __parsePrototypeData(node);
    });

    this.prototype = __getHtmlString(prototypeDom);
    this.protoChildren = protoChildren;
    __addCreateBtn.call(this);

    // Add class and delete button to children
    // this.children  = _(this.collectionHolder.children)
    //     .filter(node => Dom.classlist.contains(node, 'row'))
    //     .map((child, index) => {
    //         let newChild = new CollectionChild(child, index, this);
    //         __addRemoveBtn.call(this, newChild);
    //         return newChild;
    //     }).value();
    this.children = _lodash2.default.map(_lodash2.default.filter(function (node) {
        return _Dom2.default.classlist.contains(node, 'row');
    }), function (child, index) {
        var newChild = new CollectionChild(child, index, _this);
        __addRemoveBtn.call(_this, newChild);
        return newChild;
    });

    //Add first?
    if (this.children.length === 0 && this.settings.addFirst) {
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
function __parsePrototypeData(element) {
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
function __addRemoveBtn(child) {
    var _this2 = this;

    var settings = this.settings,
        removeButton = settings.deleteButton.cloneNode(true);

    // right ID to delete button
    removeButton.setAttribute('id', [removeButton.getAttribute('id'), child.node.getAttribute('id')].join('_'));

    child.unlistenRemoveButton = _Events2.default.listenOnce(removeButton, 'click', function (e) {
        // prevent the link from creating a "#" on the URL
        e.preventDefault();

        if (_lodash2.default.isFunction(settings.onDelete)) {
            settings.onDelete(child.node);
        }
        var id = child.id;
        // remove collection child
        child.remove();
        child.unlistenRemoveButton = null;
        // Update all other children
        _this2.children = _lodash2.default.filter(_this2.children, function (item) {
            if (item.id > id) {
                item.setID(item.id - 1);
                return true;
            }
            return !(item.id === id);
        });
    });

    //Append child to right
    child.node.querySelector('.form-right').appendChild(removeButton);
}

/**
 * Add Add button to collection
 * @private
 */
function __addCreateBtn() {
    var _this3 = this;

    var sett = this.settings;
    this.unlistenAddButton = _Events2.default.listen(sett.addButton, 'click', function (e) {
        e.preventDefault();
        // add a new tag form (see next code block)
        _this3.add();
    });
    //append add button
    this.collectionHolder.appendChild(sett.addButton);
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
function __fillPlaceholders(key, name, number, prototype) {
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
function __getHtmlString(element) {
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

var SELECT_MAP = {
    id: '[id]',
    name: '[name]',
    'for': 'label[for]'
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

var CollectionChild = function () {
    function CollectionChild(node, id, parent, prototypeData) {
        _classCallCheck(this, CollectionChild);

        this.id = id;
        this.node = node;
        this.parent = parent;
        this.unlistenRemoveButton = null;

        _Dom2.default.classlist.add(node, 'collection-child');
        //Label?
        if (parent.settings.label === false) {
            _removeLabel(node);
        }

        var prototypeElements = node.querySelectorAll('[data-prototype]');
        if (prototypeElements.length > 0) {
            this.collections = __initializeCollections.call(this, prototypeElements, prototypeData);
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
            var _this4 = this;

            var layer = this.parent.layer;
            this.id = id;
            _lodash2.default.each(SELECT_MAP, function (selector, key) {
                _lodash2.default.each(_this4.node.querySelectorAll(selector), function (el) {
                    return __updateAttribute(el, id, layer, key);
                });
            });
            // change to self
            __updateAttribute(this.node, id, layer, 'id');
        }
    }, {
        key: 'detach',
        value: function detach() {
            _lodash2.default.each(this.collections, function (coll) {
                return coll.detach();
            });
            this.unlistenRemoveButton();
        }
    }]);

    return CollectionChild;
}();

/**
 * Initialize new collections of child
 * @param prototypeElements {HTMLCollection | Array}
 * @param prototypeDataSource {Array}
 * @returns {*|Array}
 * @private
 */


function __initializeCollections(prototypeElements, prototypeDataSource) {
    var _this5 = this;

    if (!prototypeDataSource) {
        return _lodash2.default.map(prototypeElements, function (el) {
            return _Store2.default.getValue(el, 'collection');
        });
    }
    // Init next level
    return _lodash2.default.map(prototypeElements, function (el) {
        var prototypeName = el.getAttribute('data-prototype'),
            prototypeData = _lodash2.default.cloneDeep(_lodash2.default.find(prototypeDataSource, function (data) {
            return data.options['prototype_name'] === prototypeName;
        }));
        prototypeData.prototype = __fillPlaceholders(_this5.parent.settings['prototype_name'], _this5.parent.settings.name, _this5.id, prototypeData.prototype);
        return new Collection(el, _this5.parent.globalOptions, prototypeData, _this5.parent.layer + 1);
    });
}

/**
 * Change identifier on particular level of selected attribute
 * @param node {HTMLElement}
 * @param id {string}
 * @param layer {Number}
 * @param attribute {string}
 * @private
 */
function __updateAttribute(node, id, layer, attribute) {
    var isName = attribute === 'name',
        regex = isName ? /\[\d]/g : /_\d_|_\d$/g,
        parameterStr = node.getAttribute(attribute),
        resultStr = '';

    var i = 0,
        rgxResult = null,
        next = true;

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