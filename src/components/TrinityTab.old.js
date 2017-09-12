'use strict';

import _ from 'lodash';
import Dom from  'trinity/utils/Dom';
import {EventEmitter} from 'fbemitter';
import Gateway from 'trinity/Gateway';
import Events from 'trinity/utils/Events';

const MAX_TRY = 3;

/**
 * Trinity Tab
 */
export default class TrinityTab extends EventEmitter {
    /**
     * Heads of tab component
     * @param [tabHeads] {Array<HTMLElement>}
     */
    constructor(tabHeads) {
        tabHeads = tabHeads || document.querySelectorAll('.tab-head');
        if (tabHeads.length < 1) {
            throw new Error('No "tabHeads" provided or elements with "tab-head" class not found!');
        }
        super();
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
            head.addEventListener('click', __handleTabClick.bind(this, head));
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
            this.emitTabChanged();
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
        _.each(this.tabs, t => {
            t.reloadContent();
        });
    }

    onLoad(tabID, callback, context) {
        this.addListener(tabID, callback, context);
    }

    emitTabChanged(){
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
 * Handles click event on Tab
 * @param head {HTMLElement}
 * @private
 */
function __handleTabClick(head) {
    this.setActiveTab(head.getAttribute('id'));
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


/**
 * Tab class
 */
class Tab {
    constructor(head, parent) {
        this.alias = head.alias;
        this.id = head.id;
        this.head = head;
        this.parent = parent;
        this.root = null;
        this.isLoading = false;
        // this.forms = []; --never used

        // Tab body
        this.bodyElement = document.getElementById(head.id.replace('tab', 'tab-body-'));

        __showLoading(this.bodyElement);

        //link of body for root child
        this.dataSource = this.bodyElement.getAttribute('data-source');
        this.loadContent();
    }

    loadContent() {
        __requestWidget(this.dataSource, this, null);
    }

    reloadContent() {
        __showLoading(this.bodyElement);
        this.parent.emit('tab-unload', {
            id: this.id,
            alias: this.alias,
            tab: this,
            element: this.bodyElement
        });
        Dom.removeNode(this.root);
        __requestWidget(this.dataSource, this, null);
    }
}

function __requestWidget(link, tab, timeout_i, callback) {
    if (!tab.isLoading) {
        tab.isLoading = true;
        Gateway.get(link, null, res => {
            if (res.type !== 'text/html') {
                throw new Error('Unexpected response!: ', res);
            }
            let data = res.text,
                tmpDiv = Dom.createDom('div', null, data.trim());

            tab.root = tmpDiv.children.length === 1 ? tmpDiv.children[0] : tmpDiv;

            __hideLoading(tab.bodyElement);
            tab.bodyElement.appendChild(tab.root);

            // Dispatch global event
            // tab doesn't inherit from EventEmitter class, but his parent does

            tab.parent.emit('tab-load', {
                id: tab.id,
                alias: tab.alias,
                tab: tab,
                element: tab.bodyElement
            });

            // Dispatch tabID-specific event
            tab.parent.emit(tab.name, {
                tab: tab,
                element: tab.bodyElement
            });

            // emit info about change
            tab.parent.emitTabChanged();

            // If id has any content then emit another event
            let contentID = tab.root.id;
            if (contentID) {
                tab.parent.emit(contentID, {
                    tab: tab,
                    element: tab.bodyElement
                });
            }
            // IF callback provided
            if (callback) {
                callback.call(tab, this.bodyElement);
            }
            tab.isLoading = false;
        }, error => {
            if (error.timeout) {
                if (timeout_i && timeout_i === MAX_TRY) {
                    // TODO: Logger service?
                    console.error('Call for maintenance');
                    tab.parent.emit('error', {message: 'REQUEST TIMED OUT', timeout: true});
                    __tabNotLoaded(link, tab);
                } else {
                    console.warn('Request timed out, trying again in 2 sec');
                    let id = setTimeout(() => {
                        __requestWidget(link, tab, (timeout_i + 1) || 1);
                        clearTimeout(id);
                    }, 2000);
                }
            } else {
                console.error(error);
                tab.parent.emit('error', error);
                __tabNotLoaded(link, tab);
            }
            tab.isLoading = false;
        });
    }
}

function __tabNotLoaded(link, tab) {
    let wrapper = document.createElement('div'),
        button = document.createElement('input');
    button.type = 'submit';
    button.className = 'button button-primary trinityJS-reload-tab-button';
    button.value = 'Reload';

    wrapper.innerHTML = '<p class="trinityJS-reload-tab-text">We are sorry, something went wrong. Please reload this tab. If the problem persist, contact us.</p>';
    wrapper.className = 'trinityJS-reload-tab';
    wrapper.appendChild(button);


    __hideLoading(tab.bodyElement);
    tab.bodyElement.appendChild(wrapper);
    Events.listenOnce(button, 'click', () => {
        tab.bodyElement.removeChild(wrapper);
        __showLoading(tab.bodyElement);
        __requestWidget(link, tab, null);
    });
}

/**
 * TODO: loading icon to settings
 * TODO: Loading icon (whole content) should be variable from outside, not strictly defined as it is now
 */
function __showLoading(element) {
    let loader = element.querySelector('.trinity-tab-loader');
    if (_.isNull(loader)) {
        loader = Dom.createDom('div', {'class': 'trinity-tab-loader tab-loader'});
        element.appendChild(loader);
    } else {
        Dom.classlist.remove(loader, 'display-none');
    }
}

function __hideLoading(element) {
    let loader = element.querySelector('.trinity-tab-loader');
    if (loader) {
        Dom.classlist.add(loader, 'display-none');
    }
}