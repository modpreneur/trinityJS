'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TrinityTab = exports.TrinityForm = undefined;

var _TrinityForm = require('./components/TrinityForm.js');

var _TrinityForm2 = _interopRequireDefault(_TrinityForm);

var _TrinityTab = require('./components/TrinityTab.js');

var _TrinityTab2 = _interopRequireDefault(_TrinityTab);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by fisa on 12/16/15.
 */
var TrinityForm = exports.TrinityForm = _TrinityForm2.default;
var TrinityTab = exports.TrinityTab = _TrinityTab2.default;

// Default export All
exports.default = {
  TrinityForm: TrinityForm,
  TrinityTab: TrinityTab
};