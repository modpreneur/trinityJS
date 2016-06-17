'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Events = {
    /**
     * Abbreviation for target.addEventListener
     * @param target {HTMLElement}
     * @param event {string}
     * @param callback {function}
     * @param capture [boolean]
     * @returns {function}
     */
    on: __listen,

    /**
     * Abbreviation for target.addEventListener
     * @param target {HTMLElement}
     * @param event {string}
     * @param callback {function}
     * @param capture [boolean]
     * @returns {function}
     */
    listen: __listen,

    /**
     * Adds wrapper around function and after first invocation, remove listener
     * @Note Returns correct listener for removing
     * @param target {HTMLElement}
     * @param event {string}
     * @param callback {function}
     * @param capture [boolean]
     * @returns {function}
     */
    once: __listenOnce,

    /**
     * Adds wrapper around function and after first invocation, remove listener
     * @Note Returns correct listener for removing
     * @param target {HTMLElement}
     * @param event {string}
     * @param callback {function}
     * @param capture [boolean]
     * @returns {function}
     */
    listenOnce: __listenOnce,

    /**
     * Abbreviation for target.removeEventListener
     * @param target {HTMLElement}
     * @param event {string}
     * @param callback {function}
     * @param capture [boolean]
     * @returns {void}
     */
    off: __removeListener,

    /**
     * Abbreviation for target.removeEventListener
     * @param target {HTMLElement}
     * @param event {string}
     * @param callback {function}
     * @param capture [boolean]
     * @returns {void}
     */
    unlisten: __removeListener,

    /**
     * Abbreviation for target.removeEventListener
     * @param target {HTMLElement}
     * @param event {string}
     * @param callback {function}
     * @param capture [boolean]
     * @returns {void}
     */
    removeListener: __removeListener
};

var animationEventNames = ['webkitAnimationEnd', 'mozAnimationEnd', 'MSAnimationEnd', 'oanimationend', 'animationend'];

/**
 * Abbreviation for target.addEventListener
 * @param target {HTMLElement}
 * @param event {string}
 * @param callback {function}
 * @param capture [boolean]
 * @returns {function}
 * @private
 */
function __listen(target, event, callback) {
    var capture = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

    if (animationEventNames.indexOf(event) > -1) {
        return __addAnimationEndListener(target, callback, capture);
    }
    target.addEventListener(event, callback, capture);
    return __removeListener.bind(null, target, event, callback, capture);
}

/**
 * Adds wrapper around function and after first invocation, remove listener
 * @Note Returns correct listener for removing
 * @param target {HTMLElement}
 * @param event {string}
 * @param callback {function}
 * @param capture [boolean]
 * @private
 * @returns {function}
 */
function __listenOnce(target, event, callback) {
    var capture = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

    if (animationEventNames.indexOf(event) > -1) {
        return __onceOnAnimationEnd(target, callback, capture);
    }
    var wrapper = function () {
        return function (e) {
            target.removeEventListener(event, wrapper, capture);
            callback(e);
        };
    }();
    target.addEventListener(event, wrapper, capture);
    return __removeListener.bind(null, target, event, wrapper, capture);
}

/**
 * Abbreviation for target.removeEventListener
 * @param target {HTMLElement}
 * @param event {string}
 * @param callback {function}
 * @param capture [boolean]
 * @returns {void}
 * @private
 */
function __removeListener(target, event, callback) {
    var capture = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

    if (animationEventNames.indexOf(event) > -1) {
        return __removeAnimationEndListener(target, callback, capture);
    }
    return target.removeEventListener(event, callback, capture);
}

/**
 *
 * @param element {HTMLElement}
 * @param callback {function}
 * @param capture {boolean}
 * @returns {function(this:null)}
 * @private
 */
function __onceOnAnimationEnd(element, callback, capture) {
    var finishFnc = function finishFnc() {
        __removeAnimationEndListener(element, finishFnc, capture);
        callback();
    };
    __addAnimationEndListener(element, finishFnc, capture);
    return __removeAnimationEndListener.bind(null, element, finishFnc, capture);
}

/**
 *
 * @param element {HTMLElement}
 * @param callback {function}
 * @param capture {boolean}
 * @returns {function(this:null)}
 * @private
 */
function __addAnimationEndListener(element, callback, capture) {
    _lodash2.default.each(animationEventNames, function (eventName) {
        element.addEventListener(eventName, callback, capture);
    });
    return __removeAnimationEndListener.bind(null, element, callback, capture);
}

/**
 *
 * @param element {HTMLElement}
 * @param callback {function}
 * @param capture {boolean}
 * @returns {void}
 * @private
 */
function __removeAnimationEndListener(element, callback, capture) {
    _lodash2.default.each(animationEventNames, function (eventName) {
        element.removeEventListener(eventName, callback, capture);
    });
}
exports.default = Events;