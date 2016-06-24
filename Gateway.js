'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.configure = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Global configuration
var config = {
    timeout: 10000,
    fileTimeout: 10000
};

var Gateway = {
    /**
     *  normal GET request to defined URL
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    get: function get(url, data, successCallback, errorCallback) {
        __send(url, 'GET', data, successCallback, errorCallback);
    },
    /**
     * JSON GET request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    getJSON: function getJSON(url, data, successCallback, errorCallback) {
        __sendJSON(url, 'GET', data, successCallback, errorCallback);
    },

    /**
     * normal POST request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    post: function post(url, data, successCallback, errorCallback) {
        __send(url, 'POST', data, successCallback, errorCallback);
    },
    /**
     * JSON POST request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    postJSON: function postJSON(url, data, successCallback, errorCallback) {
        __sendJSON(url, 'POST', data, successCallback, errorCallback);
    },
    /**
     * normal PUT request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    put: function put(url, data, successCallback, errorCallback) {
        __send(url, 'PUT', data, successCallback, errorCallback);
    },
    /**
     * JSON PUT request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    putJSON: function putJSON(url, data, successCallback, errorCallback) {
        __sendJSON(url, 'PUT', data, successCallback, errorCallback);
    },

    /**
     * JSON PUT request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    deleteJSON: function deleteJSON(url, data, successCallback, errorCallback) {
        __sendJSON(url, 'DELETE', data, successCallback, errorCallback);
    },

    /**
     * Same as others, just allow specify method.
     * @param url
     * @param method
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    send: __send,

    /**
     * Send JSON request and accepts only json
     * @param url
     * @param method
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    sendJSON: __sendJSON,

    /**
     * Send file fnc
     * @param url
     * @param method
     * @param file
     * @param fieldName
     * @param successCallback
     * @param errorCallback
     * @param progressCallback
     * @private
     */
    sendFile: __sendFile,

    /**
     * settings for gateway
     */
    settings: config
};

/** PRIVATE METHODS **/
/**
 * private abstract send request method
 * @param url
 * @param method
 * @param data
 * @param successCallback
 * @param errorCallback
 * @returns {Xhr}
 * @private
 */
function __send(url, method, data, successCallback, errorCallback) {
    method = method.toUpperCase();
    var r = (0, _superagent2.default)(method, url.trim()).set('X-Requested-With', 'XMLHttpRequest').timeout(Gateway.settings.timeout);

    if (data) {
        if (method === 'GET' && !(window.FormData && data instanceof window.FormData)) {
            r.query(data);
        } else {
            r.send(data);
        }
    }

    r.end(__responseHandler(successCallback, errorCallback));
}

/**
 * Private abstract send JSON request method
 * @param url
 * @param method
 * @param data
 * @param successCallback
 * @param errorCallback
 * @returns {Xhr}
 * @private
 */
function __sendJSON(url, method, data, successCallback, errorCallback) {
    method = method.toUpperCase();
    var r = (0, _superagent2.default)(method, url.trim()).set({
        'Content-type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }).timeout(Gateway.settings.timeout);

    if (data) {
        if (method === 'GET') {
            r.query(data);
        } else {
            r.send(data);
        }
    }

    r.end(__responseHandler(successCallback, errorCallback));
}

/**
 * Send file fnc
 * @param url
 * @param method
 * @param file
 * @param fieldName
 * @param successCallback
 * @param errorCallback
 * @param progressCallback
 * @private
 */
function __sendFile(url, method, file, fieldName, successCallback, errorCallback, progressCallback) {
    method = method || 'POST';
    fieldName = fieldName || 'files';
    successCallback = successCallback || _lodash2.default.noop;
    errorCallback = errorCallback || _lodash2.default.noop;

    var r = (0, _superagent2.default)(method.toUpperCase(), url.trim()).set('X-Requested-With', 'XMLHttpRequest').timeout(config.fileTimeout);

    if (_lodash2.default.isArrayLike(file)) {
        _lodash2.default.each(file, function (f) {
            r.attach(fieldName, f);
        });
    } else {
        r.attach(fieldName, file);
    }
    if (progressCallback) {
        r.on('progress', progressCallback);
    }
    r.end(__responseHandler(successCallback, errorCallback));
}

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
 * @param conf
 * @returns {{timeout: number}}
 */
function configure(conf) {
    var keys = Object.keys(conf),
        keysLength = keys.length;

    for (var i = 0; i < keysLength; i++) {
        config[keys[i]] = conf[keys[i]];
    }
    return config;
}

/** EXPORTS **/
exports.default = Gateway;
exports.configure = configure;