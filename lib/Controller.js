'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by fisa on 11/2/15.
 */

/**
 * Abstract Controller class, provides connection between app and activeController itself
 * Should be inherited from in every controller
 */

var Controller = (function () {
    function Controller() {
        _classCallCheck(this, Controller);

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
    }, {
        key: 'Get',
        value: function Get(serviceName) {
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
})();

exports.default = Controller;