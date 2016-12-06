'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
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
  removeListener: __removeListener,

  /**
   * @inherit
   */
  onAnimation: __onAnimation,

  /**
   * @inherit
   */
  offAnimation: __offAnimation,

  /**
   * @inherit
   */
  onceAnimation: __onceAnimation
};

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
  var capture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

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
  var capture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

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
  var capture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  return target.removeEventListener(event, callback, capture);
}

/** ANIMATIONS **/
var ANIMATION_TYPE = {
  end: 'AnimationEnd',
  start: 'AnimationStart',
  iteration: 'AnimationIteration'
};

var ANIMATION_PREFIX = {
  'WebkitAnimation': 'webkit',
  'OAnimation': 'o'
};

/**
 * Finds Correct animation event name for current browser
 * @param type {string} enum:[start, end, iteration]
 * @returns {string} Animation Event name
 * @throws Incorrect animation type
 * @private
 */
function __whichAnimationEvent(type) {
  type = ANIMATION_TYPE[type.toLowerCase()];
  if (!type) {
    throw new Error('Incorrect animation type! Correct values: [start, end, iteration]');
  }
  var el = window.document.createElement('fakeelement'),
      prefix = '';

  for (var key in ANIMATION_PREFIX) {
    if (el.style[key] !== undefined) {
      prefix = ANIMATION_PREFIX[key];
      break;
    }
  }

  return prefix + !prefix ? type.toLowerCase() : type;
}

/**
 * Adds animation event listener
 * @param element {HTMLElement}
 * @param type {string} enum:[start, end, iteration]
 * @param callback {Function}
 * @param capture {boolean}
 * @returns {Function} - bound callback to remove listener
 * @private
 */
function __onAnimation(element, type, callback) {
  var capture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var eventName = __whichAnimationEvent(type);
  return __listen(element, eventName, callback, capture);
}

/**
 * Adds animation event listener and after first execution its removed
 * @param element {HTMLElement}
 * @param type {string} enum:[start, end, iteration]
 * @param callback {Function}
 * @param capture {boolean}
 * @returns {Function} - bound callback to remove listener
 * @private
 */
function __onceAnimation(element, type, callback) {
  var capture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var eventName = __whichAnimationEvent(type);
  return __listenOnce(element, eventName, callback, capture);
}

/**
 * Remove animation event listener
 * @param element {HTMLElement}
 * @param type {string} enum:[start, end, iteration]
 * @param callback {Function}
 * @param capture {boolean}
 * @returns {void}
 * @private
 */
function __offAnimation(element, type, callback) {
  var capture = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var eventName = __whichAnimationEvent(type);
  return __removeListener(element, eventName, callback, capture);
}

exports.default = Events;