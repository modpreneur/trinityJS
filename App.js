/**
 * Created by fisa on 11/1/15.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Router = require('./Router');

var _Router2 = _interopRequireDefault(_Router);

var _Controller = require('./Controller.js');

var _Controller2 = _interopRequireDefault(_Controller);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultSettings = {
    attributeName: 'data-ng-scope'
};

/**
 * Represents application, provides main control over running js
 */

var App = function () {
    /**
     * Constructor of App
     * @param routes {array<Object>}
     * @param controllers {Object} <Name: classFunction>
     * @param [settings] {Object}
     *
     * @default settings
     * {
     *      attributeName: 'data-ng-scope'
     * }
     */
    function App(routes, controllers, settings) {
        _classCallCheck(this, App);

        //Settings FIRST !
        this.settings = _lodash2.default.defaultsDeep(settings || {}, defaultSettings);

        this.routes = routes;
        this.controllers = controllers;
        this.router = new _Router2.default(routes);
        // this.global = null;
        this.activeController = null;
        this.preBootScripts = [];

        // This way $scope property cannot be reassigned
        Object.defineProperty(this, '$scope', {
            value: {}
        });

        /** Try to find initial scope **/
        _lodash2.default.extend(this.$scope, this.parseScope());
    }

    /**
     * Kick up application
     * @param [successCallback] {Function} optional success callback
     * @param [errorCallback] {Function} optional error callback. If not provided, error is thrown
     * @returns {boolean}
     */


    _createClass(App, [{
        key: 'start',
        value: function start(successCallback, errorCallback) {
            var _this = this;

            //super cool feature
            _lodash2.default.find(this.preBootScripts, function (script) {
                return script(_this.$scope);
            });

            /**
             * Active controller
             */
            var controllerInfo = this.router.findController();
            if (_lodash2.default.isNull(controllerInfo)) {
                return this.finishCallback(false, successCallback);
            }

            var _controllerInfo$actio = controllerInfo.action.split('.'),
                _controllerInfo$actio2 = _slicedToArray(_controllerInfo$actio, 2),
                name = _controllerInfo$actio2[0],
                action = _controllerInfo$actio2[1];

            if (!name) {
                var _err = new Error('No Controller defined! did you forget to define controller in routes?');
                if (errorCallback) {
                    return errorCallback(_err);
                }
                throw _err;
            }

            // Load controller
            name += 'Controller';
            action = (action || 'index') + 'Action';

            // Create new active controller instance
            if (!this.controllers.hasOwnProperty(name)) {
                throw new Error('Controller ' + name + ' does not exist, did you forget to run "buildControllers.js" script?' + ' or did you write correct routes?');
            }

            /** Create and Set up controller instance **/
            var instance = new this.controllers[name](name);
            if (!(instance instanceof _Controller2.default)) {
                throw new Error(name + ' does not inherit from "Controller" class!');
            }

            instance._scope = this.$scope;
            instance._app = this;
            instance.request = controllerInfo.request;
            this.activeController = instance;

            /** Run **/
            if (instance[action]) {
                // Defer function to make place for initial rendering
                _lodash2.default.defer(function () {
                    instance.beforeAction(_this.$scope);
                    instance[action](_this.$scope);
                    instance.afterAction(_this.$scope);

                    // now run finish
                    _this.finishCallback(true, successCallback);
                });
                // OLD WAY
                // instance.beforeAction(this.$scope);
                // instance[action](this.$scope);
                // instance.afterAction(this.$scope);
                // now run finish
                // this.finishCallback(true, successCallback);

                return true;
            }

            // Something screw up - error
            var err = new Error('Action "' + action + '" doesn\'t exists');
            if (errorCallback) {
                return errorCallback(err);
            }
            throw err;
        }

        /**
         * add script befor launching of app
         * @param func {function} if true is returned => lounch app (skip other pre-scripts)
         */

    }, {
        key: 'addPreBOOTScript',
        value: function addPreBOOTScript(func) {
            this.preBootScripts.push(func);
        }

        /**
         * Finishing success callback
         * @param isController {boolean}
         * @param callback {function}
         * @returns {boolean}
         */

    }, {
        key: 'finishCallback',
        value: function finishCallback(isController, callback) {
            if (process.env.NODE_ENV !== 'production') {
                var message = isController ? this.activeController.name + ' loaded.' : 'Route does\'t have any controller.';
                console.log(message);
            }
            if (callback) {
                callback(this.activeController || false);
            }
            return isController;
        }

        /**
         * Search in "root" element for every element with attribute defined in settings
         * @param root
         * @returns {{}} - bag with {attName.value:element}
         */

    }, {
        key: 'parseScope',
        value: function parseScope(root) {
            root = root || window.document;
            var attName = defaultSettings.attributeName,
                elements = root.querySelectorAll('[' + attName + ']');

            var bag = {};
            _lodash2.default.each(elements, function (el, i) {
                var name = el.getAttribute(attName) || '' + el.name + i;
                if (_lodash2.default.isUndefined(bag[name])) {
                    bag[name] = el;
                } else {
                    if (_lodash2.default.isArray(bag[name])) {
                        bag[name].push(el);
                    } else {
                        // crate new array
                        bag[name] = [bag[name], el];
                    }
                }
            });
            return bag;
        }
    }]);

    return App;
}();

exports.default = App;