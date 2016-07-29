'use strict';

import _ from 'lodash';
import Dom from '../utils/Dom';
import {EventEmitter} from 'fbemitter';
import Gateway from '../Gateway';

const MAX_TRY = 3;

/**
 * Trinity Tab
 */
export default class TrinityTab extends EventEmitter {
    /**
     * Heads of tab component
     * @param [tabHeads] {Array<HTMLElement>}
     */
    constructor(tabHeads){
        tabHeads = tabHeads || document.querySelectorAll('.tab-head');
        if(tabHeads.length < 1){
            throw new Error('No "tabHeads" provided or elements with "tab-head" class not found!');
        }
        super();
        this.heads = tabHeads;
        this.tabs = {};
        this.__activeTabID = null;
        _initialize.call(this);
    }

    /**
     * Set active Tab by provided tabID
     * @param tabID {string}
     * @throws {Error} if tab with provided ID does't exit
     * @public
     */
    setActiveTab(tabID){
        if(!this.tabs.hasOwnProperty(tabID)){
            if(process.env.NODE_ENV !== 'production'){
                throw new Error('Tab with id: '+ tabID + ' does not exist!');
            }
            // Do nothing
            return;
        }
        if(tabID === this.__activeTabID){
            return;
        }
        let prevTab = this.__activeTabID;
        this.__activeTabID = tabID;
        this.tabs[prevTab].head.removeAttribute('checked');
        this.tabs[prevTab].head.checked = false;
        this.tabs[tabID].head.setAttribute('checked', 'checked');
        this.tabs[tabID].head.checked = true;

        //Update Hash URL
        __pushHistory(tabID);

        // Emit change
        this.emit('tab-changed', {
            previous: prevTab,
            id: tabID,
            tab: this.tabs[tabID]
        });
    }

    /**
     * Returns active tab
     * @NOTE: may return NULL if active tab still processing
     * @public
     * @returns {Tab}
     */
    getActiveTab(){
        return this.tabs[this.__activeTabID];
    }

    /**
     * Reloads content of tab
     * @param tabID {string || Array<string>}
     */
    reload(tabID){
        if(!_.isArray(tabID)){
            let tab = _.find(this.tabs, (t)=>{
                return t.id === tabID;
            });
            if(tab){
                tab.reloadContent();
            }
        } else {
            _.each(this.tabs, (t)=>{
                if(tabID.indexOf(t.id) !== -1){
                    t.reloadContent();
                }
            });
        }
    }

    /**
     * Reload content of all tabs
     */
    reloadAll(){
        _.each(this.tabs, (t)=>{
            t.reloadContent();
        });
    }

    onLoad(tabID, callback, context){
        this.addListener(tabID, callback, context);
    }

}

/**
 * Initialize TrinityTab wrapper
 * @private
 */
function _initialize(){
    //Check which tab to load first
    let tabID = location.hash.substring(1),
        activeHead = null;

    if(tabID.length > 0){
        activeHead = document.getElementById(tabID);
        activeHead.setAttribute('checked', 'checked');
    } else {
        activeHead = _.find(this.heads, (tab)=>{
            let checked = false;
            if(_.isUndefined(tab.checked)){
                checked = !_.isNull(tab.getAttribute('checked'));
            } else {
                checked = tab.checked;
            }
            return checked;
        });
        if(!activeHead){
            activeHead = this.heads[0];
        }
        tabID = activeHead.getAttribute('id');
        // Replace history string
        window.history.replaceState(null, tabID, '#'+tabID);
    }
    this.__activeTabID = tabID;
    // Add new Tab to tabs
    this.tabs[tabID] = new Tab(activeHead, this);

    /** Attach click event Listeners to other heads **/
    _.map(this.heads, (head)=>{
        head.addEventListener('click', __handleTabClick.bind(this, head));
    });

    // Navigation
    window.addEventListener('popstate', __handleNavigation.bind(this));
}

/**
 * Handles pop state navigation
 * @private
 */
function __handleNavigation(){
    let tabID = location.hash.substring(1);
    if(tabID.length > 0) {
        this.setActiveTab(tabID);
    }
}

/**
 * Handles click event on Tab
 * @param head {HTMLElement}
 * @param [e] {Event}
 * @private
 */
function __handleTabClick(head, e){
    let tabID = head.getAttribute('id');
    // If undefined -> Create and Set as Active
    if(_.isUndefined(this.tabs[tabID])) {
        this.tabs[tabID] = new Tab(head, this);
    }
    this.setActiveTab(tabID);
}

/**
 * Push new history
 * @param newHash
 * @private
 */
function __pushHistory(newHash){
    if(newHash !== window.location.hash.substring(1)){
        window.history.pushState(null, newHash, '#'+newHash);
    }
}



/**
 * Tab class
 */
export class Tab {
    constructor(head, parent){
        this.id = head.getAttribute('id');
        this.head = head;
        this.parent = parent;
        this.root = null;
        this.forms = [];

        // Tab body
        this.bodyElement = document.getElementById(this.id.replace('tab', 'tab-body-'));

        __showLoading(this.bodyElement);

        //link of body for root child
        this.dataSource = this.bodyElement.getAttribute('data-source');
        this.loadContent();
    }

    loadContent(){
        __requestWidget(this.dataSource, this, null);
    }

    reloadContent(){
        __showLoading(this.bodyElement);
        this.parent.emit('tab-unload', {
            id: this.id,
            tab: this,
            element: this.bodyElement
        });
        Dom.removeNode(this.root);
        __requestWidget(this.dataSource, this, null);
    }
}

function __requestWidget(link, tab, timeout_i, callback){
    Gateway.get(link, null, function(res){
        if(res.type !== 'text/html'){
            throw new Error('Unexpected response!: ', res);
        }
        let data = res.text;

        let tmpDiv =  Dom.createDom('div', null, data.trim());
        tab.root = tmpDiv.children.length === 1 ? tmpDiv.children[0] : tmpDiv;

        __hideLoading(tab.bodyElement);
        tab.bodyElement.appendChild(tab.root);

        // Dispatch global event
        // tab doesn't inherit from EventEmitter class, but his parent does

        tab.parent.emit('tab-load', {
            id: tab.id,
            tab: tab,
            element: tab.bodyElement
        });

        // Dispatch tabID-specific event
        tab.parent.emit(tab.id, {
            tab: tab,
            element: tab.bodyElement
        });

        // If id has any content then emit another event
        let contentID = tab.root.getAttribute('id');
        if(contentID){
            tab.parent.emit(contentID, {
                tab: tab,
                element: tab.bodyElement
            });
        }
        // IF callback provided
        if(callback) {
            callback.call(tab, this.bodyElement);
        }
    }, function(error){
        if(error.timeout){
            if(timeout_i && timeout_i === MAX_TRY){
                // TODO: Logger service?
                console.error('Call for maintenance');
                tab.parent.emit('error', {message: 'REQUEST TIMED OUT', timeout:true});
            } else {
                console.warn('Request timed out, trying again in 2 sec');
                let id = setTimeout(()=>{
                    __requestWidget(link, tab, (timeout_i+1) || 1);
                    clearTimeout(id);
                }, 2000);
            }
        } else {
            console.error(error);
            tab.parent.emit('error', error);
        }
    });
}

//TODO: loading icon to settings
function __showLoading(element){
    let loader = element.querySelector('.trinity-tab-loader');
    if(_.isNull(loader)){
        let icon = Dom.createDom('i', {'class': 'tiecons tiecons-loading tiecons-rotate font-40'});
        loader = Dom.createDom('div', {'class':'trinity-tab-loader tab-loader'}, icon);
        element.appendChild(loader);
    } else {
        Dom.classlist.remove(loader, 'display-none');
    }
}

function __hideLoading(element){
    let loader = element.querySelector('.trinity-tab-loader');
    if(loader){
        Dom.classlist.add(loader, 'display-none');
    }
}