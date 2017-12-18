'use strict';

import _noop from 'lodash/noop';
import _isArrayLike from 'lodash/isArrayLike';
import _each from 'lodash/each';
import _extend from 'lodash/extend';
import Request from 'superagent';

const GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE'
    ;

// Global configuration
let config = {
    timeout: 10000,
    fileTimeout: 10000
};

class Gateway {
    /**
     *  normal GET request to defined URL
     * @param {string} url
     * @param {object} [data]
     * @param {function} [successCallback]
     * @param {function} [errorCallback]
     * @returns {Request}
     */
    static get(url, data, successCallback, errorCallback){
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
    static getJSON(url, data, successCallback, errorCallback){
        return __sendJSON(url, GET,  data, successCallback, errorCallback);
    }

    /**
     * normal POST request
     * @param {string} url
     * @param {object} [data]
     * @param {function} [successCallback]
     * @param {function} [errorCallback]
     * @returns {Request}
     */
    static post(url, data, successCallback, errorCallback){
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
    static postJSON(url, data, successCallback, errorCallback){
        return __sendJSON(url, POST,  data, successCallback, errorCallback);
    }

    /**
     * normal PUT request
     * @param {string} url
     * @param {object} [data]
     * @param {function} [successCallback]
     * @param {function} [errorCallback]
     * @returns {Request}
     */
    static put(url, data, successCallback, errorCallback){
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
    static putJSON(url, data, successCallback, errorCallback){
        return __sendJSON(url, PUT,  data, successCallback, errorCallback);
    }

    /**
     * JSON DELETE request
     * @param {string} url
     * @param {object} [data]
     * @param {function} [successCallback]
     * @param {function} [errorCallback]
     * @returns {Request}
     */
    static deleteJSON(url, data, successCallback, errorCallback) {
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
    static send = __send;

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
    static sendJSON = __sendJSON;

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
    static sendFile = __sendFile;

    /**
     * settings for gateway
     * @type {Object}
     */
    static settings = config;
}


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
function __send(url, method = GET, data, successCallback, errorCallback, isManual){
    method = method.toUpperCase();
    let request = Request(method, url.trim())
        .set('X-Requested-With', 'XMLHttpRequest')
        .timeout(Gateway.settings.timeout);

    if(data){
        if(method === GET && !(window.FormData && data instanceof window.FormData)){
            request.query(data);
        } else {
            request.send(data);
        }
    }

    request.finish = () => request.end(__responseHandler(successCallback, errorCallback));
    if(!isManual){
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
function __sendJSON(url, method, data, successCallback, errorCallback, isManual){
    method = method.toUpperCase();
    let request = Request(method, url.trim())
        .set({
            'Content-type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        })
        .timeout(Gateway.settings.timeout);

    if(data){
        if(method === GET){
            request.query(data);
        } else {
            request.send(data);
        }
    }

    request.finish = () => request.end(__responseHandler(successCallback, errorCallback));
    if(!isManual){
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
function __sendFile(url, method, file, fieldName = 'files', successCallback =  _noop, errorCallback = _noop, progressCallback){

    let request = Request(method.toUpperCase(), url.trim())
        .set('X-Requested-With', 'XMLHttpRequest')
        .timeout(config.fileTimeout);

    if(_isArrayLike(file)){
        _each(file, f => {
            request.attach(fieldName, f);
        });
    } else {
        request.attach(fieldName, file);
    }
    if(progressCallback){
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
 * @param {object} conf
 * @returns {{timeout: number}}
 */
function configure(conf){
    return _extend(config, conf);
}

/** EXPORTS **/
export default Gateway;
export {configure};
