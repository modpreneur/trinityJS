'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Tab = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Dom = require('./utils/Dom.js');

var _Dom2 = _interopRequireDefault(_Dom);

var _closureEvents = require('./utils/closureEvents.js');

var _closureEvents2 = _interopRequireDefault(_closureEvents);

var _Store = require('./Store.js');

var _Store2 = _interopRequireDefault(_Store);

var _TrinityForm = require('./TrinityForm.js');

var _TrinityForm2 = _interopRequireDefault(_TrinityForm);

var _Gateway = require('./Gateway.js');

var _Gateway2 = _interopRequireDefault(_Gateway);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Created by fisa on 9/11/15.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

var tabRegx = /(?:#)(.*tab\d+)(?:=(.*))*/;

/**
 * Trinity Tab
 */

var TrinityTab = (function (_events$EventTarget) {
    _inherits(TrinityTab, _events$EventTarget);

    function TrinityTab() {
        _classCallCheck(this, TrinityTab);

        var tabHeads = document.querySelectorAll('.tab-head');
        if (tabHeads.length < 1) {
            throw new Error('Elements with "tab-head" class not found!');
        }

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TrinityTab).call(this));

        _this.heads = tabHeads;
        _this.tabs = {};
        _this.activeHead = null;
        _initialize.call(_this);
        return _this;
    }

    /**
     * Sets Active Tab as actual and update Hash path
     * @param tabHead
     * @public
     */

    _createClass(TrinityTab, [{
        key: 'setActiveTab',
        value: function setActiveTab(tabHead) {
            this.activeHead.removeAttribute('checked');
            this.activeHead = tabHead;
            this.activeHead.setAttribute('checked', 'checked');
            //Update Hash URL
            _pushHistory(this.getActiveTab().getPath());
        }

        /**
         * TODO: NOTE: may return NULL if active tab still processing
         * @returns {Tab}
         */

    }, {
        key: 'getActiveTab',
        value: function getActiveTab() {
            return _lodash2.default.find(this.tabs, function (tab) {
                return tab.head === this.activeHead;
            }, this);
        }
    }]);

    return TrinityTab;
})(_closureEvents2.default.EventTarget);

exports.default = TrinityTab;

function _initialize() {
    //Check which tab to load first
    var tabInfo = location.hash.match(tabRegx),
        activeHead = null,
        path = null;

    if (_lodash2.default.isNull(tabInfo)) {
        activeHead = _lodash2.default.find(this.heads, function (tab) {
            return !_lodash2.default.isNull(tab.getAttribute('checked'));
        });
    } else {
        //TODO: Tab info - bigger deep
        activeHead = document.getElementById(tabInfo[1]);
        activeHead.setAttribute('checked', 'checked');
        path = tabInfo[2];
    }
    this.activeHead = activeHead;
    // Add new Tab to tabs
    this.tabs[activeHead.getAttribute('id')] = _createTab(this, activeHead, path || null);

    /** Attach click event Listeners to other heads **/
    _lodash2.default.map(this.heads, function (head) {
        _closureEvents2.default.listen(head, 'click', _handleTabClick.bind(this, head));
    }, this);

    _closureEvents2.default.listen(window, 'popstate', _handleNavigation, false, this);
}

/**
 * Handles navigation
 * @param e
 * @private
 */
function _handleNavigation(e) {
    var tabInfo = location.hash.match(tabRegx),
        head = null;

    if (!_lodash2.default.isNull(tabInfo)) {
        head = document.getElementById(tabInfo[1]);
        if (this.activeHead !== head) {
            this.activeHead.removeAttribute('checked');
            this.activeHead = head;
            this.activeHead.setAttribute('checked', 'checked');
            this.activeHead.checked = true;
        }
        var tab = this.getActiveTab();
        if (tabInfo[2]) {
            tab.setActiveByUrl(tabInfo[2]);
        } else if (tab.active !== tab.root) {
            tab.active.hide();
            tab.active = tab.root;
            _Dom2.default.classlist.remove(tab.root, 'display-none');
        }
    }
}

/**
 * Handles click event on Tab
 * @param head
 * @param e
 * @private
 */
function _handleTabClick(head, e) {
    var tabID = head.getAttribute('id');
    // If undefined -> Create and Set as Active
    if (_lodash2.default.isUndefined(this.tabs[tabID])) {
        this.tabs[tabID] = _createTab(this, head, null);
        //Set as active
        this.activeHead.removeAttribute('checked');
        this.activeHead = head;
        this.activeHead.setAttribute('checked', 'checked');
        //Hash Location change
        _pushHistory(tabID, [tabID, ' loaded']);
        //location.hash = tabID;
    } else {
            // Just make as active
            this.setActiveTab(head);
        }
}

/**
 * Push new history
 * @param newHash
 * @param label
 * @private
 */
function _pushHistory(newHash, label) {
    window.history.pushState(null, label ? label.join('') : '', [location.pathname, '#', newHash].join(''));
}

/**
 * Create new Tab and assign parent for event propagation
 * @param parent
 * @param head
 * @param path
 * @returns {Tab}
 * @private
 */
function _createTab(parent, head, path) {
    var t = new Tab(head, path);
    t.setParentEventTarget(parent);
    return t;
}

/**
 * Tab class
 */

var Tab = exports.Tab = (function (_events$EventTarget2) {
    _inherits(Tab, _events$EventTarget2);

    function Tab(head, path) {
        _classCallCheck(this, Tab);

        /** Tab **/

        var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(Tab).call(this));

        _this2.forms = [];
        _this2.children = {};
        _this2.head = head;
        _this2.active = null;

        // Tab body
        _this2.body = document.getElementById(head.getAttribute('id').replace('tab', 'tab-body-'));

        if (path) {
            _this2.preload = new LazyDOM(path, _this2);
            _this2.preload.setParentEventTarget(_this2);
            _this2.active = _this2.preload;
        } else {
            _showLoading(_this2.body);
        }

        //link of body for root child
        _this2.link = _this2.body.getAttribute('data-source');
        _processAjaxLink.call(_this2, _this2.link, !path);
        return _this2;
    }

    /**
     * Generate path of actual position in deep structure -> no need
     * @returns {string}
     */

    _createClass(Tab, [{
        key: 'getPath',
        value: function getPath() {
            if (_lodash2.default.isNull(this.active) || this.active === this.root) {
                return this.head.getAttribute('id');
            }
            return [this.head.getAttribute('id'), this.active.getPath()].join('=');
        }

        /**
         * Set active tab according to provided url hash..
         * @param url
         */

    }, {
        key: 'setActiveByUrl',
        value: function setActiveByUrl(url) {
            var active = _lodash2.default.find(this.children, _lodash2.default.matches({ 'link': url }));
            if (this.active === active) {
                return;
            }
            if (this.active === this.root) {
                _Dom2.default.classlist.add(this.root, 'display-none');
            } else {
                this.active.hide();
            }
            this.active = active;
            this.active.show();
        }

        /**
         * Set active tab
         * @param tab
         */

    }, {
        key: 'setActive',
        value: function setActive(tab) {
            if (this.active === this.root) {
                _Dom2.default.classlist.add(this.root, 'display-none');
            } else {
                this.active.hide();
            }
            tab.show();
            this.active = tab;
            _pushHistory([location.hash.substring(1), '=', this.active.getPath()].join(''));
        }

        /**
         * Go back in history
         */

    }, {
        key: 'back',
        value: function back() {
            window.history.back();
        }
    }]);

    return Tab;
})(_closureEvents2.default.EventTarget);

/**
 * PRROCES AJAX LINK
 * MOST IMPORTANT - DOWNLOADS CONTENT AND CALL OTHERS
 * @param link
 * @param isActive
 * @param callback
 * @private
 */

function _processAjaxLink(link, isActive, callback) {
    isActive = _lodash2.default.isUndefined(isActive) ? true : isActive;
    _Gateway2.default.get(link, null, (function (data) {
        if ((typeof data === 'undefined' ? 'undefined' : _typeof(data)) === 'object') {
            if (data.go != undefined) {
                _processAjaxLink.call(this, data.go, isActive, callback);
                return;
            }
            throw new Error('Unexpected response: ', data);
        } else {
            var tempDiv = _Dom2.default.createDom('div', null, data.trim());
            this.root = tempDiv.children.length === 1 ? tempDiv.children[0] : tempDiv;

            if (!isActive) {
                _Dom2.default.classlist.add(this.root, 'display-none');
            } else {
                this.active = this.root;
                _hideLoading(this.body);
            }
        }

        this.body.appendChild(this.root);

        _lodash2.default.each(this.root.querySelectorAll('form'), function (form) {
            //to be sure, save forms
            this.forms.push(new _TrinityForm2.default(form));
        }, this);
        //Ajax links
        _initAjaxLinks.call(this, this.root);

        //Dispatch event
        var domID = this.root.getAttribute('id');
        if (domID) {
            this.dispatchEvent(new _closureEvents2.default.Event(domID, this));
        }

        // IF callback provided
        if (callback) {
            callback.call(this, this.root);
        }
    }).bind(this), (function (error) {
        //TODO: Refresh button and Error somehow
        console.error(error);
    }).bind(this));
}

var LINK_SELECTOR = '.link';

/**
 * Initialize ajax links (only where is class ".link"
 * @param body
 * @private
 */
function _initAjaxLinks(body) {
    var href = this.preload ? this.preload.link : null;
    _lodash2.default.each(body.querySelectorAll(LINK_SELECTOR), function (link, index) {
        var id = link.getAttribute('id');
        if (!id || id.length === 0) {
            id = [this.head.getAttribute('id'), '-ajaxLink-', index].join('');
            link.setAttribute('id', id);
        }
        if (!_lodash2.default.isNull(href) && href === link.getAttribute('href')) {
            this.children[id] = this.preload;
        } else {
            this.children[id] = null;
        }
        //Attach click handler
        _closureEvents2.default.listen(link, 'click', _handleLinkClick.bind(link, this));
    }, this);
}

function _handleLinkClick(parent, e) {
    var link = this;
    var id = link.getAttribute('id');
    if (_lodash2.default.isNull(parent.children[id])) {
        parent.children[id] = new LazyDOM(link.getAttribute('href'), parent);
        parent.children[id].setParentEventTarget(parent);
    }
    parent.setActive(parent.children[id]);
}

/**
 * Represents lazy loading dom structure - will be removed?
 */

var LazyDOM = (function (_events$EventTarget3) {
    _inherits(LazyDOM, _events$EventTarget3);

    function LazyDOM(link, parent) {
        _classCallCheck(this, LazyDOM);

        /** Lazy DOM **/

        var _this3 = _possibleConstructorReturn(this, Object.getPrototypeOf(LazyDOM).call(this));

        _this3.children = {};
        _this3.forms = [];
        _this3.link = link;
        _this3.parent = parent;
        _this3.active = null;
        _this3.root = null;

        // Create body
        _this3.body = document.createElement('div');
        _showLoading(_this3.body);

        parent.body.appendChild(_this3.body);

        _processAjaxLink.call(_this3, _this3.link, true, function (target) {
            // Create back button
            var header = target.querySelector('.header-h2');
            var backButton = _Dom2.default.createDom('span', { 'class': 'tab-back' }, '');
            var icon = _Dom2.default.createDom('i', { 'class': 'tiecons tiecons-arrow-bold-long-left font-20' }, '');
            backButton.appendChild(icon);

            header.appendChild(backButton);
            _Dom2.default.classlist.add(header, 'padding-left-90');
            _closureEvents2.default.listen(backButton, 'click', (function (e) {
                e.preventDefault();
                this.parent.back();
            }).bind(this));
        });
        return _this3;
    }

    _createClass(LazyDOM, [{
        key: 'hide',
        value: function hide() {
            _Dom2.default.classlist.add(this.body, 'display-none');
        }
    }, {
        key: 'show',
        value: function show() {
            _Dom2.default.classlist.remove(this.body, 'display-none');
        }
    }, {
        key: 'getPath',
        value: function getPath() {
            if (_lodash2.default.isNull(this.active) || this.active === this.root) {
                return this.link;
            }
            return [this.link, this.active.getPath()].join('=');
        }
    }, {
        key: 'back',
        value: function back() {
            window.history.back();
        }
    }, {
        key: 'setActive',
        value: function setActive(tab) {
            if (this.active === this.root) {
                _Dom2.default.classlist.add(this.root, 'display-none');
            } else {
                this.active.hide();
            }
            tab.show();
            this.active = tab;
            _pushHistory([location.hash.substring(1), '=', this.active.getPath()].join(''));
        }
    }]);

    return LazyDOM;
})(_closureEvents2.default.EventTarget);

function _showLoading(element) {
    var loader = element.querySelector('.tab-loader');
    if (_lodash2.default.isNull(loader)) {
        var icon = _Dom2.default.createDom('i', { 'class': 'tiecons tiecons-loading tiecons-rotate font-40' });
        loader = _Dom2.default.createDom('div', { 'class': 'tab-loader' }, icon);
        element.appendChild(loader);
    } else {
        _Dom2.default.classlist.remove(loader, 'display-none');
    }
}

function _hideLoading(element) {
    var loader = element.querySelector('.tab-loader');
    if (loader) {
        _Dom2.default.classlist.add(loader, 'display-none');
    }
}