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
var defaultSettings = {
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
    constructor(element, globalOptions, prototypeData, layer){
        this.collectionHolder = element;
        this.prototype = null;
        this.protoChildren = [];
        this.children = [];
        this.globalOptions = globalOptions;
        this.layer = layer || 0;

        if(!prototypeData){
            prototypeData = _parsePrototypeData(element);
            Store.setValue(element, 'collection', this);
        }
        this.settings = _.extend(_.clone(defaultSettings), (globalOptions ? _.extend(prototypeData.options, globalOptions) : prototypeData.options));
        this.settings.addButton = Dom.htmlToDocumentFragment(this.settings.addButton.trim());
        this.settings.deleteButton = Dom.htmlToDocumentFragment(this.settings.deleteButton.trim());
        /** Make it live **/
        _initialize.call(this, prototypeData);
    }

    /**
     * Adds new child to collection
     */
    add(){
        var settings = this.settings,
            addButton = settings.addButton,
            prototype = this.prototype,
            prototypeChildren = this.protoChildren
            ;

        var childrenCount = _.filter(this.collectionHolder.children, function(node){
            return Dom.classlist.contains(node, 'collection-child');
        });

        var newChildStr =_fillPlaceholders(
            settings['prototype_name'],
            settings.name,
            childrenCount.length,
            prototype
        );
        var newChildNode = Dom.htmlToDocumentFragment(newChildStr.trim());
        var child = new CollectionChild(newChildNode, childrenCount.length, this, prototypeChildren);
        this.children.push(child);
        _addRemoveBtn.call(this, child);

        //Insert new Child
        addButton.parentNode.insertBefore(newChildNode, addButton);

        if (_.isFunction(settings.onAdd)){
            settings.onAdd(newChildNode);
        }
    }
}



/**
 * Initialize Collection object
 * @param data {PrototypeData}
 * @private
 */
function _initialize(data){
    // init
    var prototypeDom = Dom.htmlToDocumentFragment(data.prototype);
    var protoChildren = _.map(prototypeDom.querySelectorAll('[data-prototype]'), function(node){
        return _parsePrototypeData(node);
    });

    this.prototype = _getHtmlString(prototypeDom);
    this.protoChildren = protoChildren;
    _addCreateBtn.call(this);

    // Add class and delete button to children
    var children = _.filter(this.collectionHolder.children, function(node){
        return Dom.classlist.contains(node, 'row');
    });
    this.children = _.each(children, function(child, index, coll){
        var newChild = new CollectionChild(child, index, this);
        _addRemoveBtn.call(this, newChild);
        coll[index] = newChild;
    }, this);
    //Add first?
    if(children.length === 0 && this.settings.addFirst){
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
function _parsePrototypeData(element){
    var data = new PrototypeData(
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
function _addRemoveBtn(child){
    var settings = this.settings,
        removeButton = settings.deleteButton.cloneNode(true);

    // right ID to delete button
    removeButton.setAttribute('id', [removeButton.getAttribute('id'), '_', child.node.getAttribute('id')].join(''));

    Events.listenOnce(removeButton, 'click', (e)=>{
        // prevent the link from creating a "#" on the URL
        e.preventDefault();

        if (_.isFunction(settings.onDelete)){
            settings.onDelete(child.node);
        }
        let id = child.id;
        // remove collection child
        child.remove();
        // Update all other children
        this.children = _.filter(this.children, function(item){
            if(item.id > id){
                item.setID(item.id -1);
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
function _addCreateBtn(){
    let sett = this.settings;
    Events.listen(sett.addButton, 'click', (e)=>{
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
function _fillPlaceholders(key, name, number, prototype){
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
function _getHtmlString(element){
    var wrap = document.createElement('div');
    wrap.appendChild(element);
    return wrap.innerHTML;
}

/**
 * Remove label of node
 * @param node {HTMLElement}
 * @private
 */
function _removeLabel(node){
    Dom.removeNode(node.querySelector('.form-left'));
    var formRight = node.querySelector('.form-right');
    Dom.classlist.removeAll(formRight, ['span-none-padding-medium-16', 'span-none-padding-large-18', 'span-none-padding-xlarge-14']);
    Dom.classlist.addAll(formRight, ['span-none-padding-medium-24', 'span-none-padding-large-24', 'span-none-padding-xlarge-24']);
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

        Dom.classlist.add(node, 'collection-child');
        //Label?
        if(parent.settings.label === false){
            _removeLabel(node);
        }

        var prototypeElements = node.querySelectorAll('[data-prototype]');
        if(prototypeElements.length > 0){
            this.collections = _initializeCollections.call(this, prototypeElements, prototypeData);
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
        var layer = this.parent.layer;
        this.id = id;
        // ID
        _.map(this.node.querySelectorAll('[id]'), function(el){
            _updateAttribute(el, id, layer, 'id');
        }, this);
        // NAME
        _.map(this.node.querySelectorAll('[name]'), function(el){
            _updateAttribute(el, id, layer, 'name');
        }, this);
        // LABEL
        _.map(this.node.querySelectorAll('label[for]'), function(el){
            _updateAttribute(el, id, layer, 'for');
        }, this);
        // change to self
        _updateAttribute(this.node, id, layer, 'id');
    }
}

/**
 * Initialize new collections of child
 * @param prototypeElements {HTMLCollection | Array}
 * @param prototypeDataSource {Array}
 * @returns {*|Array}
 * @private
 */
function _initializeCollections(prototypeElements, prototypeDataSource){
    if(!prototypeDataSource){
        return _.map(prototypeElements, function(el){
            return Store.getValue(el, 'collection');
        });
    } else {
        // Init next level
        return _.map(prototypeElements, function(el){
            var prototypeName = el.getAttribute('data-prototype');
            var prototypeData = _.cloneDeep(_.find(prototypeDataSource, function(data){
                return data.options['prototype_name'] === prototypeName;
            }));
            prototypeData.prototype =_fillPlaceholders(
                this.parent.settings['prototype_name'],
                this.parent.settings.name,
                this.id,
                prototypeData.prototype
            );
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
function _updateAttribute(node, id, layer, attribute){
    var isName = attribute === 'name';
    var regex = isName ? /\[\d]/g : /_\d_|_\d$/g;
    var parameterStr =  node.getAttribute(attribute);
    var resultStr = '';

    var i = 0;
    var rgxResult = null;
    var next = true;

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



