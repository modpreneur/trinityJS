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
    env: 'prod',
    attributeName: 'data-ng-scope'
};

/**
 * Represents application, provides main control over running js
 */

var App = function () {
    function App(routes, controllers, settings) {
        _classCallCheck(this, App);

        //Settings FIRST !
        this.settings = _lodash2.default.defaultsDeep(settings || {}, defaultSettings);
        if (this.settings.env === 'dev' || this.settings.env === 'development') {
            _Debug2.default.env = 'dev';
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
            var controller = this.router.findController();
            if (_lodash2.default.isNull(controller)) {
                return this.finishCallback(false, successCallback);
            }

            console.log(controller);

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

            // Create new active controller instance
            if (!this.controllers.hasOwnProperty(name)) {
                throw new Error('Controller ' + name + ' does not exist, did you forget to run "buildControllers.js" script?');
            }

            /** Create and Set up controller instance **/
            var instance = new this.controllers[name](name);
            if (!(instance instanceof _Controller2.default)) {
                throw new Error(name + ' does not inherit from "Controller" class!');
            }

            /** Try to find initial scope **/
            _lodash2.default.extend(this.$scope, this.parseScope());

            instance._scope = this.$scope;
            instance._app = this;
            instance.request = controller.request;
            this.activeController = instance;

            /** Run **/
            if (instance[action]) {
                instance[action](this.$scope);
            } else {
                var _err = new Error('Action "' + action + '" doesn\'t exists');
                if (errorCallback) {
                    return errorCallback(_err);
                }
                throw _err;
            }
            return this.finishCallback(true, successCallback);
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
            var message = isController ? this.activeController.name + ' loaded.' : 'Route does\'t have any controller.';

            _Debug2.default.log(message);
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
            var attName = this.settings.attributeName,
                elements = root.querySelectorAll('[' + attName + ']');

            var bag = {};
            _lodash2.default.each(elements, function (el, i) {
                var name = el.getAttribute(attName) || '' + el.name + i;
                bag[name] = el;
            });
            return bag;
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