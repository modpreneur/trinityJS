'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.classlist = undefined;
exports.disable = disable;
exports.enable = enable;
exports.removeNode = removeNode;
exports.removeChildren = removeChildren;
exports.htmlToDocumentFragment = htmlToDocumentFragment;
exports.replaceNode = replaceNode;
exports.createDom = createDom;

var _classlist = require('./classlist.js');

var _classlist2 = _interopRequireDefault(_classlist);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Just export classlist to have it all in one component
 * @type {{}}
 */
var classlist = exports.classlist = _classlist2.default;

/**
 * Disable element by adding attribute disabled="disabled"
 * @param element
 */
/**
 * Created by fisa on 10/26/15.
 */

function disable(element) {
    if (!element.disabled) {
        element.setAttribute('disabled', 'disabled');
    }
}

/**
 * Enable disabled attribute by removing attribute "disabled"
 * @param element
 */
function enable(element) {
    if (element.disabled) {
        element.removeAttribute('disabled');
    }
}

/**
 * Removes a node from its parent.
 * @param {Node} node The node to remove.
 * @return {Node} The node removed if removed; else, null.
 */
function removeNode(node) {
    return node && node.parentNode ? node.parentNode.removeChild(node) : null;
}

/**
 * Removes all the child nodes on a DOM node.
 * @param {Node} node Node to remove children from.
 */
function removeChildren(node) {
    var child;
    while (child = node.firstChild) {
        node.removeChild(child);
    }
}

/**
 * Create document fragment from html string
 * @param htmlString
 * @returns {*}
 */
function htmlToDocumentFragment(htmlString) {
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    if (tempDiv.childNodes.length == 1) {
        return tempDiv.removeChild(tempDiv.firstChild);
    }
    var fragment = document.createDocumentFragment();
    while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild);
    }
    return fragment;
}

/**
 * Replaces a node in the DOM tree. Will do nothing if {@code oldNode} has no
 * parent.
 * @param {Node} newNode Node to insert.
 * @param {Node} oldNode Node to replace.
 */
function replaceNode(newNode, oldNode) {
    var parent = oldNode.parentNode;
    if (parent) {
        parent.replaceChild(newNode, oldNode);
    }
}

/**
 * Creates DOM element
 * @param tagName
 * @param elementAttributes
 * @param innerHTML
 * @returns {Element}
 */
function createDom(tagName, elementAttributes, innerHTML) {
    var tmpElement = document.createElement(tagName);
    // Attributes?
    if (elementAttributes) {
        var attKeys = Object.keys(elementAttributes),
            keysLength = attKeys.length;

        for (var i = 0; i < keysLength; i++) {
            tmpElement.setAttribute(attKeys[i], elementAttributes[attKeys[i]]);
        }
    }
    // InnerHTML?
    if (innerHTML && typeof innerHTML === 'string') {
        //TODO: innerHTML should be checked - sanitized
        tmpElement.innerHTML = innerHTML;
    } else if (innerHTML instanceof HTMLElement) {
        tmpElement.appendChild(innerHTML);
    }
    return tmpElement;
}

var Dom = {
    classlist: _classlist2.default,
    disable: disable,
    enable: enable,
    removeNode: removeNode,
    removeChildren: removeChildren,
    htmlToDocumentFragment: htmlToDocumentFragment,
    replaceNode: replaceNode,
    createDom: createDom
};
exports.default = Dom;