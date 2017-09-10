'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Dom = require('../utils/Dom');

var _Dom2 = _interopRequireDefault(_Dom);

var _classlist = require('../utils/classlist');

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
        this.rules = [];
        this.errors = [];
        this.message = null;
        this.msgWrapper = _Dom2.default.createDom('div', { 'class': 'form-msg-wrapper' });
        this.errorWrapper = _Dom2.default.createDom('div', { 'class': 'form-error-wrapper' });

        var sibling = element.nextSibling;
        if (sibling) {
            element.parentElement.insertBefore(this.msgWrapper, sibling);
        } else {
            element.parentElement.appendChild(this.msgWrapper);
        }
        this.msgWrapper.appendChild(this.errorWrapper);
    }

    /**
     * Returns value of input element
     * It depends on type of element, if checkbox or radio, returns value of checked property
     * @returns {*}
     */


    _createClass(FormInput, [{
        key: 'getValue',
        value: function getValue() {
            return this.element[TYPE_VAL_MAP[this.element.type] || 'value'];
        }

        /**
         * Validates if input has any error, if not removes 'error' className
         * @returns {boolean}
         */

    }, {
        key: 'isValid',
        value: function isValid() {
            return this.errors.length === 0 ? _classlist2.default.remove(this.element, 'error') || true : false;
        }

        /**
         * Adds error to form input
         * @param error
         * @returns {*}
         */

    }, {
        key: 'addError',
        value: function addError(error) {
            this.errors.push(error);
            this.errorWrapper.appendChild(error.element);
            _Dom2.default.classlist.add(this.element, 'error');
            return error.id;
        }

        /**
         * Set information message to input
         * @param msg
         * @returns {*}
         */

    }, {
        key: 'setMessage',
        value: function setMessage(msg) {
            this.clearMessage();
            this.message = msg;
            this.msgWrapper.appendChild(msg.element);
            return msg.id;
        }

        /**
         * Delete message
         */

    }, {
        key: 'clearMessage',
        value: function clearMessage() {
            if (this.message) {
                _Dom2.default.removeNode(this.message.element);
                this.message = null;
            }
        }
    }]);

    return FormInput;
}();

exports.default = FormInput;