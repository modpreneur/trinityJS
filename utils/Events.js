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
  removeListener: __removeListener
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
function __listen(target, event, callback, capture) {
  capture = capture || false;
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
function __listenOnce(target, event, callback, capture) {
  capture = capture || false;
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
function __removeListener(target, event, callback, capture) {
  capture = capture || false;
  return target.removeEventListener(event, callback, capture);
}

exports.default = Events;