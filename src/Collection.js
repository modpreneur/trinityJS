/**
 * Created by fisa on 8/20/15.
 */
'use strict';

import _ from 'lodash';
import Dom from './utils/Dom';
import Events from './utils/Events';
import Store from './Store';

/**
 * Default settings of Collection Object
 * @type {{addButton: string, deleteButton: string, onAdd: null, onDelete: null, name: string}}
 */
const defaultSettings = {
    addButton:
        `       <div class="collection-add display-inline-block">
                <div class="span-medium-8 span-large-6 span-xlarge-10"></div>
                <div class="display-inline-block">
                    <a href="#" id="addButton" class="add-collection-item">
                        <i class="tiecons tiecons-plus-radius-large"></i>
                    </a>
                </div>
            </div>`,
    deleteButton:
        `       <a title="Remove item" href="#" id="deleteButton" class="delete-collection-item">
                <span class="trinity trinity-trash circle"></span>
            </a>`,
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
export default class Collection {
    constructor(element, globalOptions = {}, prototypeData, layer){
        this.collectionHolder = element;
        this.prototype = null;
        this.protoChildren = [];
        this.children = [];
        this.globalOptions = globalOptions;
        this.layer = layer || 0;
        // Listeners
        this.unlistenAddButton = null;

        if(!prototypeData){
            prototypeData = __parsePrototypeData(element);
            Store.setValue(element, 'collection', this);
        }
        this.settings = _.defaultsDeep({}, globalOptions, prototypeData.options, defaultSettings);
        //this.settings = _.extend(_.clone(defaultSettings), (globalOptions ? _.extend(prototypeData.options, globalOptions) : prototypeData.options));
        this.settings.addButton = Dom.htmlToDocumentFragment(this.settings.addButton.trim());
        this.settings.deleteButton = Dom.htmlToDocumentFragment(this.settings.deleteButton.trim());

        /** Make it live **/
        __initialize.call(this, prototypeData);
    }

    /**
     * Adds new child to collection
     */
    add(){
        let settings = this.settings,
            addButton = settings.addButton,
            prototype = this.prototype,
            prototypeChildren = this.protoChildren,
        // children count?
            childrenCount = _.filter(this.collectionHolder.children, node => {
                return Dom.classlist.contains(node, 'collection-child');
            }),
        // Placeholders
            newChildStr = __fillPlaceholders(
                settings['prototype_name'],
                settings.name,
                childrenCount.length,
                prototype
            );

        let newChildNode = Dom.htmlToDocumentFragment(newChildStr.trim()),
            child = new CollectionChild(newChildNode, childrenCount.length, this, prototypeChildren);

        this.children.push(child);
        __addRemoveBtn.call(this, child);

        //Insert new Child
        addButton.parentNode.insertBefore(newChildNode, addButton);

        if(_.isFunction(settings.onAdd)){
            settings.onAdd(newChildNode);
        }
    }

    removeAll(){
        _.each(this.children, child => {
            child.detach();
            child.remove();
        });
    }

    detach(){
        _.each(this.children, child => child.detach());
        this.unlistenAddButton();
    }
}



/**
 * Initialize Collection object
 * @param data {PrototypeData}
 * @private
 */
function __initialize(data){
    // init
    let prototypeDom = Dom.htmlToDocumentFragment(data.prototype),
        children = prototypeDom.querySelectorAll('[data-prototype]'),
        protoChildren = _.map(children, node => __parsePrototypeData(node));

    this.prototype = __getHtmlString(prototypeDom);
    this.protoChildren = protoChildren;
    __addCreateBtn.call(this);

    // Add class and delete button to children
    this.children = _.map(
        // filter row nodes
        _.filter(this.collectionHolder.children, node => Dom.classlist.contains(node, 'form-row')),
        // Add delete buttons
        (child, index) => {
            let newChild = new CollectionChild(child, index, this);
            __addRemoveBtn.call(this, newChild);
            return newChild;
        }
    );
    //Add first?
    if(this.children.length === 0 && this.settings.addFirst){
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
function __parsePrototypeData(element){
    let data = new PrototypeData(
        element.getAttribute('data-prototype'),
        JSON.parse(element.getAttribute('data-options'))
    );
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
function __addRemoveBtn(child){
    let settings = this.settings,
        removeButton = settings.deleteButton.cloneNode(true);

    // right ID to delete button
    removeButton.setAttribute('id', [removeButton.getAttribute('id'), child.node.getAttribute('id')].join('_'));

    child.unlistenRemoveButton = Events.listenOnce(removeButton, 'click', (e) => {
        // prevent the link from creating a "#" on the URL
        e.preventDefault();

        if (_.isFunction(settings.onDelete)){
            settings.onDelete(child.node);
        }
        let id = child.id;
        // remove collection child
        child.remove();
        child.unlistenRemoveButton = null;
        // Update all other children
        this.children = _.filter(this.children, function(item){
            if(item.id > id){
                item.setID(item.id - 1);
                return true;
            }
            return !(item.id === id);
        });
    });

    //Append child to right - old design
    let rightPart = child.node.querySelector('.form-right');
    if(rightPart) {
        rightPart.appendChild(removeButton);
    } else {
        // new design fix
        child.node.appendChild(removeButton);
    }
}

/**
 * Add Add button to collection
 * @private
 */
function __addCreateBtn(){
    let sett = this.settings;
    this.unlistenAddButton = Events.listen(sett.addButton, 'click', (e) => {
        e.preventDefault();
        // add a new tag form (see next code block)
        this.add();
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
function __fillPlaceholders(key, name, number, prototype){
    let labelRegx = new RegExp(key + 'label__', 'g'),
        nameRegx = new RegExp(key, 'g');
    return prototype.replace(labelRegx, name + number).replace(nameRegx, '' + number);
}

/**
 * Return HTML string representation of HTML Element object
 * @param element {HTMLElement}
 * @returns {string}
 * @private
 */
function __getHtmlString(element){
    let wrap = document.createElement('div');
    wrap.appendChild(element);
    return wrap.innerHTML;
}

/**
 * Remove label of node
 * @param node {HTMLElement}
 * @private
 * @deprecated
 */
function _removeLabel(node){
    let el = node.querySelector('.form-left');
    if (el) {
        Dom.removeNode(node.querySelector('.form-left'));
    }
    el = node.querySelector('.form-right');

    if(el) {
        Dom.classlist.removeAll(formRight, ['span-none-padding-medium-16', 'span-none-padding-large-18', 'span-none-padding-xlarge-14']);
        Dom.classlist.addAll(formRight, ['span-none-padding-medium-24', 'span-none-padding-large-24', 'span-none-padding-xlarge-24']);
    }
}

/**
 * Simple class which keeps basic prototype data
 * @class PrototypeData
 * @param proto {string}
 * @param options {Object}
 * @constructor
 */
class PrototypeData {
    constructor(proto, options){
        this.prototype = proto;
        this.options = options;
    }
}


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
class CollectionChild {
    constructor(node, id, parent, prototypeData){
        this.id = id;
        this.node = node;
        this.parent = parent;
        this.unlistenRemoveButton = null;

        Dom.classlist.add(node, 'collection-child');
        //Label? @deprecated will be changed
        if(parent.settings.label === false){
            _removeLabel(node);
        }

        let prototypeElements = node.querySelectorAll('[data-prototype]');
        if(prototypeElements.length > 0){
            this.collections = __initializeCollections.call(this, prototypeElements, prototypeData);
        }
    }

    /**
     * Safety remove of child
     */
    remove(){
        Dom.removeNode(this.node);
    }

    /**
     * Set ID of child and update all elements descendant
     * @param id
     */
    setID(id){
        let layer = this.parent.layer;
        this.id = id;
        _.each(SELECT_MAP, (selector, key) => {
            _.each(this.node.querySelectorAll(selector), el => __updateAttribute(el, id, layer, key));
        });
        // change to self
        __updateAttribute(this.node, id, layer, 'id');
    }

    detach(){
        _.each(this.collections, coll => coll.detach());
        this.unlistenRemoveButton();
    }
}

/**
 * Initialize new collections of child
 * @param prototypeElements {HTMLCollection | Array}
 * @param prototypeDataSource {Array}
 * @returns {*|Array}
 * @private
 */
function __initializeCollections(prototypeElements, prototypeDataSource){
    if(!prototypeDataSource){
        return _.map(prototypeElements, el => Store.getValue(el, 'collection'));
    }
    // Init next level
    return _.map(prototypeElements, (el) => {
        let prototypeName = el.getAttribute('data-prototype'),
            prototypeData = _.cloneDeep(_.find(prototypeDataSource, (data) => {
                return data.options['prototype_name'] === prototypeName;
            }));
        prototypeData.prototype = __fillPlaceholders(
            this.parent.settings['prototype_name'],
            this.parent.settings.name,
            this.id,
            prototypeData.prototype
        );
        return new Collection(el, this.parent.globalOptions, prototypeData, this.parent.layer + 1);
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