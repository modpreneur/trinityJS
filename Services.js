/**
 * Created by fisa on 10/26/15.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ErrorService = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.messageService = messageService;

var _Dom = require('./utils/Dom.js');

var _Dom2 = _interopRequireDefault(_Dom);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Flash messages
 * @param message
 * @param type
 */
function messageService(message, type) {
    type = type || 'info';
    message = message || type;

    var ajaxInput = document.querySelector('.ajax-checkbox'),
        ajaxAlert = document.querySelector('.ajax-alert'),
        box = document.getElementById('flashMessages');

    if (!ajaxInput || !ajaxAlert) {
        console.log('MESSAGE', message);
        alert(message);
        return;
    }

    ajaxInput = ajaxInput.cloneNode(true);
    ajaxAlert = ajaxAlert.cloneNode(true);

    var iconClass = '';
    switch (type) {
        case 'success':
            {
                iconClass = 'trinity trinity-ok';
            }
            break;
        case 'warning':
            {
                iconClass = 'trinity trinity-warning';
            }
            break;
        case 'error':
        case 'danger':
            {
                type = 'danger';
                iconClass = 'tiecons tiecons-exclamation-mark-circle';
            }
            break;
        default:
            {
                iconClass = 'trinity trinity-info';
            }
            break;
    }

    // Assign new values
    var id = Math.floor(Math.random() * (9999 - 10));
    ajaxInput.setAttribute('id', 'close-alert-' + type + '-' + id);
    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{id}', id.toString()).replace('{message}', message).replace('{icon}', iconClass).replace('{type}', type);
    ajaxAlert.className = ajaxAlert.className.replace('{type}', type);

    _Dom2.default.classlist.remove(ajaxInput, 'ajax-checkbox');
    _Dom2.default.classlist.remove(ajaxAlert, 'ajax-alert');

    box.appendChild(ajaxInput);
    box.appendChild(ajaxAlert);

    if (type == 'success') {
        (function () {
            var timeOutId = setTimeout(function () {
                _Dom2.default.removeNode(ajaxInput);
                _Dom2.default.removeNode(ajaxAlert);
                clearTimeout(timeOutId); // just to be sure
            }, 2000);
        })();
    }
}

var ErrorService = exports.ErrorService = function () {
    function ErrorService() {
        _classCallCheck(this, ErrorService);
    }

    _createClass(ErrorService, null, [{
        key: 'ajaxError',
        value: function ajaxError(error) {
            if (error.timeout) {
                messageService('We apologize, our servers are full. Please try again in few seconds', 'error');
            }
            if (error.response) {
                var code = error.response.statusCode,
                    message = error.response.body && error.response.body.message;
                if (code >= 500) {
                    messageService(message || 'Oops, Something went wrong. Please try again later.', 'error');
                } else if (code === 400) {
                    messageService(message, 'error');
                } else if (code <= 403) {
                    //401 and 403 are about denying access
                    messageService(message || 'You don\'t have, permission to this action', 'error');
                } else if (code >= 404) {
                    messageService(message || 'We are sorry, but api does not exist yet.', 'info');
                }
            }

            if (DEVELOPMENT) {
                if (error.timeout) {
                    console.warn('Request timed out');
                } else {
                    console.error(error);
                    console.log(error.response);
                }
            }
            setTimeout(function () {
                throw new Error('Ajax Error');
            }, 0); // error will not stop flow
        }

        /**
         *
         * @param message
         */

    }, {
        key: 'dataError',
        value: function dataError(message) {
            messageService(message || 'We\'r sorry, but page was not loaded properly and some parts may not work.', 'warning');
            throw new Error('Data Error');
        }

        /**
         * Missing parts in Page
         * @param message {String} default = 'warning'
         * @param type {String}
         */

    }, {
        key: 'contentError',
        value: function contentError(message) {
            var type = arguments.length <= 1 || arguments[1] === undefined ? 'warning' : arguments[1];

            messageService(message || 'We\'r sorry, but page was not loaded properly and some parts may not work.', type);
            throw new Error('Content Error');
        }

        /**
         * Tests if scope have required keys
         * @param $scope {Object}
         * @param required {Array< String|Object<String {key}, boolean {multiple}> >}
         * @returns {Array<String|Object<String {key}, String {error}>>}
         */

    }, {
        key: 'testScope',
        value: function testScope($scope) {
            for (var _len = arguments.length, required = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                required[_key - 1] = arguments[_key];
            }

            return _lodash2.default.map(required, function (r) {
                if (_lodash2.default.isString(r)) {
                    if (!$scope[r]) {
                        return r;
                    }
                } else if ($scope[r.key]) {
                    if (r.multiple && !_lodash2.default.isArray($scope[r.key]) || !r.multiple && _lodash2.default.isArray($scope[r.key])) {
                        return r.key;
                    }
                } else {
                    return r.key;
                }
            });
        }
    }]);

    return ErrorService;
}();