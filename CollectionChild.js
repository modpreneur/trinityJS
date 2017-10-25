'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Dom = require('./utils/Dom');

var _Dom2 = _interopRequireDefault(_Dom);

var _Events = require('./utils/Events');

var _Events2 = _interopRequireDefault(_Events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
    function CollectionChild(id, element, parent, onRemoveCallback, settings) {
        _classCallCheck(this, CollectionChild);

        this.id = id;
        this.element = element;
        this.parent = parent;
        this.settings = settings || {};
        this.onRemoveCallback = onRemoveCallback;
        this.unlistenRemoveButton = null;

        // Add remove button
        this.__createRemoveButton(onRemoveCallback);
    }

    /**
     * Safety remove child element
     */


    _createClass(CollectionChild, [{
        key: 'remove',
        value: function remove() {
            this.detach();
            _Dom2.default.removeNode(this.element);
        }

        /**
         * Unlisten all child element
         */

    }, {
        key: 'detach',
        value: function detach() {
            this.unlistenRemoveButton();
        }

        /**
         * Creates remove button
         * @param onRemoveCallback {function}
         * @private
         */

    }, {
        key: '__createRemoveButton',
        value: function __createRemoveButton(onRemoveCallback) {
            // try to find embedded button in prototype itself
            var removeButton = this.element.querySelector('[data-collection-remove]');
            if (!removeButton) {
                removeButton = this.parent.settings.deleteButton.cloneNode(true);
            }

            // set ID to delete button
            removeButton.setAttribute('id', [removeButton.getAttribute('id'), this.id].join('_'));
            this.unlistenRemoveButton = _Events2.default.listenOnce(removeButton, 'click', function (e) {
                // prevent the link from creating a "#" on the URL
                e.preventDefault();
                // callback from parent
                onRemoveCallback();
            });
        }

        /**
         * Set ID of child and update all elements descendant
         * @param id
         */

    }, {
        key: 'setId',
        value: function setId(id) {
            var _this = this;

            var layer = this.parent.layer;
            this.id = id;
            (0, _each3.default)(SELECT_MAP, function (selector, key) {
                (0, _each3.default)(_this.element.querySelectorAll(selector), function (el) {
                    return __updateAttribute(el, id, layer, key);
                });
            });
            // change to self
            __updateAttribute(this.element, id, layer, 'id');
        }
    }]);

    return CollectionChild;
}();

/**
 * Change identifier on particular level of selected attribute
 * @param node {HTMLElement}
 * @param id {string}
 * @param layer {Number}
 * @param attribute {string}
 * @private
 */


exports.default = CollectionChild;
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