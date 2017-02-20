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
    constructor(head) {
        this.alias = head.alias;
        this.id = head.id;
        this.head = head;
        this.root = null;
        this.loaded = false;
        this.isFetching = false;

        // Tab body
        this.body = document.getElementById(head.id.replace('tab', 'tab-body-'));

        //link of body for root child
        this.sourceUrl = this.body.getAttribute('data-source');
    }

    /**
     * Removes actual content from Dom and repeat request
     * @note its crucial to remove all event listeners from Dom which will be remove before calling function
     * otherwise it can cause memory leak, especially if you are using jQuery event system
     * @param callback [function]
     */
    reloadContent(callback) {
        this.destroy();
        this.loadContent(callback);
    }

    /**
     * Loads content of Tab
     * @param callback [function]
     */
    loadContent(callback) {
        if(!this.isFetching){
            this.__requestWidget(this.sourceUrl, callback);
        }
    }

    /**
     * Remove content of tab from DOM
     */
    destroy(){
        Dom.removeNode(this.root);
    }

    /**
     * Sends request for content html and attach it to Dom
     * @param url {string}
     * @param callback [function]
     * @param numTry [number]
     * @private
     */
    __requestWidget(url, callback, numTry = 0){
        this.isFetching = true;
        __showLoading(this.body);

        Gateway.get(url, null, res => {
            if (res.type !== 'text/html') {
                this.isFetching = false; // To be sure it will work after error
                throw new Error('Unexpected response!: ', res);
            }

            let data = res.text,
                tmpDiv = Dom.createDom('div', null, data.trim());

            // It can be more elements, not wrapped in root div, so we have to wrap them
            this.root = tmpDiv.children.length === 1 ? tmpDiv.children[0] : tmpDiv;

            // hide loading icon and append new HTML to body
            __hideLoading(this.body);
            this.body.appendChild(this.root);

            // set flags
            this.isFetching = false;
            this.loaded = true;
            // Success
            callback(null, this);
        }, error => {
            if (error.timeout) {
                if (numTry && numTry === MAX_TRY) {
                    // TODO: Logger service?
                    console.error('Call for maintenance');
                    this.isFetching = false;
                    __tabNotLoaded(this, callback);
                    callback({timeout: true, message: 'Request timed out'});
                } else {
                    console.warn('Request timed out, trying again in 2 sec');
                    let id = setTimeout(() => {
                        this.__requestWidget(url, callback, (numTry + 1));
                        clearTimeout(id);
                    }, 2000);
                }
            } else {
                console.error(error);
                this.isFetching = false;
                __tabNotLoaded(this, callback);
                callback(error);
            }
        });
    }
}

/**
 * Temporary solution for Error-like page
 * @param tab {Tab}
 * @param callback [function]
 * @private
 */
function __tabNotLoaded(tab, callback) {
    let wrapper = document.createElement('div'),
        button = document.createElement('input');
    button.type = 'submit';
    button.className = 'button button-primary trinityJS-reload-tab-button';
    button.value = 'Reload';

    wrapper.innerHTML = '<p class="trinityJS-reload-tab-text">We are sorry, something went wrong. Please reload this tab. If the problem persist, contact us.</p>';
    wrapper.className = 'trinityJS-reload-tab';
    wrapper.appendChild(button);


    __hideLoading(tab.body);
    tab.body.appendChild(wrapper);
    Events.listenOnce(button, 'click', () => {
        tab.body.removeChild(wrapper);
        __showLoading(tab.body);
        tab.__requestWidget(tab.sourceUrl, callback);
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