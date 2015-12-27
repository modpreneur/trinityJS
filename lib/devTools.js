'use strict';

var _Gateway = require('./Gateway.js');

var _Gateway2 = _interopRequireDefault(_Gateway);

var _TrinityForm = require('./TrinityForm.js');

var _TrinityForm2 = _interopRequireDefault(_TrinityForm);

var _Router = require('./Router.js');

var _Router2 = _interopRequireDefault(_Router);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_Router2.default.settings.debug = true; /**
                                         * Created by fisa on 11/11/15.
                                         */
/**
 * DevTools should just extend normal framework components with debugging features.
 * For example Gateway is behaving differently in order to provide as much info as
 * possible when something goes wrong
 *
 * TODO: This is just try (prove of concept), all needs to be more deeply considered.
 */

_Gateway2.default.settings.debug = true;
_TrinityForm2.default.settings.debug = true;