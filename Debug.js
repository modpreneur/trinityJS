'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function noop() {/*Nothing will happen*/}

var Debug = function () {
    function Debug() {
        _classCallCheck(this, Debug);
    }

    _createClass(Debug, null, [{
        key: 'error',
        value: function error() {
            if (process.env.NODE_ENV !== 'production') {
                console.error.apply(console, arguments);
            }
        }
    }, {
        key: 'log',
        value: function log() {
            if (process.env.NODE_ENV !== 'production') {
                console.log.apply(console, arguments);
            }
        }
    }]);

    return Debug;
}();

/** Class Extensions - default just empty function **/


exports.default = Debug;
Debug.dump = noop;