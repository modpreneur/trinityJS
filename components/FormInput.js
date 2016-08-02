'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _classlist = require('trinity/utils/classlist');

var _classlist2 = _interopRequireDefault(_classlist);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Default is value
var TYPE_VAL_MAP = {
    radio: 'checked',
    checkbox: 'checked'
};

var FormInput = function () {
    function FormInput(element) {
        _classCallCheck(this, FormInput);

        this.element = element;
        this.errors = [];
        this.rules = [];
        this.messages = [];
        this.messageWrapper = document.createElement('div');

        var sibling = element.nextSibling;
        if (sibling) {
            element.parentElement.insertBefore(this.messageWrapper, sibling);
        } else {
            element.parentElement.appendChild(this.messageWrapper);
        }
    }

    _createClass(FormInput, [{
        key: 'getValue',
        value: function getValue() {
            return this.element[TYPE_VAL_MAP[this.element.type] || 'value'];
        }
    }, {
        key: 'isValid',
        value: function isValid() {
            return this.errors.length === 0 ? _classlist2.default.remove(this.element, 'error') || true : false;
        }
    }]);

    return FormInput;
}();

exports.default = FormInput;