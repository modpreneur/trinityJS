'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Tab = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Dom = require('../utils/Dom');

var _Dom2 = _interopRequireDefault(_Dom);

var _closureEvents = require('../utils/closureEvents');

var _closureEvents2 = _interopRequireDefault(_closureEvents);

var _fbemitter = require('fbemitter');

var _Gateway = require('../Gateway');

var _Gateway2 = _interopRequireDefault(_Gateway);

var _Debug = require('../Debug');

var _Debug2 = _interopRequireDefault(_Debug);

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
        _this.tabs = {};
        _this.__activeTabID = null;
        _initialize.call(_this);
        return _this;
    }

    /**
     * Set active Tab by provided tabID
     * @param tabID {string}
     * @throws {Error} if tab with provided ID does't exit
     * @public
     */


    _createClass(TrinityTab, [{
        key: 'setActiveTab',
        value: function setActiveTab(tabID) {
            if (!this.tabs.hasOwnProperty(tabID)) {
                if (_Debug2.default.isDev()) {
                    throw new Error('Tab with id: ' + tabID + ' does not exist!');
                }
                return;
            }
            if (tabID === this.__activeTabID) {
                return;
            }
            var prevTab = this.__activeTabID;
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

    }, {
        key: 'getActiveTab',
        value: function getActiveTab() {
            return this.tabs[this.__activeTabID];
        }

        /**
         * Reloads content of tab
         * @param tabID {string || Array<string>}
         */

    }, {
        key: 'reload',
        value: function reload(tabID) {
            if (_lodash2.default.isArray(tabID)) {
                var tab = _lodash2.default.find(this.tabs, function (t) {
                    return t.id === tabID;
                });
                if (tab) {
                    tab.reloadContent();
                }
            } else {
                _lodash2.default.map(this.tabs, function (t) {
                    if (tabID.indexOf(t.id) !== -1) {
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
            _lodash2.default.map(this.tabs, function (t) {
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
 * Initialize TrinityTab wrapper
 * @private
 */


exports.default = TrinityTab;
function _initialize() {
    var _this2 = this;

    //Check which tab to load first
    var tabID = location.hash.substring(1),
        activeHead = null;

    if (tabID.length > 0) {
        activeHead = document.getElementById(tabID);
        activeHead.setAttribute('checked', 'checked');
    } else {
        activeHead = _lodash2.default.find(this.heads, function (tab) {
            var checked = false;
            if (_lodash2.default.isUndefined(tab.checked)) {
                checked = !_lodash2.default.isNull(tab.getAttribute('checked'));
            } else {
                checked = tab.checked;
            }
            return checked;
        });
        if (!activeHead) {
            activeHead = this.heads[0];
        }
        tabID = activeHead.getAttribute('id');
        // Replace history string
        window.history.replaceState(null, tabID, '#' + tabID);
    }
    this.__activeTabID = tabID;
    // Add new Tab to tabs
    this.tabs[tabID] = new Tab(activeHead, this);

    /** Attach click event Listeners to other heads **/
    _lodash2.default.map(this.heads, function (head) {
        _closureEvents2.default.listen(head, 'click', __handleTabClick.bind(_this2, head));
    });

    // Navigation
    _closureEvents2.default.listen(window, 'popstate', __handleNavigation, false, this);
}

/**
 * Handles pop state navigation
 * @private
 */
function __handleNavigation() {
    var tabID = location.hash.substring(1);
    if (tabID.length > 0) {
        this.setActiveTab(tabID);
    }
}

/**
 * Handles click event on Tab
 * @param head {HTMLElement}
 * @param [e] {Event}
 * @private
 */
function __handleTabClick(head, e) {
    var tabID = head.getAttribute('id');
    // If undefined -> Create and Set as Active
    if (_lodash2.default.isUndefined(this.tabs[tabID])) {
        this.tabs[tabID] = new Tab(head, this);
    }
    this.setActiveTab(tabID);
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

var Tab = exports.Tab = function () {
    function Tab(head, parent) {
        _classCallCheck(this, Tab);

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

    _createClass(Tab, [{
        key: 'loadContent',
        value: function loadContent() {
            __requestWidget(this.dataSource, this, null);
        }
    }, {
        key: 'reloadContent',
        value: function reloadContent() {
            __showLoading(this.bodyElement);
            _Dom2.default.removeNode(this.root);
            __requestWidget(this.dataSource, this, null);
        }
    }]);

    return Tab;
}();

function __requestWidget(link, tab, timeout_i, callback) {
    _Gateway2.default.get(link, null, function (data) {
        // @NOTE: note sure if this if is necessary
        if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
            if (data.go != undefined) {
                __requestWidget(data.go, tab, callback);
                return;
            }
            throw new Error('Unexpected response: ', data);
        }

        var tmpDiv = _Dom2.default.createDom('div', null, data.trim());
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
        var contentID = tab.root.getAttribute('id');
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
    }, function (error) {
        if (error.timeout) {
            if (timeout_i && timeout_i === MAX_TRY) {
                // TODO: Logger service?
                console.error('Call for maintenance');
                tab.parent.emit('error', { message: 'REQUEST TIMED OUT', timeout: true });
            } else {
                (function () {
                    console.warn('Request timed out, trying again in 2 sec');
                    var id = setTimeout(function () {
                        __requestWidget(link, tab, timeout_i || 1);
                        clearTimeout(id);
                    }, 2000);
                })();
            }
        } else {
            console.error(error);
            tab.parent.emit('error', error);
        }
    });
}

//TODO: loading icon to settings
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