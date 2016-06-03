/**
 * Created by fisa on 11/2/15.
 */
'use strict';

/**
 * Abstract Controller class, provides connection between app and activeController itself
 * Should be inherited from in every controller
 */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Controller = function () {
    function Controller(name) {
        _classCallCheck(this, Controller);

        this.name = name;
        this._app = null;
        this._scope = null;
        this._request = null;
    }

    /**
     * Simple getter - has to be specified
     * @returns {*}
     */


    _createClass(Controller, [{
        key: 'getScope',
        value: function getScope() {
            return this._scope;
        }
    }, {
        key: 'getApp',
        value: function getApp() {
            return this._app;
        }

        /**
         * Hook to run before every action
         */

    }, {
        key: 'beforeAction',
        value: function beforeAction($scope) {}

        /**
         * Hook after every action run
         */

    }, {
        key: 'afterAction',
        value: function afterAction($scope) {}

        /**
         * Not implemented
         * @param serviceName
         */

    }, {
        key: 'getService',
        value: function getService(serviceName) {
            console.warn('Method not implemented');
            //TODO: should pull from app requested service, if exists, if not return null
        }
    }, {
        key: 'request',
        get: function get() {
            return this._request;
        }

        /**
         * Setter for "request" property - make sure that request can be assigned only once
         * @param value
         * @returns {void}
         */
        ,
        set: function set(value) {
            if (this._request === null) {
                this._request = value;
            }
        }
    }]);

    return Controller;
}();

exports.default = Controller;