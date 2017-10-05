/**
 * Created by fisa on 8/20/15.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _isFunction2 = require('lodash/isFunction');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _find2 = require('lodash/find');

var _find3 = _interopRequireDefault(_find2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _defaultsDeep2 = require('lodash/defaultsDeep');

var _defaultsDeep3 = _interopRequireDefault(_defaultsDeep2);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Dom = require('./utils/Dom');

var _Dom2 = _interopRequireDefault(_Dom);

var _Events = require('./utils/Events');

var _Events2 = _interopRequireDefault(_Events);

var _CollectionChild = require('./CollectionChild');

var _CollectionChild2 = _interopRequireDefault(_CollectionChild);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Default settings of Collection Object
 * @type {{addButton: string, deleteButton: string, onAdd: null, onDelete: null, name: string}}
 */
var defaultSettings = {
    addButton: '       <div class="collection-add">\n                <div class="display-inline-block">\n                    <a href="#" id="addButton" class="add-collection-item">\n                        + add new\n                    </a>\n                </div>\n            </div>',
    deleteButton: '       <a title="Remove item" href="#" id="deleteButton" class="delete-collection-item">\n                <span class="mdi mdi-delete"></span>\n            </a>',
    onAdd: null,
    onDelete: null,
    label: false,
    addFirst: true,
    name: '[Element Name]',
    childSelectorClass: 'collection-child'
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
        var layer = arguments[2];

        _classCallCheck(this, Collection);

        this.element = element;
        this.prototype = null;
        this.children = [];
        this.globalOptions = globalOptions;
        this.layer = layer || 0;

        // Listeners
        this.unlistenAddButton = null;

        this.prototypeData = __parsePrototypeData(element); // todo: maybe remove prototypeData
        this.prototype = this.prototypeData.prototype;

        // Merge all options
        this.settings = (0, _defaultsDeep3.default)({}, globalOptions, this.prototypeData.options, defaultSettings);

        // TODO: BUTTONS
        if (element.getAttribute('disabled')) {
            this.settings.addButton = '<span></span>';
            this.settings.deleteButton = '<span></span>';
        }

        //this.settings = _.extend(_.clone(defaultSettings), (globalOptions ? _.extend(prototypeData.options, globalOptions) : prototypeData.options));
        this.settings.addButton = _Dom2.default.htmlToDocumentFragment(this.settings.addButton.trim());
        this.settings.deleteButton = _Dom2.default.htmlToDocumentFragment(this.settings.deleteButton.trim());

        /** Make it live **/
        this.initialize();
    }

    /**
     * Initializes Collection
     * - find and add existing children
     * - add "add new child" button
     */


    _createClass(Collection, [{
        key: 'initialize',
        value: function initialize() {
            var _this = this;

            // init
            this.__addCreateButton();

            // initialize existing collection children if there are any
            (0, _each3.default)(this.element.children, function (el) {
                if (_Dom2.default.classlist.contains(el, _this.settings.childSelectorClass)) {
                    _this.addChild(el);
                }
            });

            // Add first?
            if (this.children.length === 0 && this.settings.addFirst) {
                this.addChild();
            }
        }

        /**
         * Removes collection child
         * @param id {string}
         * @returns {boolean}
         */

    }, {
        key: 'removeChild',
        value: function removeChild(id) {
            var child = (0, _find3.default)(this.children, function (collChild) {
                return collChild.id === id;
            });
            if (!child) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Child with ID: ' + id + ' does not exist');
                }
                return false;
            }

            if ((0, _isFunction3.default)(this.settings.onDelete) && this.settings.onDelete(child.node) === false) {
                return false;
            }

            // remove collection child
            child.remove();
            child.unlistenRemoveButton = null;

            // Update all other children
            this.children = (0, _filter3.default)(this.children, function (collChild) {
                if (collChild.id > id) {
                    // update ID
                    collChild.setId(collChild.id - 1);
                    return true;
                }
                // Keep others
                return !(collChild.id === id);
            });
        }

        /**
         * Adds new child to collection
         * @param element [HTMLElement]
         */

    }, {
        key: 'addChild',
        value: function addChild(element) {
            var settings = this.settings,
                index = this.children.length,
                // new child index
            addButtonElement = settings.addButton; // add button

            if (!element) {
                element = _Dom2.default.htmlToDocumentFragment(__fillPlaceholders(settings['prototype_name'], settings.name, index, this.prototype).trim());
                // Insert new Child
                addButtonElement.parentNode.insertBefore(element, addButtonElement);
                // check if element is direct child of collection
            } else if (element.parentElement !== this.element) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Provided element is not child of collection holder element', element);
                }
                return false;
            }

            var newChild = new _CollectionChild2.default(index, element, this, this.removeChild.bind(this, index));

            // add new collection child to array
            this.children.push(newChild);

            // On Add callback
            if ((0, _isFunction3.default)(settings.onAdd)) {
                settings.onAdd(element);
            }
            return true;
        }

        /**
         * Remove all children
         */

    }, {
        key: 'removeAll',
        value: function removeAll() {
            (0, _each3.default)(this.children, function (child) {
                child.detach();
                child.remove();
            });
        }

        /**
         * Remove all listeners and prepare for DOM remove
         */

    }, {
        key: 'detach',
        value: function detach() {
            (0, _each3.default)(this.children, function (child) {
                return child.detach();
            });
            this.unlistenAddButton();
            this.element.setAttribute('data-options', JSON.stringify(this.prototypeData.options));
            this.element.setAttribute('data-prototype', JSON.stringify(this.prototypeData.prototype));
        }

        /**
         * Add Add button to collection
         * @private
         */

    }, {
        key: '__addCreateButton',
        value: function __addCreateButton() {
            var _this2 = this;

            var sett = this.settings;
            this.unlistenAddButton = _Events2.default.listen(sett.addButton, 'click', function (e) {
                e.preventDefault();
                // add a new tag form (see next code block)
                _this2.addChild();
            });
            //append add button
            this.element.appendChild(sett.addButton);
        }
    }]);

    return Collection;
}();

/**
 * Parse prototype data from element and remove [data-prototype] and [data-options] values
 * [data-prototype] value is set to "prototype_name" of parsed element, found in options
 * @param element
 * @returns {object}
 * @private
 */


exports.default = Collection;
function __parsePrototypeData(element) {
    var data = {
        prototype: element.getAttribute('data-prototype'),
        options: JSON.parse(element.getAttribute('data-options'))
    };

    //clean up
    element.removeAttribute('data-options');
    element.setAttribute('data-prototype', data.options['prototype_name']);
    return data;
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
    var labelRegex = new RegExp(key + 'label__', 'g'),
        nameRegex = new RegExp(key, 'g');
    return prototype.replace(labelRegex, name + number).replace(nameRegex, '' + number);
}