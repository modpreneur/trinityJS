/**
 * Created by fisa on 10/22/15.
 */
/**
 * Forked and inspired by atomic.js
 * @url https://github.com/toddmotto/atomic
 *
 * Updated: rewrited to google closure Xhr object style
 */
'use strict';

/** Preparation - ES5 (IE 9+, others) or IE8 **/
var XhrFactory = window.XMLHttpRequest || ActiveXObject;
var isES5 = typeof Object.keys === 'function';
/**
 * Wrapper of browser xhr request object
 */
class Xhr {
    /**
     * Create Xhr object wrapper
     * @param url {string}
     * @param method {string} enum [GET, POST, PUT, DELETE]
     * @param headers {Object}
     */
    constructor(url, method, headers){
        headers = headers || {};
        if(arguments.length < 3){
            throw new Error('Missing arguments!');
        }
        this.timeout = 0;
        this.isTimeout = false;
        this.callbacks = {
            complete: function(){},
            timeout: function(){}
        };
        // Create request @Note: request must be open before setting any header
        this.request = new XhrFactory('MSXML2.XMLHTTP.3.0');
        this.request.open(method, url, true);

        // Headers - default just add x-www-form-urlencoded
        if(!headers['Content-type']){
            headers['Content-type'] = 'application/x-www-form-urlencoded';
        }
        this.setHeaders(headers);
        console.log(headers);
    }

    /**
     * Set request headers
     * @param headers {Object}
     */
    setHeaders(headers){
        // ES 5 support ?
        if(isES5){
            let headerKeys = Object.keys(headers);
            let keysLenght = headerKeys.length;
            for(let i=0; i<keysLenght; i++){
                this.request.setRequestHeader(headerKeys[i], headers[headerKeys[i]]);
            }
        }
        // IE 8 :( slow
        else {
            for(var name in headers){
                if(headers.hasOwnProperty(name)){
                    this.request.setRequestHeader(name, headers[name]);
                }
            }
        }
    }

    /**
     * Set maximum timeout, after that request is aborted
     * default = 0 -> infinitive
     * @param timeout {Number}
     */
    setTimeoutInterval(timeout){
        this.timeout = timeout;
    }

    /**
     * Set callback for complete
     * @param callback {function}
     */
    onComplete(callback){
        this.callbacks.complete = callback;
    }

    /**
     * Set callback for timeout
     * @param callback {function}
     */
    onTimeout(callback){
        this.callbacks.timeout = callback;
    }

    /**
     * Sends request Data have to be type string
     * @param data {String}
     */
    send(data){
        // INITIALIZATION
        // Define main callback
        var self = this;
        this.request.onreadystatechange = function(){
            // 4 state = complete
            if(self.request.readyState === 4) {
                if(self.isTimeout){
                    self.callbacks.timeout.call(self);
                } else {
                    self.callbacks.complete.call(self);
                }
            }
        };
        // Timeout?
        if(this.timeout > 0){
            window.setTimeout(function(){
                self.isTimeout = true;
                self.request.abort();
            }, this.timeout)
        }
        // SEND
        this.request.send(data);
    }

    /**
     * Returns status of request
     * @returns {number}
     */
    getStatus(){
        return this.request.status;
    }

    /**
     * Returns value of header with name
     * @param name {string}
     * @returns {string}
     */
    getResponseHeader(name){
        return this.request.getResponseHeader(name);
    }

    /**
     * Returns all headers parsed into array
     * @returns {Array}
     */
    getResponseHeaders(){
        var headersString = this.request.getAllResponseHeaders();
        var headersTemp = headersString.split('\n');
        var headersLength = headersTemp.length;
        if(headersTemp[headersLength-1].length === 0){
            headersLength--;
        }
        var headers = new Array(headersLength);
        for(var i=0; i<headersLength; i++){
            var header = {};
            if(isES5){
                var index = headersTemp[i].indexOf(':');
                header[headersTemp[i].substring(0,index)] = headersTemp[i].substring(index+2);
            } else {
                var name = '';
                var value = '';
                var strLength = headersTemp[i].length;
                var isNamePart = true;
                for(var j=0; j<strLength; j++){
                    if(headersTemp[i][j] === ':'){
                        j++;
                        isNamePart = false;
                        continue;
                    }
                    if(isNamePart){
                        name += headersTemp[i][j];
                    } else {
                        value += headersTemp[i][j];
                    }
                }
                header[name] = value
            }
            // Add new Header to array
            headers[i] = header;
        }
        return headers;
    }

    /**
     * Return unparsed response
     * @returns {string}
     */
    getResponse(){
        return this.request.responseText;
    }

    /**
     * return parsed response
     * @returns {Object}
     */
    getResponseJson(){
        return JSON.parse(this.request.responseText);
    }

    /**
     * Check if request is success i.e. status code is 2xx
     * @returns {boolean}
     */
    isSuccess(){
        return this.request.status >= 200 && this.request.status < 300;
    }
}
export default Xhr;