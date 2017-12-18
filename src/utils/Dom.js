/**
 * Created by fisa on 10/26/15.
 */

import classListHelper from './classlist.js';

/**
 * Just export classlist to have it all in one component
 * @type {Object}
 */
export const classlist = classListHelper;

/**
 * Disable element by adding attribute disabled="disabled"
 * @param {HTMLElement} element
 */
export function disable(element){
    if(element && !element.disabled) {
        element.setAttribute('disabled', 'disabled');
    }
}

/**
 * Enable disabled attribute by removing attribute "disabled"
 * @param {HTMLElement} element
 */
export function enable(element){
    if(element && element.disabled){
        element.removeAttribute('disabled');
    }
}

/**
 * Removes a node from its parent.
 * @param {Node} node The node to remove.
 * @return {Node} The node removed if removed; else, null.
 */
export function removeNode(node){
    return node && node.parentNode ? node.parentNode.removeChild(node) : null;
}

/**
 * Removes all the child nodes on a DOM node.
 * @param {Node} node Node to remove children from.
 */
export function removeChildren(node){
    let child;
    while ((child = node.firstChild)) {
        node.removeChild(child);
    }
}

/**
 * Create document fragment from html string
 * @param {String} htmlString
 * @returns {*}
 */
export function htmlToDocumentFragment(htmlString){
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    if (tempDiv.childNodes.length === 1) {
        return tempDiv.removeChild(tempDiv.firstChild);
    }
    let fragment = document.createDocumentFragment();
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
export function replaceNode(newNode, oldNode) {
    let parent = oldNode.parentNode;
    if (parent) {
        parent.replaceChild(newNode, oldNode);
    }
}

/**
 * Return HTML string representation of HTML Element object
 * @param {HTMLElement} element
 * @returns {string}
 */
export function getHtmlString(element){
    let wrap = document.createElement('div');
    wrap.appendChild(element);
    return wrap.innerHTML;
}

/**
 * Creates DOM element
 * @param {String} tagName
 * @param {object} elementAttributes
 * @param {String | HTMLElement} innerHTML
 * @returns {Element}
 */
export function createDom(tagName, elementAttributes, innerHTML){
    let tmpElement = document.createElement(tagName);
    // Attributes?
    if(elementAttributes){
        let attKeys = Object.keys(elementAttributes),
            keysLength = attKeys.length;

        for(let i = 0; i < keysLength; i++){
            tmpElement.setAttribute(attKeys[i], elementAttributes[attKeys[i]]);
        }
    }
    // InnerHTML?
    if(innerHTML && typeof innerHTML === 'string'){
        //TODO: innerHTML should be checked - sanitized
        tmpElement.innerHTML = innerHTML;
    } else if(innerHTML instanceof HTMLElement) {
        tmpElement.appendChild(innerHTML);
    }
    return tmpElement;
}


let Dom = {
    classlist :classListHelper,
    disable,
    enable,
    removeNode,
    removeChildren,
    htmlToDocumentFragment,
    replaceNode,
    getHtmlString,
    createDom
};
export default Dom;