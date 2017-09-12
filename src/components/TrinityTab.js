'use strict';

import _ from 'lodash';
import {EventEmitter} from 'fbemitter';
import Tab from './Tab';
import Events from '../utils/Events';

/**
 * Event name constants
 * @type {string}
 */
const TAB_LOAD = 'tab-load',
    TAB_CHANGED = 'tab-changed',
    TAB_UNLOAD = 'tab-unload';

/**
 * Trinity Tab
 */
export default class TrinityTab extends EventEmitter {
    /**
     * Heads of tab component
     * @param [tabHeads] {Array<HTMLElement>}
     * @param [configuration] {object}
     */
    constructor(tabHeads, configuration) {
        tabHeads = tabHeads || document.querySelectorAll('.tab-head');
        if (tabHeads.length < 1) {
            throw new Error('No "tabHeads" provided or elements with "tab-head" class not found!');
        }
        super();
        this.configuration = configuration || {};
        this.heads = tabHeads;
        this.aliasIdPairs = {alToId: {}, idToAl: {}};
        // find heads with aliases
        _.each(tabHeads, head => {
            head.alias = head.getAttribute('data-alias'); // sets custom attribute, for not having to use getAttribute anny later
            if (head.alias) {
                this.aliasIdPairs.alToId[head.alias] = head.id;
                this.aliasIdPairs.idToAl[head.id] = head.alias;
            }
        });

        this.tabs = {};
        this.__activeTabName = null;
        this.__prevTabName = null;

        // Create tabs
        _.each(tabHeads, head => {
            this.tabs[head.id] = new Tab(head);
            // If no config is provided, try look also for _other
            this.configuration[head.id] = _.extend({}, this.configuration['_default'], this.configuration[head.id]);
        });

        // Find active Head
        // Check which tab to load first
        let tabName = location.hash.substring(1),
            activeHead = null;

        if (tabName.length > 0) {
            if (this.aliasIdPairs.alToId[tabName]) {
                let tabId = this.aliasIdPairs.alToId[tabName];
                activeHead = _.find(this.heads, head => head.id === tabId);
            } else {
                activeHead = _.find(this.heads, head => head.id === tabName);
                if (activeHead && activeHead.alias) { // if head have alias, replace hash and tabName to it
                    tabName = activeHead.alias;
                    window.location.hash = `#${activeHead.alias}`;
                }
            }
        }

        if (activeHead) {
            activeHead.setAttribute('checked', 'checked'); //sets head from url as active
        } else {
            activeHead = _.find(this.heads, (tab) => {
                let checked = false;
                if (_.isUndefined(tab.checked)) {
                    checked = !_.isNull(tab.getAttribute('checked'));
                } else {
                    checked = tab.checked;
                }
                return checked;
            });
            if (!activeHead) {
                activeHead = this.heads[0];
            }
            tabName = activeHead.alias || activeHead.id;
            // Replace history string
            window.history.replaceState(null, tabName, '#' + tabName);
        }
        // Got active head
        this.__activeTabName = activeHead.id;

        // Request content for active tab
        this.tabs[activeHead.id].loadContent(this.__onTabLoad.bind(this));

        /** Attach click event Listeners to other heads **/
        this.__listeners = this.__attachHeadClickEvents();

        // Navigation
        window.addEventListener('popstate', __handleNavigation.bind(this));
    }

    /**
     * Attach onClick events to tab heads
     * @returns Array<function> - unlisteners
     * @private
     */
    __attachHeadClickEvents(){
        return _.map(this.heads, head => Events.listen(head, 'click', this.setActiveTab.bind(this, head.id)));
    }

    /**
     * Private callback, called when tab is loaded
     * @param err {object} can be null
     * @param tab {Tab} object
     * @private
     */
    __onTabLoad(err, tab){
        if(err) {
            this.emit('error', err);
            return;
        }
        let tabId = tab.id;

        // No error
        // Call onLoad callback if set
        let onLoadCallback = this.configuration[tabId].onLoad;
        if(_.isFunction(onLoadCallback)){
            onLoadCallback(tab);
        }
        // Emit event
        this.emit(TAB_LOAD, tab);

        // if loaded tab is also active tab -> call Active callbacks
        if(tabId === this.__activeTabName){
            // On Active callback
            let onActiveCallback = this.configuration[tabId].onActive;
            if(_.isFunction(onActiveCallback)){
                onActiveCallback(tab, this.__prevTabName);
            }
            // Emit event
            this.emit(TAB_CHANGED, tab, this.__prevTabName);
        }
    }

    /**
     * Set active Tab by provided tabID
     * @param tabId {string}
     * @throws {Error} if tab with provided ID does't exit
     * @public
     */
    setActiveTab(tabId) {
        tabId = tabId ? (this.aliasIdPairs.alToId[tabId] || tabId) : this.heads[0].id;

        let tab = this.tabs[tabId];
        if(!tab){
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('Tab with id or alias: ' + tabId + ' does not exist!');
            }
            return false;
        }

        if(tab.failed) return;

        // If not loaded -> Load it
        if (!tab.loaded) {
            tab.loadContent(this.__onTabLoad.bind(this));
        }

        if (tabId === this.__activeTabName) {
            return;
        }
        this.__prevTabName = this.__activeTabName;
        this.__activeTabName = tabId;

        // Select prevTab instance
        let prevTab = this.tabs[this.__prevTabName];

        // Switch checked attribute
        prevTab.head.removeAttribute('checked');
        prevTab.head.checked = false;
        tab.head.setAttribute('checked', 'checked');
        tab.head.checked = true;

        //Update Hash URL
        __pushHistory(tab.alias || tabId);

        // Emit only when is already fetched
        if(!tab.isFetching){
            // On Active callback
            let onActiveCallback = this.configuration[tabId].onActive;
            if(_.isFunction(onActiveCallback)){
                onActiveCallback(tab, this.__prevTabName);
            }
            // Emit event
            this.emit(TAB_CHANGED, tab, this.__prevTabName);
        }
    }

    /**
     * Returns active tab
     * @NOTE: may return NULL if active tab still processing
     * @public
     * @returns {Tab}
     */
    getActiveTab() {
        return this.tabs[this.__activeTabName];
    }

    /**
     * Reloads content of tab
     * @param tabId {string || Array<string>}
     */
    reload(tabId) {
        let tabs = [].concat(tabId);
        _.each(tabs, (tmpTabId) => {
            let tab  = this.tabs[(this.aliasIdPairs.alToId[tmpTabId] || tmpTabId)];
            if(tab){
                this.__reloadTab(tab);
            }
        });
    }


    /**
     * Reload content of all tabs
     */
    reloadAll() {
        _.each(this.tabs, (tab) => this.__reloadTab(tab));
    }

    /**
     * Destroy all tabs and unload trinityTab so it can be garbage collected,
     * Also emits tab-unload event and calls delete callback, but cannot be prevented
     */
    destroy(){
        // unload listeners
        _.each(this.__listeners, f => f());
        // Delete tabs
        _.each(this.tabs, (tab) => {
            // life cycle hook
            let onDeleteCallback = this.configuration[tab.id].onDelete;
            _.isFunction(onDeleteCallback) && onDeleteCallback(tab, true);

            // global event
            this.emit(TAB_UNLOAD, tab, true);

            // call destroy to Tab
            tab.destroy();
        });
    }

    /**
     * Emits "tab-unload" event and call callback onDelete function
     * If callback returns false, then do not reload content
     * This is inner function, should not be called from outside
     * @param tab {Tab}
     * @private
     */
    __reloadTab(tab) {
        // reload only if there is what to reload
        if(tab.loaded){
            let callbackFunction = this.configuration[tab.id].onDelete;
            if(_.isFunction(callbackFunction) && callbackFunction(tab, false) === false){
                return;
            }
            this.emit(TAB_UNLOAD, tab);
            tab.reloadContent(this.__onTabLoad.bind(this));
        }
    }

    /**
     * @deprecated
     * @param tabID
     * @param callback
     * @param context
     */
    onLoad(tabID, callback, context) {
        this.addListener(tabID, callback, context);
    }
}

/**
 * Handles pop state navigation
 * @private
 */
function __handleNavigation() {
    let tabName = location.hash.substring(1);
    if (tabName.length > 0) {
        this.setActiveTab(tabName);
    }
}

/**
 * Push new history
 * @param newHash
 * @private
 */
function __pushHistory(newHash) {
    if (newHash !== window.location.hash.substring(1)) {
        window.history.pushState(null, newHash, '#' + newHash);
    }
}


