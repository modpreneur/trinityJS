'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Dom = require('trinity/utils/Dom');

var _Dom2 = _interopRequireDefault(_Dom);

var _fbemitter = require('fbemitter');

var _Gateway = require('trinity/Gateway');

var _Gateway2 = _interopRequireDefault(_Gateway);

var _Events = require('trinity/utils/Events');

var _Events2 = _interopRequireDefault(_Events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MAX_TRY = 3;

/**
 * Trinity Tab
 */

var TrinityTab = function (_EventEmitter) {
    _inherits(TrinityTab, _EventEmitter);

    /**
     * Heads of tab component
     * @param [tabHeads] {Array<HTMLElement>}
     */
    function TrinityTab(tabHeads) {
        _classCallCheck(this, TrinityTab);

        tabHeads = tabHeads || document.querySelectorAll('.tab-head');
        if (tabHeads.length < 1) {
            throw new Error('No "tabHeads" provided or elements with "tab-head" class not found!');
        }

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TrinityTab).call(this));

        _this.heads = tabHeads;
        _this.aliases = {};
        // find heads with aliases
        _lodash2.default.each(tabHeads, function (head) {
            head.alias = head.getAttribute('data-alias'); // sets custom attribute, for not having to use getAttribute anny later
            if (head.alias) {
                _this.aliases[head.alias] = head;
            }
        });

        _this.tabs = {};
        _this.__activeTabName = null;

        //Check which tab to load first
        var tabName = location.hash.substring(1),
            activeHead = null;

        if (tabName.length > 0) {
            if (_this.aliases[tabName]) {
                activeHead = _this.aliases[tabName];
            } else {
                activeHead = _lodash2.default.find(_this.heads, function (head) {
                    return head.id === tabName;
                });
                if (activeHead.alias) {
                    // if head have alias, replace hash and tabName to it
                    tabName = activeHead.alias;
                    window.location.hash = '#' + activeHead.alias;
                }
            }
        }

        if (activeHead) {
            activeHead.setAttribute('checked', 'checked'); //sets head from url as active
        } else {
            activeHead = _lodash2.default.find(_this.heads, function (tab) {
                var checked = false;
                if (_lodash2.default.isUndefined(tab.checked)) {
                    checked = !_lodash2.default.isNull(tab.getAttribute('checked'));
                } else {
                    checked = tab.checked;
                }
                return checked;
            });
            if (!activeHead) {
                activeHead = _this.heads[0];
            }
            tabName = activeHead.alias || activeHead.id;
            // Replace history string
            window.history.replaceState(null, tabName, '#' + tabName);
        }
        _this.__activeTabName = tabName;
        // Add new Tab to tabs
        _this.tabs[tabName] = new Tab(activeHead, _this);

        /** Attach click event Listeners to other heads **/
        _lodash2.default.map(_this.heads, function (head) {
            head.addEventListener('click', __handleTabClick.bind(_this, head));
        });

        // Navigation
        window.addEventListener('popstate', __handleNavigation.bind(_this));
        return _this;
    }

    /**
     * Set active Tab by provided tabID
     * @param tabName {string}
     * @throws {Error} if tab with provided ID does't exit
     * @public
     */


    _createClass(TrinityTab, [{
        key: 'setActiveTab',
        value: function setActiveTab(tabName) {
            tabName = tabName || this.heads[0].alias || this.heads[0].id;
            // If undefined -> Create and Set as Active
            if (!this.tabs[tabName]) {
                var head = this.aliases[tabName] || _lodash2.default.find(this.heads, function (el) {
                    return el.id === tabName;
                });
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
            var prevTab = this.__activeTabName;

            this.__activeTabName = tabName;
            this.tabs[prevTab].head.removeAttribute('checked');
            this.tabs[prevTab].head.checked = false;
            this.tabs[tabName].head.setAttribute('checked', 'checked');
            this.tabs[tabName].head.checked = true;

            //Update Hash URL
            __pushHistory(tabName);

            // Emit change
            this.emit('tab-changed', {
                previous: prevTab,
                id: tabName,
                tab: this.tabs[tabName]
            });
        }

        /**
         * Returns active tab
         * @NOTE: may return NULL if active tab still processing
         * @public
         * @returns {Tab}
         */

    }, {
        key: 'getActiveTab',
        value: function getActiveTab() {
            return this.tabs[this.__activeTabName];
        }

        /**
         * Reloads content of tab
         * @param tabName {string || Array<string>}
         */

    }, {
        key: 'reload',
        value: function reload(tabName) {
            var _this2 = this;

            if (!_lodash2.default.isArray(tabName)) {
                var tab = this.aliases[tabName] || _lodash2.default.find(this.tabs, function (t) {
                    return t.id === tabName;
                });
                if (tab) {
                    tab.reloadContent();
                }
            } else {
                _lodash2.default.each(this.tabs, function (t) {
                    if (_this2.aliases[tabName] || ~tabName.indexOf(t.id)) {
                        t.reloadContent();
                    }
                });
            }
        }

        /**
         * Reload content of all tabs
         */

    }, {
        key: 'reloadAll',
        value: function reloadAll() {
            _lodash2.default.each(this.tabs, function (t) {
                t.reloadContent();
            });
        }
    }, {
        key: 'onLoad',
        value: function onLoad(tabID, callback, context) {
            this.addListener(tabID, callback, context);
        }
    }]);

    return TrinityTab;
}(_fbemitter.EventEmitter);

/**
 * Handles pop state navigation
 * @private
 */


exports.default = TrinityTab;
function __handleNavigation() {
    var tabName = location.hash.substring(1);
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
    this.setActiveTab(head.alias || head.getAttribute('id'));
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

var Tab = function () {
    function Tab(head, parent) {
        _classCallCheck(this, Tab);

        this.name = head.alias || head.id;
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

    _createClass(Tab, [{
        key: 'loadContent',
        value: function loadContent() {
            __requestWidget(this.dataSource, this, null);
        }
    }, {
        key: 'reloadContent',
        value: function reloadContent() {
            __showLoading(this.bodyElement);
            this.parent.emit('tab-unload', {
                id: this.name,
                tab: this,
                element: this.bodyElement
            });
            _Dom2.default.removeNode(this.root);
            __requestWidget(this.dataSource, this, null);
        }
    }]);

    return Tab;
}();

function __requestWidget(link, tab, timeout_i, callback) {
    var _this3 = this;

    if (!tab.isLoading) {
        tab.isLoading = true;
        _Gateway2.default.get(link, null, function (res) {
            if (res.type !== 'text/html') {
                throw new Error('Unexpected response!: ', res);
            }
            var data = res.text,
                tmpDiv = _Dom2.default.createDom('div', null, data.trim());

            tab.root = tmpDiv.children.length === 1 ? tmpDiv.children[0] : tmpDiv;

            __hideLoading(tab.bodyElement);
            tab.bodyElement.appendChild(tab.root);

            // Dispatch global event
            // tab doesn't inherit from EventEmitter class, but his parent does

            tab.parent.emit('tab-load', {
                id: tab.name,
                tab: tab,
                element: tab.bodyElement
            });

            // Dispatch tabID-specific event
            tab.parent.emit(tab.name, {
                tab: tab,
                element: tab.bodyElement
            });

            // If id has any content then emit another event
            var contentID = tab.root.id;
            if (contentID) {
                tab.parent.emit(contentID, {
                    tab: tab,
                    element: tab.bodyElement
                });
            }
            // IF callback provided
            if (callback) {
                callback.call(tab, _this3.bodyElement);
            }
            tab.isLoading = false;
        }, function (error) {
            if (error.timeout) {
                if (timeout_i && timeout_i === MAX_TRY) {
                    // TODO: Logger service?
                    console.error('Call for maintenance');
                    tab.parent.emit('error', { message: 'REQUEST TIMED OUT', timeout: true });
                    __tabNotLoaded(link, tab);
                } else {
                    (function () {
                        console.warn('Request timed out, trying again in 2 sec');
                        var id = setTimeout(function () {
                            __requestWidget(link, tab, timeout_i + 1 || 1);
                            clearTimeout(id);
                        }, 2000);
                    })();
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
    wrapper.className = 'tnt-tab-reload-div';
    button.type = 'submit';
    button.className = 'button button-primary tnt-tab-reload-btn';
    button.value = 'Reload';

    wrapper.innerHTML = 'Tab could not be loaded.<br>';
    wrapper.appendChild(button);

    __hideLoading(tab.bodyElement);
    tab.bodyElement.appendChild(wrapper);
    _Events2.default.listenOnce(button, 'click', function () {
        tab.bodyElement.removeChild(wrapper);
        __showLoading(tab.bodyElement);
        __requestWidget(link, tab, null);
    });
}

//TODO: loading icon to settings
// TODO @ZbynekFiser what this mean? which settings?
function __showLoading(element) {
    var loader = element.querySelector('.trinity-tab-loader');
    if (_lodash2.default.isNull(loader)) {
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