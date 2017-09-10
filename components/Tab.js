'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _isNull2 = require('lodash/isNull');

var _isNull3 = _interopRequireDefault(_isNull2);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Dom = require('../utils/Dom');

var _Dom2 = _interopRequireDefault(_Dom);

var _Gateway = require('../Gateway');

var _Gateway2 = _interopRequireDefault(_Gateway);

var _Events = require('../utils/Events');

var _Events2 = _interopRequireDefault(_Events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MAX_TRY = 3;

/**
 * Tab class
 */

var Tab = function () {
    function Tab(head) {
        _classCallCheck(this, Tab);

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


    _createClass(Tab, [{
        key: 'reloadContent',
        value: function reloadContent(callback) {
            this.destroy();
            this.loadContent(callback);
        }

        /**
         * Loads content of Tab
         * @param callback [function]
         */

    }, {
        key: 'loadContent',
        value: function loadContent(callback) {
            if (!this.isFetching) {
                this.__requestWidget(this.sourceUrl, callback);
            }
        }

        /**
         * Remove content of tab from DOM
         */

    }, {
        key: 'destroy',
        value: function destroy() {
            _Dom2.default.removeNode(this.root);
        }

        /**
         * Sends request for content html and attach it to Dom
         * @param url {string}
         * @param callback [function]
         * @param numTry [number]
         * @private
         */

    }, {
        key: '__requestWidget',
        value: function __requestWidget(url, callback) {
            var _this = this;

            var numTry = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

            this.isFetching = true;
            __showLoading(this.body);

            _Gateway2.default.get(url, null, function (res) {
                if (res.type !== 'text/html') {
                    _this.isFetching = false; // To be sure it will work after error
                    throw new Error('Unexpected response!: ', res);
                }

                var data = res.text,
                    tmpDiv = _Dom2.default.createDom('div', null, data.trim());

                // It can be more elements, not wrapped in root div, so we have to wrap them
                _this.root = tmpDiv.children.length === 1 ? tmpDiv.children[0] : tmpDiv;

                // hide loading icon and append new HTML to body
                __hideLoading(_this.body);
                _this.body.appendChild(_this.root);

                // set flags
                _this.isFetching = false;
                _this.loaded = true;
                // Success
                callback(null, _this);
            }, function (error) {
                if (error.timeout) {
                    if (numTry && numTry === MAX_TRY) {
                        // TODO: Logger service?
                        console.error('Call for maintenance');
                        _this.isFetching = false;
                        __tabNotLoaded(_this, callback);
                        callback({ timeout: true, message: 'Request timed out' });
                    } else {
                        console.warn('Request timed out, trying again in 2 sec');
                        var id = setTimeout(function () {
                            _this.__requestWidget(url, callback, numTry + 1);
                            clearTimeout(id);
                        }, 2000);
                    }
                } else {
                    console.error(error);
                    _this.isFetching = false;
                    __tabNotLoaded(_this, callback);
                    callback(error);
                }
            });
        }
    }]);

    return Tab;
}();

/**
 * Temporary solution for Error-like page
 * @param tab {Tab}
 * @param callback [function]
 * @private
 */


exports.default = Tab;
function __tabNotLoaded(tab, callback) {
    var wrapper = document.createElement('div'),
        button = document.createElement('input');
    button.type = 'submit';
    button.className = 'button button-primary trinityJS-reload-tab-button';
    button.value = 'Reload';

    wrapper.innerHTML = '<p class="trinityJS-reload-tab-text">We are sorry, something went wrong. Please reload this tab. If the problem persist, contact us.</p>';
    wrapper.className = 'trinityJS-reload-tab';
    wrapper.appendChild(button);

    __hideLoading(tab.body);
    tab.body.appendChild(wrapper);
    _Events2.default.listenOnce(button, 'click', function () {
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
    var loader = element.querySelector('.trinity-tab-loader');
    if ((0, _isNull3.default)(loader)) {
        var icon = _Dom2.default.createDom('i', { 'class': 'tiecons tiecons-loading tiecons-rotate font-40' });
        loader = _Dom2.default.createDom('div', { 'class': 'trinity-tab-loader tab-loader' }, icon);
        element.appendChild(loader);
    } else {
        _Dom2.default.classlist.remove(loader, 'display-none');
    }
}

function __hideLoading(element) {
    var loader = element.querySelector('.trinity-tab-loader');
    if (loader) {
        _Dom2.default.classlist.add(loader, 'display-none');
    }
}