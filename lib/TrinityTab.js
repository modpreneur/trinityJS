/**
 * Created by fisa on 9/11/15.
 */

import _ from 'lodash';
import Dom from '../utils/Dom.js';
import events from './utils/closureEvents.js';

import Store from './Store.js';
import TrinityForm from './TrinityForm.js';
import Gateway from './Gateway.js';


var tabRegx = /(?:#)(.*tab\d+)(?:=(.*))*/;

/**
 * Trinity Tab
 */
export default class TrinityTab extends events.EventTarget {
    constructor(){
        var tabHeads = document.querySelectorAll('.tab-head');
        if(tabHeads.length < 1){
            throw new Error('Elements with "tab-head" class not found!');
        }
        super();
        this.heads = tabHeads;
        this.tabs = {};
        this.activeHead = null;
        _initialize.call(this);
    }

    /**
     * Sets Active Tab as actual and update Hash path
     * @param tabHead
     * @public
     */
    setActiveTab(tabHead){
        this.activeHead.removeAttribute('checked');
        this.activeHead = tabHead;
        this.activeHead.setAttribute('checked', 'checked');
        //Update Hash URL
        _pushHistory(this.getActiveTab().getPath());
    }

    /**
     * TODO: NOTE: may return NULL if active tab still processing
     * @returns {Tab}
     */
    getActiveTab(){
        return _.find(this.tabs, function(tab){
            return tab.head === this.activeHead;
        }, this);
    }
}


function _initialize(){
    //Check which tab to load first
    var tabInfo = location.hash.match(tabRegx),
        activeHead = null,
        path = null;

    if(_.isNull(tabInfo)){
        activeHead = _.find(this.heads, function(tab){
            return !_.isNull(tab.getAttribute('checked'));
        });
    } else {
        //TODO: Tab info - bigger deep
        activeHead = document.getElementById(tabInfo[1]);
        activeHead.setAttribute('checked', 'checked');
        path = tabInfo[2];
    }
    this.activeHead = activeHead;
    // Add new Tab to tabs
    this.tabs[activeHead.getAttribute('id')] = _createTab(this, activeHead, path || null);

    /** Attach click event Listeners to other heads **/
    _.map(this.heads, function(head){
        events.listen(head, 'click', _handleTabClick.bind(this, head));
    }, this);

    events.listen(window, 'popstate', _handleNavigation, false, this);
}

/**
 * Handles navigation
 * @param e
 * @private
 */
function _handleNavigation(e){
    var tabInfo = location.hash.match(tabRegx),
        head = null;

    if(!_.isNull(tabInfo)){
        head = document.getElementById(tabInfo[1]);
        if(this.activeHead !== head){
            this.activeHead.removeAttribute('checked');
            this.activeHead = head;
            this.activeHead.setAttribute('checked', 'checked');
            this.activeHead.checked = true;
        }
        var tab = this.getActiveTab();
        if(tabInfo[2]){
            tab.setActiveByUrl(tabInfo[2]);
        } else if(tab.active !== tab.root){
            tab.active.hide();
            tab.active = tab.root;
            Dom.classlist.remove(tab.root, 'display-none');
        }
    }
}

/**
 * Handles click event on Tab
 * @param head
 * @param e
 * @private
 */
function _handleTabClick(head, e){
    var tabID = head.getAttribute('id');
    // If undefined -> Create and Set as Active
    if(_.isUndefined(this.tabs[tabID])){
        this.tabs[tabID] = _createTab(this, head, null);
        //Set as active
        this.activeHead.removeAttribute('checked');
        this.activeHead = head;
        this.activeHead.setAttribute('checked', 'checked');
        //Hash Location change
        _pushHistory(tabID, [tabID, ' loaded']);
        //location.hash = tabID;
    } else { // Just make as active
        this.setActiveTab(head);
    }
}

/**
 * Push new history
 * @param newHash
 * @param label
 * @private
 */
function _pushHistory(newHash, label){
    window.history.pushState(null, label ? label.join(''):'',[location.pathname,'#',newHash].join(''))
}


/**
 * Create new Tab and assign parent for event propagation
 * @param parent
 * @param head
 * @param path
 * @returns {Tab}
 * @private
 */
function _createTab(parent, head, path){
    var t = new Tab(head, path);
    t.setParentEventTarget(parent);
    return t;
}


/**
 * Tab class
 */
export class Tab extends events.EventTarget {
    constructor(head, path){
        super();
        /** Tab **/
        this.forms = [];
        this.children = {};
        this.head = head;
        this.active = null;

        // Tab body
        this.body = document.getElementById(head.getAttribute('id').replace('tab', 'tab-body-'));

        if(path){
            this.preload = new LazyDOM(path, this);
            this.preload.setParentEventTarget(this);
            this.active = this.preload;
        } else {
            _showLoading(this.body);
        }

        //link of body for root child
        this.link = this.body.getAttribute('data-source');
        _processAjaxLink.call(this, this.link, !path);
    }

    /**
     * Generate path of actual position in deep structure -> no need
     * @returns {string}
     */
    getPath(){
        if(_.isNull(this.active) || this.active === this.root){
            return this.head.getAttribute('id');
        }
        return [this.head.getAttribute('id'), this.active.getPath()].join('=');
    }

    /**
     * Set active tab according to provided url hash..
     * @param url
     */
    setActiveByUrl(url){
        var active = _.find(this.children, _.matches({'link':url}));
        if(this.active === active){
            return;
        }
        if(this.active === this.root){
            Dom.classlist.add(this.root, 'display-none');
        } else {
            this.active.hide();
        }
        this.active = active;
        this.active.show();
    }

    /**
     * Set active tab
     * @param tab
     */
    setActive(tab){
        if(this.active === this.root){
            Dom.classlist.add(this.root, 'display-none');
        } else {
            this.active.hide();
        }
        tab.show();
        this.active = tab;
        _pushHistory([location.hash.substring(1), '=', this.active.getPath()].join(''));
    }

    /**
     * Go back in history
     */
    back(){
        window.history.back();
    }

}


/**
 * PRROCES AJAX LINK
 * MOST IMPORTANT - DOWNLOADS CONTENT AND CALL OTHERS
 * @param link
 * @param isActive
 * @param callback
 * @private
 */
function _processAjaxLink(link, isActive, callback){
    isActive = _.isUndefined(isActive) ? true : isActive;
    Gateway.get(link, null, function(data){
        if(typeof data === 'object'){
            if(data.go != undefined){
                _processAjaxLink.call(this, data.go, isActive, callback);
                return;
            }
            throw new Error('Unexpected response: ', data);
        } else {
            var tempDiv = Dom.createDom('div', null, data.trim());
            this.root = tempDiv.children.length === 1 ? tempDiv.children[0] : tempDiv;

            if(!isActive){
                Dom.classlist.add(this.root, 'display-none');
            } else {
                this.active = this.root;
                _hideLoading(this.body);
            }
        }

        this.body.appendChild(this.root);

        _.each(this.root.querySelectorAll('form'), function(form){
            //to be sure, save forms
            this.forms.push(new TrinityForm(form));
        }, this);
        //Ajax links
        _initAjaxLinks.call(this, this.root);

        //Dispatch event
        var domID = this.root.getAttribute('id');
        if(domID){
            this.dispatchEvent(new events.Event(domID, this));
        }

        // IF callback provided
        if(callback) {
            callback.call(this, this.root);
        }

    }.bind(this), function(error){
        //TODO: Refresh button and Error somehow
        console.error(error);
    }.bind(this));
}

var LINK_SELECTOR = '.link';

/**
 * Initialize ajax links (only where is class ".link"
 * @param body
 * @private
 */
function _initAjaxLinks(body){
    var href = this.preload ? this.preload.link : null;
    _.each(body.querySelectorAll(LINK_SELECTOR), function(link, index){
        var id = link.getAttribute('id');
        if(!id || id.length === 0){
            id = [this.head.getAttribute('id'), '-ajaxLink-', index].join('');
            link.setAttribute('id', id);
        }
        if(!_.isNull(href) && href === link.getAttribute('href')){
            this.children[id] = this.preload;
        } else{
            this.children[id] = null;
        }
        //Attach click handler
        events.listen(link, 'click', _handleLinkClick.bind(link, this));
    }, this);
}

function _handleLinkClick(parent, e){
    var link = this;
    var id = link.getAttribute('id');
    if(_.isNull(parent.children[id])){
        parent.children[id] = new LazyDOM(link.getAttribute('href'), parent);
        parent.children[id].setParentEventTarget(parent);
    }
    parent.setActive(parent.children[id]);
}

/**
 * Represents lazy loading dom structure - will be removed?
 */
class LazyDOM extends events.EventTarget {
    constructor(link, parent){
        super();
        /** Lazy DOM **/
        this.children = {};
        this.forms = [];
        this.link = link;
        this.parent = parent;
        this.active = null;
        this.root = null;

        // Create body
        this.body = document.createDom('div');
        _showLoading(this.body);

        parent.body.appendChild(this.body);


        _processAjaxLink.call(this, this.link, true, function(target){
            // Create back button
            var header = target.querySelector('.header-h2');
            var backButton = Dom.createDom('span', {'class': 'tab-back'}, '');
            var icon       = Dom.createDom('i', {'class': 'tiecons tiecons-arrow-bold-long-left font-20'}, '');
            backButton.appendChild(icon);

            header.appendChild(backButton);
            Dom.classlist.add(header, 'padding-left-90');
            events.listen(backButton, 'click', function(e){
                e.preventDefault();
                this.parent.back();
            }.bind(this));
        });
    }
    hide(){
        Dom.classlist.add(this.body,'display-none');
    }

    show(){
        Dom.classlist.remove(this.body, 'display-none');
    }

    getPath() {
        if(_.isNull(this.active) || this.active === this.root){
            return this.link;
        }
        return [this.link, this.active.getPath()].join('=');
    }

    back() {
        window.history.back();
    }

    setActive(tab){
        if(this.active === this.root){
            Dom.classlist.add(this.root, 'display-none');
        } else {
            this.active.hide();
        }
        tab.show();
        this.active = tab;
        _pushHistory([location.hash.substring(1), '=', this.active.getPath()].join(''));
    }
}


function _showLoading(element){
    var loader = element.querySelector('.tab-loader');
    if(_.isNull(loader)){
        var icon = Dom.createDom('i', {'class': 'tiecons tiecons-loading tiecons-rotate font-40'});
        loader = Dom.createDom('div', {'class':'tab-loader'}, icon);
        element.appendChild(loader);
    } else {
        Dom.classlist.remove(loader, 'display-none');
    }

}

function _hideLoading(element){
    var loader = element.querySelector('.tab-loader');
    if(loader){
        Dom.classlist.add(loader, 'display-none');
    }
}