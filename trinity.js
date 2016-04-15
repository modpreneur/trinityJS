'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _App = require('./App');

var _App2 = _interopRequireDefault(_App);

var _App3 = require('./App.new');

var _App4 = _interopRequireDefault(_App3);

var _Controller = require('./Controller');

var _Controller2 = _interopRequireDefault(_Controller);

var _Router = require('./Router');

var _Router2 = _interopRequireDefault(_Router);

var _Debug = require('./Debug');

var _Debug2 = _interopRequireDefault(_Debug);

var _Services = require('./Services');

var Services = _interopRequireWildcard(_Services);

var _Gateway = require('./Gateway');

var _Gateway2 = _interopRequireDefault(_Gateway);

var _Store = require('./Store');

var _Store2 = _interopRequireDefault(_Store);

var _Collection = require('./Collection');

var _Collection2 = _interopRequireDefault(_Collection);

var _components = require('./components');

var _components2 = _interopRequireDefault(_components);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Just export all from trinity
 */
/**
 * Created by fisa on 11/9/15.
 */
exports.default = {
  // Core
  App: _App2.default,
  AppNew: _App4.default,
  Controller: _Controller2.default,
  Router: _Router2.default,
  Debug: _Debug2.default,

  // standalone utils
  Gateway: _Gateway2.default,
  Store: _Store2.default,
  Services: Services,
  Collection: _Collection2.default,

  // depends on Gateway, Store and Services
  components: _components2.default
};