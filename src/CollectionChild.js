'use strict';

import _ from 'lodash';
import Dom from './utils/Dom';
import Events from './utils/Events';

const SELECT_MAP = {
    id:'[id]',
    name:'[name]',
    'for':'label[for]'
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
export default class CollectionChild {
    constructor(element, id, parent, onRemoveCallback, settings){
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
    remove(){
        this.detach();
        Dom.removeNode(this.element);
    }

    /**
     * Unlisten all child element
     */
    detach() {
        this.unlistenRemoveButton();
    }

    /**
     * Creates remove button
     * @param onRemoveCallback {function}
     * @private
     */
    __createRemoveButton(onRemoveCallback){
        // try to find embedded button in prototype itself
        let removeButton = this.element.querySelector('[data-collection-remove]');
        if(!removeButton) {
            removeButton = this.parent.settings.deleteButton.cloneNode(true);
        }

        // set ID to delete button
        removeButton.setAttribute('id', [removeButton.getAttribute('id'), this.id].join('_'));
        this.unlistenRemoveButton = Events.listenOnce(removeButton, 'click', (e) => {
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
    setId(id){
        let layer = this.parent.layer;
        this.id = id;
        _.each(SELECT_MAP, (selector, key) => {
            _.each(this.element.querySelectorAll(selector), el => __updateAttribute(el, id, layer, key));
        });
        // change to self
        __updateAttribute(this.element, id, layer, 'id');
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
function __updateAttribute(node, id, layer, attribute){
    let isName = attribute === 'name',
        regex = isName ? /\[\d]/g : /_\d_|_\d$/g,
        parameterStr =  node.getAttribute(attribute),
        resultStr = '';

    let i = 0,
        rgxResult = null,
        next = true;

    while(next){
        rgxResult = regex.exec(parameterStr);
        if(i === layer){
            resultStr += parameterStr.substring(0,rgxResult.index + 1);
            resultStr += id;

            if(!isName && parameterStr.length === rgxResult.index + rgxResult[0].length){
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