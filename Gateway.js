'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.configure = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _noop2 = require('lodash/noop');

var _noop3 = _interopRequireDefault(_noop2);

var _isArrayLike2 = require('lodash/isArrayLike');

var _isArrayLike3 = _interopRequireDefault(_isArrayLike2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _extend2 = require('lodash/extend');

var _extend3 = _interopRequireDefault(_extend2);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE';

// Global configuration
var config = {
    timeout: 10000,
    fileTimeout: 10000
};

var Gateway = function () {
    function Gateway() {
        _classCallCheck(this, Gateway);
    }

    _createClass(Gateway, null, [{
        key: 'get',

        /**
         *  normal GET request to defined URL
         * @param {string} url
         * @param {object} [data]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @returns {Request}
         */
        value: function get(url, data, successCallback, errorCallback) {
            return __send(url, GET, data, successCallback, errorCallback);
        }
        /**
         * JSON GET request
         * @param {string} url
         * @param {object} [data]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @returns {Request}
         */

    }, {
        key: 'getJSON',
        value: function getJSON(url, data, successCallback, errorCallback) {
            return __sendJSON(url, GET, data, successCallback, errorCallback);
        }

        /**
         * normal POST request
         * @param {string} url
         * @param {object} [data]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @returns {Request}
         */

    }, {
        key: 'post',
        value: function post(url, data, successCallback, errorCallback) {
            return __send(url, POST, data, successCallback, errorCallback);
        }

        /**
         * JSON POST request
         * @param {string} url
         * @param {object} [data]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @returns {Request}
         */

    }, {
        key: 'postJSON',
        value: function postJSON(url, data, successCallback, errorCallback) {
            return __sendJSON(url, POST, data, successCallback, errorCallback);
        }

        /**
         * normal PUT request
         * @param {string} url
         * @param {object} [data]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @returns {Request}
         */

    }, {
        key: 'put',
        value: function put(url, data, successCallback, errorCallback) {
            return __send(url, PUT, data, successCallback, errorCallback);
        }

        /**
         * JSON PUT request
         * @param {string} url
         * @param {object} [data]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @returns {Request}
         */

    }, {
        key: 'putJSON',
        value: function putJSON(url, data, successCallback, errorCallback) {
            return __sendJSON(url, PUT, data, successCallback, errorCallback);
        }

        /**
         * JSON DELETE request
         * @param {string} url
         * @param {object} [data]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @returns {Request}
         */

    }, {
        key: 'deleteJSON',
        value: function deleteJSON(url, data, successCallback, errorCallback) {
            return __sendJSON(url, DELETE, data, successCallback, errorCallback);
        }

        /**
         * Same as others, just allow specify method.
         * @param {string} url
         * @param {string} method
         * @param {object} [data]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @param {boolean} [isManual]
         * @returns {Request}
         */


        /**
         * Send JSON request and accepts only json
         * @param {string} url
         * @param {string} method
         * @param {object} [data]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @param {boolean} [isManual]
         * @returns {Request}
         */


        /**
         * Send file fnc
         * @param {string} url
         * @param {string} method
         * @param {object | Array} file
         * @param {string} [fieldName]
         * @param {function} [successCallback]
         * @param {function} [errorCallback]
         * @param {function} [progressCallback]
         * @returns {Request}
         * @private
         */


        /**
         * settings for gateway
         * @type {Object}
         */

    }]);

    return Gateway;
}();

/** PRIVATE METHODS **/
/**
 * private abstract send request method
 * @param {string} url
 * @param {string} method
 * @param {object} [data]
 * @param {function} [successCallback]
 * @param {function} [errorCallback]
 * @param {boolean} [isManual]
 * @returns {Request}
 * @private
 */


Gateway.send = __send;
Gateway.sendJSON = __sendJSON;
Gateway.sendFile = __sendFile;
Gateway.settings = config;
function __send(url, method, data, successCallback, errorCallback, isManual) {
    method = method.toUpperCase();
    var request = (0, _superagent2.default)(method, url.trim()).set('X-Requested-With', 'XMLHttpRequest').timeout(Gateway.settings.timeout);

    if (data) {
        if (method === GET && !(window.FormData && data instanceof window.FormData)) {
            request.query(data);
        } else {
            request.send(data);
        }
    }

    request.finish = function () {
        return request.end(__responseHandler(successCallback, errorCallback));
    };
    if (!isManual) {
        request.finish();
    }
    return request;
}

/**
 * Private abstract send JSON request method
 * @param {string} url
 * @param {string} method
 * @param {object} [data]
 * @param {function} [successCallback]
 * @param {function} [errorCallback]
 * @param {boolean} [isManual]
 * @returns {Request}
 * @private
 */
function __sendJSON(url, method, data, successCallback, errorCallback, isManual) {
    method = method.toUpperCase();
    var request = (0, _superagent2.default)(method, url.trim()).set({
        'Content-type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }).timeout(Gateway.settings.timeout);

    if (data) {
        if (method === GET) {
            request.query(data);
        } else {
            request.send(data);
        }
    }

    request.finish = function () {
        return request.end(__responseHandler(successCallback, errorCallback));
    };
    if (!isManual) {
        request.finish();
    }
    return request;
}

/**
 * Send file fnc
 * @param {string} url
 * @param {string} method
 * @param {object | Array} file
 * @param {string} [fieldName]
 * @param {function} [successCallback]
 * @param {function} [errorCallback]
 * @param {function} [progressCallback]
 * @returns {Request}
 * @private
 */
function __sendFile(url, method, file) {
    var fieldName = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'files';
    var successCallback = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : _noop3.default;
    var errorCallback = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : _noop3.default;
    var progressCallback = arguments[6];


    var request = (0, _superagent2.default)(method.toUpperCase(), url.trim()).set('X-Requested-With', 'XMLHttpRequest').timeout(config.fileTimeout);

    if ((0, _isArrayLike3.default)(file)) {
        (0, _each3.default)(file, function (f) {
            request.attach(fieldName, f);
        });
    } else {
        request.attach(fieldName, file);
    }
    if (progressCallback) {
        request.on('progress', progressCallback);
    }
    request.end(__responseHandler(successCallback, errorCallback));

    return request;
}

/**
 * Abstract response handler
 * @param {function} successCallback
 * @param {function} errorCallback
 * @returns {function}
 * @private
 */
function __responseHandler(successCallback, errorCallback) {
    return function __abstractHandler(err, response) {
        if (response && response.status === 302) {
            var redirectTo = response.body.location;
            // Do callback and then redirect
            if (successCallback(response) === false) {
                return false;
            }
            // Redirect
            if (process.env.NODE_ENV !== 'production' && !redirectTo) {
                throw new Error('Missing "location" attribute!');
            }
            window.location.assign(redirectTo);
            return;
        }
        if (err) {
            return errorCallback(err);
        }
        successCallback(response);
    };
}

/**
 * Set global configuration object
 * @param {object} conf
 * @returns {{timeout: number}}
 */
function configure(conf) {
    return (0, _extend3.default)(config, conf);
}

/** EXPORTS **/
exports.default = Gateway;
exports.configure = configure;