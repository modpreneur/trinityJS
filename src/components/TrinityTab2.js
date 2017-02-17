'use strict';

import _ from 'lodash';
import {EventEmitter} from 'fbemitter';
import Tab from './Tab';


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


        //Check which tab to load first
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
        this.__activeTabName = activeHead.id;
        // Add new Tab to tabs
        this.tabs[activeHead.id] = new Tab(activeHead, this);

        /** Attach click event Listeners to other heads **/
        this.attachHeadClickEvents();

        // Navigation
        window.addEventListener('popstate', __handleNavigation.bind(this));
    }

    attachHeadClickEvents(){
        _.each(this.heads, (head) => {
            head.addEventListener('click', this.setActiveTab.bind(this, head.id));
        });
    }

    /**
     * Set active Tab by provided tabID
     * @param tabName {string}
     * @throws {Error} if tab with provided ID does't exit
     * @public
     */
    setActiveTab(tabName) {
        tabName = tabName ? (this.aliasIdPairs.alToId[tabName] || tabName) : this.heads[0].id;

        // If undefined -> Create and Set as Active
        if (!this.tabs[tabName]) {
            let head = _.find(this.heads, el => el.id === tabName);
            if (!head) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Tab with id or alias: ' + tabName + ' does not exist!');
                }
                return false;
            }
            this.tabs[tabName] = new Tab(head, this);
        }

        if (tabName === this.__activeTabName) {
            return;
        }
        let prevTab = this.__activeTabName;
        this.__prevTabName = prevTab;

        this.__activeTabName = tabName;
        this.tabs[prevTab].head.removeAttribute('checked');
        this.tabs[prevTab].head.checked = false;
        this.tabs[tabName].head.setAttribute('checked', 'checked');
        this.tabs[tabName].head.checked = true;

        //Update Hash URL
        __pushHistory(this.aliasIdPairs.idToAl[tabName] || tabName);

        // Emit only when not loading yet
        if(!this.tabs[tabName].isLoading){
            this.__emitTabChanged();
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
     * @param tabName {string || Array<string>}
     */
    reload(tabName) {
        tabName = this.aliasIdPairs.alToId[tabName] || tabName;
        let __reload = name => {
            let tab = this.tabs[name];
            if (tab) {
                tab.reloadContent();
            }
        };
        if (!_.isArray(tabName)) {
            __reload(tabName);
        } else {
            _.each(tabName, name => {
                __reload(name);
            });
        }
    }


    /**
     * Reload content of all tabs
     */
    reloadAll() {
        _.each(this.tabs, (t) => {
            t.reloadContent();
        });
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


    __emitTabChanged(){
        // Emit change
        this.emit('tab-changed', {
            previous: this.__prevTabName,
            id: this.__activeTabName,
            alias: this.aliasIdPairs.idToAl[this.__activeTabName],
            tab: this.tabs[this.__activeTabName]
        });
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


