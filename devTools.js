/**
 * Created by fisa on 11/11/15.
 */
'use strict';
/**
 * DevTools should just extend normal framework components with debugging features.
 * For example Debug object is extended with some methods and mode is automatically set to 'dev'
 *
 * TODO: This is just try (prove of concept), all needs to be more deeply considered.
 */

var _Debug = require('./Debug');

var _Debug2 = _interopRequireDefault(_Debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Debug2.default.dump = function () {
  window.document.documentElement.innerHTML = Array.prototype.join.call(arguments, '<br><br>');
};