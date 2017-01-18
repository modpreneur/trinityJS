'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('./lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var classlist = {}; /**
                     * Created by fisa on 10/26/15.
                     */
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
    return _lodash2.default.isString(className) && className.match(/\S+/g) || [];
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
        _lodash2.default.each(classesToAdd, function (c) {
            element.classList.add(c);
        });
        return;
    }

    var classMap = {};

    // Get all current class names into a map.
    _lodash2.default.each(classlist.get(element), function (className) {
        classMap[className] = true;
    });

    // Add new class names to the map.
    _lodash2.default.each(classesToAdd, function (className) {
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
        element.className = _lodash2.default.filter(classlist.get(element), function (c) {
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
        _lodash2.default.each(classesToRemove, function (c) {
            element.classList.remove(c);
        });
        return;
    }
    // Filter out those classes in classesToRemove.
    element.className = _lodash2.default.filter(classlist.get(element), function (className) {
        // If this class is not one we are trying to remove,
        // add it to the array of new class names.
        return !_lodash2.default.contains(classesToRemove, className);
    }).join(' ');
};

/**
 * Returns true if element contains className provided
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
classlist.contains = function (element, className) {
    return element.classList ? element.classList.contains(className) : _lodash2.default.includes(classlist.get(element), className);
};