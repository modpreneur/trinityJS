'use strict';

import _ from 'lodash';
import Dom from '../utils/Dom';
import Gateway from '../Gateway';
import Events from '../utils/Events';

const MAX_TRY = 3;

/**
 * Tab class
 */
export default class Tab {
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
            tab.parent.__emitTabChanged();

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
        let icon = Dom.createDom('i', {'class': 'tiecons tiecons-loading tiecons-rotate font-40'});
        loader = Dom.createDom('div', {'class': 'trinity-tab-loader tab-loader'}, icon);
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