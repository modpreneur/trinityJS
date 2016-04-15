'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      * Created by fisa on 11/1/15.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      */


var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Router = require('./Router');

var _Router2 = _interopRequireDefault(_Router);

var _Controller = require('./Controller.js');

var _Controller2 = _interopRequireDefault(_Controller);

var _Debug = require('./Debug');

var _Debug2 = _interopRequireDefault(_Debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var defaultSettings = {
    env: 'production',
    controllersPath: '/'
};

/**
 * Represents application, provides main control over running js
 * @deprecated
 */

var App = function () {
    function App(routes, controllers, settings) {
        _classCallCheck(this, App);

        //Settings FIRST !
        this.settings = _lodash2.default.defaultsDeep(settings || {}, defaultSettings);
        // Removed in new version
        if (settings.environment) {
            this.settings.env = settings.environment;
        }
        if (this.settings.env === 'dev' || this.settings.env === 'development') {
            _Debug2.default.env = 'dev';
            System.import('trinity/devTools');
        }

        this.routes = routes;
        this.controllers = controllers;
        this.router = new _Router2.default(routes);
        this.activeController = null;

        // This way $scope property cannot be reassigned
        Object.defineProperty(this, '$scope', {
            value: {}
        });
    }

    /**
     * Kick up application
     * @param [successCallback] {Function} optional success callback
     * @param [errorCallback] {Function} optional error callback
     * @returns {boolean}
     */


    _createClass(App, [{
        key: 'start',
        value: function start(successCallback, errorCallback) {
            if (this.isDevEnvironment()) {
                return this.__devStart(successCallback, errorCallback);
            } else {
                return this.__prodStart();
            }
        }

        /**
         * Kick up production application
         * @returns {boolean}
         * @private
         */

    }, {
        key: '__prodStart',
        value: function __prodStart() {
            var controller = this.router.findController();
            if (_lodash2.default.isNull(controller)) {
                return false;
            }

            var controllerInfo = controller.action.split('.');
            if (controllerInfo.length < 1) {
                throw new Error('No Controller defined! did you forget to define controller in routes?');
            }
            var name = controllerInfo[0] + 'Controller',
                action = controllerInfo[1] + 'Action' || 'indexAction';

            // Create new active controller instance
            if (!this.controllers.hasOwnProperty(name)) {
                throw new Error('Controller ' + name + ' does not exist, did you forget to run "buildControllers.js" script?');
            }

            /** Create and Set up controller instance **/
            var instance = new this.controllers[name]();
            if (!(instance instanceof _Controller2.default)) {
                throw new Error(name + ' does not inherit from "Controller" class!');
            }
            instance._scope = this.$scope;
            instance._app = this;
            instance.request = controller.request;
            this.activeController = instance;

            /** Run **/
            if (instance[action]) {
                instance[action](this.$scope);
            }
            return true;
        }

        /**
         * Kick up development application
         * @param successCallback {Function} optional success callback
         * @param errorCallback {Function} optional error callback
         * @returns {boolean}
         * @private
         */

    }, {
        key: '__devStart',
        value: function __devStart(successCallback, errorCallback) {
            var path = this.settings.controllersPath;
            var controller = this.router.findController();
            if (_lodash2.default.isNull(controller)) {
                if (successCallback) {
                    successCallback(false);
                }
                return false;
            }

            var controllerInfo = controller.action.split('.');
            if (controllerInfo.length < 1) {
                var err = new Error('No Controller defined! did you forget to define controller in routes?');
                if (errorCallback) {
                    return errorCallback(err);
                }
                throw err;
            }
            // Load controller
            var name = controllerInfo[0] + 'Controller',
                action = controllerInfo[1] + 'Action' || 'indexAction';
            var self = this;
            System.import(path + '/' + name + '.js').then(function (resp) {
                /** Create and Set up controller instance **/
                var instance = new resp.default();
                if (!(instance instanceof _Controller2.default)) {
                    var _err = new Error(name + ' does not inherit from "Controller" class!');
                    if (errorCallback) {
                        return errorCallback(_err);
                    }
                    throw _err;
                }
                instance._scope = self.$scope;
                instance._app = self;
                instance.request = controller.request;
                self.activeController = instance;

                /** Run **/
                if (instance[action]) {
                    instance[action](self.$scope);
                    if (successCallback) {
                        successCallback(instance);
                    }
                } else {
                    var _err2 = new Error('Action "' + action + '" doesn\'t exists');
                    if (errorCallback) {
                        return errorCallback(_err2);
                    }
                    throw _err2;
                }
            }).catch(function (err) {
                if (errorCallback) {
                    errorCallback(err);
                }
            });
            return true;
        }

        /**
         * Kick up application
         * @deprecated use start() instead and define path in settings as "controllersPath"
         * @param path {String} where to look for controller
         *  - used for async lazy load of controller file described in routes array
         * @param successCallback {Function} optional success callback
         * @param errorCallback {Function} optional error callback
         * @returns {boolean}
         */

    }, {
        key: 'devStart',
        value: function devStart(path, successCallback, errorCallback) {
            this.settings.controllersPath = path;
            return this.__devStart(successCallback, errorCallback);
        }

        /**
         * Getter for environment
         * @returns {string|*|string}
         */

    }, {
        key: 'isDevEnvironment',
        value: function isDevEnvironment() {
            return _Debug2.default.isDev();
        }
    }, {
        key: 'environment',
        get: function get() {
            return this.settings.env;
        }
    }]);

    return App;
}();

exports.default = App;