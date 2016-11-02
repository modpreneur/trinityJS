/**
 * Created by fisa on 11/9/15.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _App = require('./App');

var _App2 = _interopRequireDefault(_App);

var _Controller = require('./Controller');

var _Controller2 = _interopRequireDefault(_Controller);

var _Router = require('./Router');

var _Router2 = _interopRequireDefault(_Router);

var _Services = require('./Services');

var Services = _interopRequireWildcard(_Services);

var _Gateway = require('./Gateway');

var _Gateway2 = _interopRequireDefault(_Gateway);

var _Store = require('./Store');

var _Store2 = _interopRequireDefault(_Store);

var _Collection = require('./Collection');

var _Collection2 = _interopRequireDefault(_Collection);

var _TrinityForm = require('./components/TrinityForm');

var _TrinityForm2 = _interopRequireDefault(_TrinityForm);

var _TrinityTab = require('./components/TrinityTab');

var _TrinityTab2 = _interopRequireDefault(_TrinityTab);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Just export all from trinity
 */
exports.default = {
  // Core
  App: _App2.default,
  Controller: _Controller2.default,
  Router: _Router2.default,

  // standalone utils
  Gateway: _Gateway2.default,
  Store: _Store2.default,
  Services: Services,
  Collection: _Collection2.default,
  TrinityForm: _TrinityForm2.default,
  TrinityTab: _TrinityTab2.default
};