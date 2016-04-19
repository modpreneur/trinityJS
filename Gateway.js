'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Xhr = require('./utils/Xhr.js');

var _Xhr2 = _interopRequireDefault(_Xhr);

var _Debug = require('./Debug');

var _Debug2 = _interopRequireDefault(_Debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by fisa on 7/27/15.
 */

var Gateway = {
    /**
     *  normal GET request to defined URL
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    get: function get(url, data, successCallback, errorCallback) {
        _send(url, 'GET', data, successCallback, errorCallback);
    },
    /**
     * JSON GET request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    getJSON: function getJSON(url, data, successCallback, errorCallback) {
        _sendJSON(url, 'GET', data, successCallback, errorCallback);
    },

    /**
     * normal POST request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    post: function post(url, data, successCallback, errorCallback) {
        _send(url, 'POST', data, successCallback, errorCallback);
    },
    /**
     * JSON POST request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    postJSON: function postJSON(url, data, successCallback, errorCallback) {
        _sendJSON(url, 'POST', data, successCallback, errorCallback);
    },
    /**
     * normal PUT request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    put: function put(url, data, successCallback, errorCallback) {
        _send(url, 'PUT', data, successCallback, errorCallback);
    },
    /**
     * JSON PUT request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    putJSON: function putJSON(url, data, successCallback, errorCallback) {
        _sendJSON(url, 'PUT', data, successCallback, errorCallback);
    },
    /**
     * JSON PUT request
     * @param url
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    deleteJSON: function deleteJSON(url, data, successCallback, errorCallback) {
        _sendJSON(url, 'DELETE', data, successCallback, errorCallback);
    },
    /**
     * Same as others, just allow specify method.
     * @param url
     * @param method
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    send: _send,

    /**
     * Send JSON request and accepts only json
     * @param url
     * @param method
     * @param data
     * @param successCallback
     * @param errorCallback
     */
    sendJSON: _sendJSON,

    /**
     * File send
     * @param url
     * @param method
     * @param file
     * @param fieldName
     * @param successCallback
     * @param errorCallback
     * @param progressCallback
     * @private
     */
    sendFile: _sendFile,

    /**
     * settings for gateway
     * TODO: consider how to globally get settings ?
     */
    settings: {
        debug: false,
        timeout: 10000
    }
};

exports.default = Gateway;

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

function _send(url, method, data, successCallback, errorCallback) {
    if (method.toUpperCase() === 'GET' && data) {
        url = [url.trim(), _createQuery(data)].join('');
        data = null;
    }
    var xhr = _createRequest(url, method, successCallback, errorCallback);
    xhr.send(data);
    return xhr;
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
function _sendJSON(url, method, data, successCallback, errorCallback) {
    if (method.toUpperCase() === 'GET' && data) {
        url = [url.trim(), _createQuery(data)].join('');
        data = null;
    }
    var xhr = _createJSONRequest(url.trim(), method, successCallback, errorCallback);
    xhr.send(data ? JSON.stringify(data) : null);
    return xhr;
}

/**
 * File send
 * @param url
 * @param method
 * @param file
 * @param fieldName
 * @param successCallback
 * @param errorCallback
 * @param progressCallback
 * @private
 */
function _sendFile(url, method, file, fieldName, successCallback, errorCallback, progressCallback) {
    url = url.trim();

    var formData = new FormData();
    if (Array.isArray(file) || file['length'] !== undefined) {
        var fLength = file.length;
        for (var i = 0; i < fLength; i++) {
            formData.append(fieldName || file[i].name, file[i]);
        }
    } else {
        formData.append(fieldName || file.name, file);
    }

    var xhr = new _Xhr2.default(url, method, {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    });
    xhr.setTimeoutInterval(Gateway.settings.timeout);
    xhr.onTimeout(function () {
        _Debug2.default.error('AJAX REQUEST TIMED OUT!');
        errorCallback({ timeout: true });
    });
    xhr.onComplete(function () {
        if (this.getResponseHeader('Content-Type').indexOf('application/json') === -1) {
            if (_Debug2.default.isDev()) {
                _Debug2.default.log('HEADERS', this.getResponseHeaders());
                _dumpOnScreen(this.getResponse());
            }
            _Debug2.default.error('Content-Type application/json expected! got:', this.getResponse());
            return false;
        }
        if (this.isSuccess()) {
            successCallback(this.getResponseJson());
        } else if (302 === this.getStatus()) {
            var resp = this.getResponseJson(),
                redirectTo = resp.location;
            // Do callback and then redirect
            if (successCallback(resp) === false) {
                return false;
            }
            // Redirect
            if (!redirectTo) {
                return errorCallback({ Error: 'Missing "location" attribute!' });
            }
            window.location.assign(redirectTo);
        } else {
            _Debug2.default.error('RESPONSE:', this.getResponseJson());
            errorCallback(this.getResponseJson().error);
        }
    });

    if (progressCallback) {
        xhr.request.upload.onprogress = progressCallback;
    }

    xhr.send(formData);
    return xhr;
}

/**
 * Create normal request not expecting json response
 * @param url
 * @param method
 * @param sC
 * @param eC
 * @private
 */
function _createRequest(url, method, sC, eC) {
    if (arguments.length < 4) {
        throw new Error('Not all arguments defined!');
    }
    var xhr = new _Xhr2.default(url, method, {
        'Content-type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html',
        'X-Requested-With': 'XMLHttpRequest'
    });

    xhr.setTimeoutInterval(Gateway.settings.timeout);
    xhr.onTimeout(function () {
        _Debug2.default.error('AJAX REQUEST TIMED OUT!');
        eC({ timeout: true });
    });
    xhr.onComplete(function () {
        if (this.getResponseHeader('Content-Type').indexOf('text/html') === -1) {
            if (_Debug2.default.isDev()) {
                _Debug2.default.log('HEADERS', this.getResponseHeaders());
                _dumpOnScreen(this.getResponse());
            }
            _Debug2.default.error('Content-Type text/html expected! got:', this.getResponse());
            return false;
        }
        if (this.isSuccess()) {
            sC(this.getResponse());
        } else {
            if (_Debug2.default.isDev()) {
                _Debug2.default.error('RESPONSE:', this.getResponse());
                _dumpOnScreen(this.getResponse());
            }

            eC(this.getResponseJson());
        }
    });
    return xhr;
}

/**
 * Create JSON request
 * @param url
 * @param method
 * @param sC
 * @param eC
 * @private
 */
function _createJSONRequest(url, method, sC, eC) {
    if (arguments.length < 4) {
        throw new Error('Not all arguments defined!');
    }
    var xhr = new _Xhr2.default(url, method, {
        'Content-type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    });

    xhr.setTimeoutInterval(Gateway.settings.timeout);
    xhr.onTimeout(function () {
        _Debug2.default.error('AJAX REQUEST TIMED OUT!');
        eC({ timeout: true });
    });
    xhr.onComplete(function () {
        if (this.getResponseHeader('Content-Type') !== 'application/json') {
            if (_Debug2.default.isDev()) {
                _Debug2.default.log('HEADERS', this.getResponseHeaders());
                //TODO:  Test if ladyBug
                _dumpOnScreen(this.getResponse());
            }
            _Debug2.default.error('Content-Type JSON expected! got:', this.getResponse());
            return false;
        }
        if (this.isSuccess()) {
            sC(this.getResponseJson());
        } else if (302 === this.getStatus()) {
            var resp = this.getResponseJson(),
                redirectTo = resp.location;
            // Do callback and then redirect
            if (sC(resp) === false) {
                return false;
            }
            // Redirect
            if (!redirectTo) {
                return eC({ Error: 'Missing "location" attribute!' });
            }
            window.location.assign(redirectTo);
        } else {
            _Debug2.default.error('RESPONSE:', this.getResponseJson());
            // TODO: It would be correct to return only response, not parse error!!!
            eC(this.getResponseJson().error);
        }
    });
    return xhr;
}

/**
 * Create query string from data
 * @param data
 * @returns {string}
 * @private
 */
function _createQuery(data) {
    var keys = Object.keys(data),
        keysLength = keys.length,
        query = new Array(keysLength);
    for (var i = 0; i < keysLength; i++) {
        query[i] = keys[i] + '=' + data[keys[i]];
    }
    return '?' + query.join('&');
}

/**
 * Dump response on screen
 * @param response
 * @private
 */
function _dumpOnScreen(response) {
    _Debug2.default.dump(response);
}