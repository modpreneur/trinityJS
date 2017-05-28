'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _includes2 = require('lodash/includes');

var _includes3 = _interopRequireDefault(_includes2);

var _contains2 = require('lodash/fp/contains');

var _contains3 = _interopRequireDefault(_contains2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by fisa on 10/26/15.
 */
var classlist = {};
exports.default = classlist;

/**
 * Gets classlist Object
 * @param element {HTMLElement}
 * @returns {*}
 */

classlist.get = function (element) {
    if (element.classList) {
        return element.classList;
    }

    var className = element.className;
    // Some types of elements don't have a className in IE (e.g. iframes).
    // Furthermore, in Firefox, className is not a string when the element is
    // an SVG element.
    return (0, _isString3.default)(className) && className.match(/\S+/g) || [];
};

/**
 * Adds a class to an element.  Does not add multiples of class names.  This
 * method may throw a DOM exception for an invalid or empty class name if
 * DOMTokenList is used.
 * @param {Element} element DOM node to add class to.
 * @param {string} className Class name to add.
 */
classlist.add = function (element, className) {
    if (element.classList) {
        element.classList.add(className);
        return;
    }

    if (!classlist.contains(element, className)) {
        // Ensure we add a space if this is not the first class name added.
        element.className += element.className.length > 0 ? ' ' + className : className;
    }
};

/**
 * Add all classes to element, avoid duplicates
 * @param {Element} element
 * @param {Array<string>} classesToAdd
 */
classlist.addAll = function (element, classesToAdd) {
    if (element.classList) {
        (0, _each3.default)(classesToAdd, function (c) {
            return element.classList.add(c);
        });
        return;
    }

    var classMap = {};

    // Get all current class names into a map.
    (0, _each3.default)(classlist.get(element), function (className) {
        classMap[className] = true;
    });

    // Add new class names to the map.
    (0, _each3.default)(classesToAdd, function (className) {
        classMap[className] = true;
    });

    // Flatten the keys of the map into the className.
    element.className = '';
    for (var className in classMap) {
        element.className += element.className.length > 0 ? ' ' + className : className;
    }
};

/**
 * Removes a class from an element.  This method may throw a DOM exception
 * for an invalid or empty class name if DOMTokenList is used.
 * @param {Element} element DOM node to remove class from.
 * @param {string} className Class name to remove.
 */
classlist.remove = function (element, className) {
    if (element.classList) {
        element.classList.remove(className);
        return;
    }

    if (classlist.contains(element, className)) {
        // Filter out the class name.
        element.className = (0, _filter3.default)(classlist.get(element), function (c) {
            return c != className;
        }).join(' ');
    }
};

/**
 * Removes all classes
 * @param {Element} element
 * @param {Array<string>} classesToRemove
 */
classlist.removeAll = function (element, classesToRemove) {
    if (element.classList) {
        (0, _each3.default)(classesToRemove, function (c) {
            return element.classList.remove(c);
        });
        return;
    }
    // Filter out those classes in classesToRemove.
    element.className = (0, _filter3.default)(classlist.get(element), function (className) {
        // If this class is not one we are trying to remove,
        // add it to the array of new class names.
        return !(0, _contains3.default)(classesToRemove, className);
    }).join(' ');
};

/**
 * Returns true if element contains className provided
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
classlist.contains = function (element, className) {
    return element.classList ? element.classList.contains(className) : (0, _includes3.default)(classlist.get(element), className);
};