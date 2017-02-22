'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _fbemitter = require('fbemitter');

var _Tab = require('./Tab');

var _Tab2 = _interopRequireDefault(_Tab);

var _Events = require('../utils/Events');

var _Events2 = _interopRequireDefault(_Events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Event name constants
 * @type {string}
 */
var TAB_LOAD = 'tab-load',
    TAB_CHANGED = 'tab-changed',
    TAB_UNLOAD = 'tab-unload';

/**
 * Trinity Tab
 */

var TrinityTab = function (_EventEmitter) {
    _inherits(TrinityTab, _EventEmitter);

    /**
     * Heads of tab component
     * @param [tabHeads] {Array<HTMLElement>}
     * @param [configuration] {object}
     */
    function TrinityTab(tabHeads, configuration) {
        _classCallCheck(this, TrinityTab);

        tabHeads = tabHeads || document.querySelectorAll('.tab-head');
        if (tabHeads.length < 1) {
            throw new Error('No "tabHeads" provided or elements with "tab-head" class not found!');
        }

        var _this = _possibleConstructorReturn(this, (TrinityTab.__proto__ || Object.getPrototypeOf(TrinityTab)).call(this));

        _this.configuration = configuration || {};
        _this.heads = tabHeads;
        _this.aliasIdPairs = { alToId: {}, idToAl: {} };
        // find heads with aliases
        _lodash2.default.each(tabHeads, function (head) {
            head.alias = head.getAttribute('data-alias'); // sets custom attribute, for not having to use getAttribute anny later
            if (head.alias) {
                _this.aliasIdPairs.alToId[head.alias] = head.id;
                _this.aliasIdPairs.idToAl[head.id] = head.alias;
            }
        });

        _this.tabs = {};
        _this.__activeTabName = null;
        _this.__prevTabName = null;

        // Create tabs
        _lodash2.default.each(tabHeads, function (head) {
            _this.tabs[head.id] = new _Tab2.default(head);
            // If no config is provided, try look also for _other
            _this.configuration[head.id] = _lodash2.default.extend({}, _this.configuration['_default'], _this.configuration[head.id]);
        });

        // Find active Head
        // Check which tab to load first
        var tabName = location.hash.substring(1),
            activeHead = null;

        if (tabName.length > 0) {
            if (_this.aliasIdPairs.alToId[tabName]) {
                (function () {
                    var tabId = _this.aliasIdPairs.alToId[tabName];
                    activeHead = _lodash2.default.find(_this.heads, function (head) {
                        return head.id === tabId;
                    });
                })();
            } else {
                activeHead = _lodash2.default.find(_this.heads, function (head) {
                    return head.id === tabName;
                });
                if (activeHead && activeHead.alias) {
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
        // Got active head
        _this.__activeTabName = activeHead.id;

        // Request content for active tab
        _this.tabs[activeHead.id].loadContent(_this.__onTabLoad.bind(_this));

        /** Attach click event Listeners to other heads **/
        _this.__listeners = _this.__attachHeadClickEvents();

        // Navigation
        window.addEventListener('popstate', __handleNavigation.bind(_this));
        return _this;
    }

    /**
     * Attach onClick events to tab heads
     * @returns Array<function> - unlisteners
     * @private
     */


    _createClass(TrinityTab, [{
        key: '__attachHeadClickEvents',
        value: function __attachHeadClickEvents() {
            var _this2 = this;

            return _lodash2.default.map(this.heads, function (head) {
                return _Events2.default.listen(head, 'click', _this2.setActiveTab.bind(_this2, head.id));
            });
        }

        /**
         * Private callback, called when tab is loaded
         * @param err {object} can be null
         * @param tab {Tab} object
         * @private
         */

    }, {
        key: '__onTabLoad',
        value: function __onTabLoad(err, tab) {
            if (err) {
                this.emit('error', err);
                return;
            }
            var tabId = tab.id;

            // No error
            // Call onLoad callback if set
            var onLoadCallback = this.configuration[tabId].onLoad;
            if (_lodash2.default.isFunction(onLoadCallback)) {
                onLoadCallback(tab);
            }
            // Emit event
            this.emit(TAB_LOAD, tab);

            // if loaded tab is also active tab -> call Active callbacks
            if (tabId === this.__activeTabName) {
                // On Active callback
                var onActiveCallback = this.configuration[tabId].onActive;
                if (_lodash2.default.isFunction(onActiveCallback)) {
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

    }, {
        key: 'setActiveTab',
        value: function setActiveTab(tabId) {
            tabId = tabId ? this.aliasIdPairs.alToId[tabId] || tabId : this.heads[0].id;

            var tab = this.tabs[tabId];
            if (!tab) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Tab with id or alias: ' + tabId + ' does not exist!');
                }
                return false;
            }

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
            var prevTab = this.tabs[this.__prevTabName];

            // Switch checked attribute
            prevTab.head.removeAttribute('checked');
            prevTab.head.checked = false;
            tab.head.setAttribute('checked', 'checked');
            tab.head.checked = true;

            //Update Hash URL
            __pushHistory(tab.alias || tabId);

            // Emit only when is already fetched
            if (!tab.isFetching) {
                // On Active callback
                var onActiveCallback = this.configuration[tabId].onActive;
                if (_lodash2.default.isFunction(onActiveCallback)) {
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

    }, {
        key: 'getActiveTab',
        value: function getActiveTab() {
            return this.tabs[this.__activeTabName];
        }

        /**
         * Reloads content of tab
         * @param tabId {string || Array<string>}
         */

    }, {
        key: 'reload',
        value: function reload(tabId) {
            var _this3 = this;

            var tabs = [].concat(tabId);
            _lodash2.default.each(tabs, function (tmpTabId) {
                var tab = _this3.tabs[_this3.aliasIdPairs.alToId[tmpTabId] || tmpTabId];
                if (tab) {
                    _this3.__reloadTab(tab);
                }
            });
        }

        /**
         * Reload content of all tabs
         */

    }, {
        key: 'reloadAll',
        value: function reloadAll() {
            var _this4 = this;

            _lodash2.default.each(this.tabs, function (tab) {
                return _this4.__reloadTab(tab);
            });
        }

        /**
         * Destroy all tabs and unload trinityTab so it can be garbage collected,
         * Also emits tab-unload event and calls delete callback, but cannot be prevented
         */

    }, {
        key: 'destroy',
        value: function destroy() {
            var _this5 = this;

            // unload listeners
            _lodash2.default.each(this.__listeners, function (f) {
                return f();
            });
            // Delete tabs
            _lodash2.default.each(this.tabs, function (tab) {
                // life cycle hook
                var onDeleteCallback = _this5.configuration[tab.id].onDelete;
                _lodash2.default.isFunction(onDeleteCallback) && onDeleteCallback(tab, true);

                // global event
                _this5.emit(TAB_UNLOAD, tab, true);

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

    }, {
        key: '__reloadTab',
        value: function __reloadTab(tab) {
            var callbackFunction = this.configuration[tab.id].onDelete;
            if (_lodash2.default.isFunction(callbackFunction) && callbackFunction(tab, false) === false) {
                return;
            }
            this.emit(TAB_UNLOAD, tab);
            tab.reloadContent(this.__onTabLoad.bind(this));
        }

        /**
         * @deprecated
         * @param tabID
         * @param callback
         * @param context
         */

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
 * Push new history
 * @param newHash
 * @private
 */
function __pushHistory(newHash) {
    if (newHash !== window.location.hash.substring(1)) {
        window.history.pushState(null, newHash, '#' + newHash);
    }
}