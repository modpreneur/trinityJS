/**
 * Created by fisa on 8/20/15.
 */
'use strict';

import _ from 'lodash';
import Dom from './utils/Dom';
import Events from './utils/Events';
import CollectionChild from './CollectionChild';

/**
 * Default settings of Collection Object
 * @type {{addButton: string, deleteButton: string, onAdd: null, onDelete: null, name: string}}
 */
const defaultSettings = {
    addButton:
        `       <div class="collection-add">
                <div class="display-inline-block">
                    <a href="#" id="addButton" class="add-collection-item">
                        + add new
                    </a>
                </div>
            </div>`,
    deleteButton:
        `       <a title="Remove item" href="#" id="deleteButton" class="delete-collection-item">
                <span class="mdi mdi-delete"></span>
            </a>`,
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
export default class Collection {
    constructor(element, globalOptions = {}, layer){
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
        this.settings = _.defaultsDeep({}, globalOptions, this.prototypeData.options, defaultSettings);

        // TODO: BUTTONS
        if(element.getAttribute('disabled')) {
            this.settings.addButton = '<span></span>';
            this.settings.deleteButton = '<span></span>';
        }

        //this.settings = _.extend(_.clone(defaultSettings), (globalOptions ? _.extend(prototypeData.options, globalOptions) : prototypeData.options));
        this.settings.addButton = Dom.htmlToDocumentFragment(this.settings.addButton.trim());
        this.settings.deleteButton = Dom.htmlToDocumentFragment(this.settings.deleteButton.trim());

        /** Make it live **/
        this.initialize();
    }

    /**
     * Initializes Collection
     * - find and add existing children
     * - add "add new child" button
     */
    initialize() {
        // init
        this.__addCreateButton();

        // initialize existing collection children if there are any
        _.each(this.element.children, (el) => {
            if(Dom.classlist.contains(el, this.settings.childSelectorClass)) {
                this.addChild(el);
            }
        });

        // Add first?
        if(this.children.length === 0 && this.settings.addFirst){
            this.addChild();
        }
    }

    /**
     * Removes collection child
     * @param id {string}
     * @returns {boolean}
     */
    removeChild(id){
        let child = _.find(this.children, (collChild) => collChild.id === id);
        if (!child) {
            if(process.env.NODE_ENV !== 'production') {
                console.error(`Child with ID: ${id} does not exist`);
            }
            return false;
        }

        if (_.isFunction(this.settings.onDelete) && this.settings.onDelete(child.node) === false){
            return false;
        }

        // remove collection child
        child.remove();
        child.unlistenRemoveButton = null;

        // Update all other children
        this.children = _.filter(this.children, (collChild) => {
            if(collChild.id > id){
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
    addChild(element){
        let settings = this.settings,
            index = this.children.length, // new child index
            addButtonElement = settings.addButton; // add button

        if (!element) {
            element = Dom.htmlToDocumentFragment(
                __fillPlaceholders(settings['prototype_name'], settings.name, index, this.prototype).trim()
            );
            // Insert new Child
            addButtonElement.parentNode.insertBefore(element, addButtonElement);
        // check if element is direct child of collection
        } else if (element.parentElement !== this.element){
            if(process.env.NODE_ENV !== 'production') {
                console.error('Provided element is not child of collection holder element', element);
            }
            return false;
        }

        let newChild = new CollectionChild(
            index,
            element,
            this,
            this.removeChild.bind(this, index)
        );

        // add new collection child to array
        this.children.push(newChild);

        // On Add callback
        if(_.isFunction(settings.onAdd)){
            settings.onAdd(element);
        }
        return true;
    }


    /**
     * Remove all children
     */
    removeAll(){
        _.each(this.children, child => {
            this.removeChild(child.id);
        });
    }

    /**
     * Remove all listeners and prepare for DOM remove
     */
    detach(){
        _.each(this.children, child => child.detach());
        this.unlistenAddButton();
        this.element.setAttribute('data-options', JSON.stringify(this.prototypeData.options));
        this.element.setAttribute('data-prototype', JSON.stringify(this.prototypeData.prototype));
    }

    /**
     * Add Add button to collection
     * @private
     */
    __addCreateButton() {
        let sett = this.settings;
        this.unlistenAddButton = Events.listen(sett.addButton, 'click', (e) => {
            e.preventDefault();
            // add a new tag form (see next code block)
            this.addChild();
        });
        //append add button
        this.element.appendChild(sett.addButton);
    }
}

/**
 * Parse prototype data from element and remove [data-prototype] and [data-options] values
 * [data-prototype] value is set to "prototype_name" of parsed element, found in options
 * @param element
 * @returns {object}
 * @private
 */
function __parsePrototypeData(element){
    let data = {
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
function __fillPlaceholders(key, name, number, prototype){
    let labelRegex = new RegExp(key + 'label__', 'g'),
        nameRegex = new RegExp(key, 'g');
    return prototype.replace(labelRegex, name + number).replace(nameRegex, '' + number);
}



