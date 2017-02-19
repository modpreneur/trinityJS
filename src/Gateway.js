'use strict';

import _ from 'lodash';
import Request from 'superagent';

// Global configuration
let config = {
    timeout: 10000,
    fileTimeout: 10000
};

let Gateway = {
    /**
     *  normal GET request to defined URL
     * @param url {string}
     * @param data [object]
     * @param successCallback [function]
     * @param errorCallback [function]
     */
    get: function get(url, data, successCallback, errorCallback){
        __send(url,'GET', data, successCallback, errorCallback);
    },
    /**
     * JSON GET request
     * @param url {string}
     * @param data [object]
     * @param successCallback [function]
     * @param errorCallback [function]
     */
    getJSON: function getJSON(url, data, successCallback, errorCallback){
        __sendJSON(url, 'GET',  data, successCallback, errorCallback);
    },

    /**
     * normal POST request
     * @param url {string}
     * @param data [object]
     * @param successCallback [function]
     * @param errorCallback [function]
     */
    post: function post(url, data, successCallback, errorCallback){
        __send(url, 'POST', data, successCallback, errorCallback);
    },
    /**
     * JSON POST request
     * @param url {string}
     * @param data [object]
     * @param successCallback [function]
     * @param errorCallback [function]
     */
    postJSON: function postJSON(url, data, successCallback, errorCallback){
        __sendJSON(url, 'POST',  data, successCallback, errorCallback);
    },
    /**
     * normal PUT request
     * @param url {string}
     * @param data [object]
     * @param successCallback [function]
     * @param errorCallback [function]
     */
    put: function put(url, data, successCallback, errorCallback){
        __send(url,'PUT', data, successCallback, errorCallback);
    },
    /**
     * JSON PUT request
     * @param url {string}
     * @param data [object]
     * @param successCallback [function]
     * @param errorCallback [function]
     */
    putJSON: function putJSON(url, data, successCallback, errorCallback){
        __sendJSON(url, 'PUT',  data, successCallback, errorCallback);
    },

    /**
     * JSON DELETE request
     * @param url {string}
     * @param data [object]
     * @param successCallback [function]
     * @param errorCallback [function]
     */
    deleteJSON: function deleteJSON(url, data, successCallback, errorCallback) {
        __sendJSON(url, 'DELETE', data, successCallback, errorCallback);
    },

    /**
     * Same as others, just allow specify method.
     * @param url {string}
     * @param method {string}
     * @param data [object]
     * @param successCallback [function]
     * @param errorCallback [function]
     */
    send: __send,

    /**
     * Send JSON request and accepts only json
     * @param url {string}
     * @param method {string}
     * @param data [object]
     * @param successCallback [function]
     * @param errorCallback [function]
     */
    sendJSON: __sendJSON,

    /**
     * Send file fnc
     * @param url {string}
     * @param method {string}
     * @param file {object}
     * @param fieldName [string]
     * @param successCallback [function]
     * @param errorCallback [function]
     * @param progressCallback [function]
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
 * @param url {string}
 * @param method {string}
 * @param [data] {object}
 * @param successCallback {function}
 * @param errorCallback {function}
 * @param [isManual] {boolean}
 * @returns {Xhr}
 * @private
 */
function __send(url, method, data, successCallback, errorCallback, isManual){
    method = method.toUpperCase();
    let r = Request(method, url.trim())
        .set('X-Requested-With', 'XMLHttpRequest')
        .timeout(Gateway.settings.timeout);

    if(data){
        if(method === 'GET' && !(window.FormData && data instanceof window.FormData)){
            r.query(data);
        } else {
            r.send(data);
        }
    }

    r.finish = () => r.end(__responseHandler(successCallback, errorCallback));
    if(isManual){
        return r;
    }
    r.finish();
}

/**
 * Private abstract send JSON request method
 * @param url {string}
 * @param method {string}
 * @param [data] {object}
 * @param successCallback {function}
 * @param errorCallback {function}
 * @param [isManual] {boolean}
 * @returns {Xhr}
 * @private
 */
function __sendJSON(url, method, data, successCallback, errorCallback, isManual){
    method = method.toUpperCase();
    let r = Request(method, url.trim())
        .set({
            'Content-type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        })
        .timeout(Gateway.settings.timeout);

    if(data){
        if(method === 'GET'){
            r.query(data);
        } else {
            r.send(data);
        }
    }

    r.finish = () => r.end(__responseHandler(successCallback, errorCallback));
    if(isManual){
        return r;
    }
    r.finish();
}

/**
 * Send file fnc
 * @param url {string}
 * @param method {string}
 * @param file {object}
 * @param fieldName [string]
 * @param successCallback [function]
 * @param errorCallback [function]
 * @param progressCallback [function]
 * @private
 */
function __sendFile(url, method, file, fieldName, successCallback, errorCallback, progressCallback){
    method = method || 'POST';
    fieldName = fieldName || 'files';
    successCallback = successCallback || _.noop;
    errorCallback = errorCallback || _.noop;

    let r = Request(method.toUpperCase(), url.trim())
        .set('X-Requested-With', 'XMLHttpRequest')
        .timeout(config.fileTimeout);

    if(_.isArrayLike(file)){
        _.each(file, f => {
            r.attach(fieldName, f);
        });
    } else {
        r.attach(fieldName, file);
    }
    if(progressCallback){
        r.on('progress', progressCallback);
    }
    r.end(__responseHandler(successCallback, errorCallback));
}

/**
 * Abstract response handler
 * @param successCallback {function}
 * @param errorCallback {function}
 * @returns {function}
 * @private
 */
function __responseHandler(successCallback, errorCallback){
    return function __abstractHandler(err, response){
        if(response && response.status === 302) {
            let redirectTo = response.body.location;
            // Do callback and then redirect
            if(successCallback(response) === false){
                return false;
            }
            // Redirect
            if(process.env.NODE_ENV !== 'production' && !redirectTo){
                throw new Error('Missing "location" attribute!');
            }
            window.location.assign(redirectTo);
            return;
        }
        if(err){
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
function configure(conf){
    return _.extend(config, conf);
}

/** EXPORTS **/
export default Gateway;
export {configure};
