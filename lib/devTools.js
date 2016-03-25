'use strict';

var _arguments = arguments; /**
                             * Created by fisa on 11/11/15.
                             */
/**
 * DevTools should just extend normal framework components with debugging features.
 * For example Gateway is behaving differently in order to provide as much info as
 * possible when something goes wrong
 *
 * TODO: This is just try (prove of concept), all needs to be more deeply considered.
 */

var _Debug = require('./Debug');

var _Debug2 = _interopRequireDefault(_Debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Debug2.default.env = 'dev';
_Debug2.default.dump = function () {
  window.document.documentElement.innerHTML = _arguments.join('<br><br>');
};