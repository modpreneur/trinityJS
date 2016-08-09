'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _fbemitter = require('fbemitter');

var _Events = require('../utils/Events');

var _Events2 = _interopRequireDefault(_Events);

var _TrinityEvent = require('../utils/TrinityEvent');

var _TrinityEvent2 = _interopRequireDefault(_TrinityEvent);

var _FormInput = require('./FormInput');

var _FormInput2 = _interopRequireDefault(_FormInput);

var _Dom = require('../utils/Dom');

var _Dom2 = _interopRequireDefault(_Dom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Default FORM settings
 * @type {{
 *      button: {loading: string, success: string, error: string, ready: string},
 *      successTimeout: number
 *   }}
 */
var defaultSettings = {
    button: { // Defines which classes add to active button in which state
        loading: 'trinity-form-loading',
        success: 'trinity-form-success',
        timeout: 'trinity-form-timeout',
        error: 'trinity-form-error',
        ready: 'trinity-form-ready'
    },
    requestTimeout: 10000,
    successTimeout: 3000,
    timeoutTimeout: 2000,
    errorTemplate: function errorTemplate(message) {
        return '<div>' + message + '</div>';
    },
    messageTemplate: function messageTemplate(message) {
        return '<div>' + message + '</div>';
    }
};

var IS_FORM_DATA = !!window.FormData;
var INPUT_TYPE_FILTER = ['radio', 'checkbox'];

/**
 * Connects to formElement and change it to ajax form
 *
 * @param form {HTMLFormElement}
 * @param [type] {String} - type of form
 * @param [settings] {Object}
 * @constructor
 */

var TrinityForm = function (_EventEmitter) {
    _inherits(TrinityForm, _EventEmitter);

    function TrinityForm(formElement, settings) {
        _classCallCheck(this, TrinityForm);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TrinityForm).call(this));

        if (!formElement) {
            throw new Error('Missing "formElement" parameter!');
        }
        _this.form = formElement;
        _this.buttons = formElement.querySelectorAll('input[type="submit"], button[type="submit"]');
        _this.activeBtn = null;
        _this.settings = _lodash2.default.defaultsDeep(settings || {}, defaultSettings);
        _this.__state = 'ready';
        _this.__inputs = {};

        //Main initialize
        // Create inputs
        _lodash2.default.each(_this.form, function (el) {
            if (el.name && !~INPUT_TYPE_FILTER.indexOf(el.type)) {
                _this.__inputs[el.name] = new _FormInput2.default(el);
            }
        });

        // Add ready class to all buttons
        var btnReadyClass = _this.settings.button['ready'].split(' ');
        _lodash2.default.each(_this.buttons, function (btn) {
            return _Dom2.default.classlist.addAll(btn, btnReadyClass);
        });

        // Listeners at last
        // Add listener to form element
        _this.unlistenSubmit = _Events2.default.listen(formElement, 'submit', _this.submit.bind(_this));
        // Add listener for input value change
        _this.unlistenValueChange = _Events2.default.listen(formElement, 'input', _this.onInputChange.bind(_this));
        return _this;
    }

    /**
     * Sets new form state
     *  - add state classes to button
     *  - emit "state-change" event
     * @param newState
     */


    _createClass(TrinityForm, [{
        key: 'lock',


        /**
         * Disable all forms submit inputs
         */
        value: function lock() {
            _lodash2.default.each(this.buttons, _Dom2.default.disable);
        }

        /**
         * Enable all forms submit inputs
         */

    }, {
        key: 'unlock',
        value: function unlock() {
            return this.state !== 'loading' && !!_lodash2.default.each(this.buttons, _Dom2.default.enable);
        }
        /**
         * Returns name of the form
         * @returns {string}
         */

    }, {
        key: 'getName',
        value: function getName() {
            return this.form.getAttribute('name');
        }
    }, {
        key: 'onInputChange',
        value: function onInputChange(e) {
            // Only elements with name can be tested
            if (!e.target.name) {
                return;
            }
            var inputObj = this.__inputs[e.target.name];
            if (!inputObj) {
                return;
            }
            inputObj.errors = _lodash2.default.filter(inputObj.errors, function (err) {
                if (!_lodash2.default.isFunction(err.validate) || err.validate(inputObj.getValue(), inputObj.element)) {
                    _Dom2.default.removeNode(err.element);
                    return false;
                }
                return true;
            });
            this.validate();
        }
    }, {
        key: 'addRule',
        value: function addRule(element, validator) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + (_lodash2.default.isString(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }
            return !!inputObj.rules.push(validator);
        }

        /**
         * Adds new error to TrinityForm instance
         * @param element {string || HTMLElement} - input name or instance itself
         * @param error {string || object}
         * @public
         */

    }, {
        key: 'addError',
        value: function addError(element, error) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + (_lodash2.default.isString(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }
            this.state = 'error';
            return __addError(inputObj, error, this.settings.errorTemplate);
        }
    }, {
        key: 'hasError',
        value: function hasError(element, errorKey) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + (_lodash2.default.isString(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }
            return _lodash2.default.some(inputObj.errors, function (err) {
                return err.key === errorKey;
            });
        }
    }, {
        key: 'removeError',
        value: function removeError(element, errorKey) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + (_lodash2.default.isString(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }

            _lodash2.default.remove(inputObj.errors, function (err) {
                return err.key === errorKey && !!_Dom2.default.removeNode(err.element);
            });
            this.validate();
        }
    }, {
        key: 'addMessage',
        value: function addMessage(element, message) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + (_lodash2.default.isString(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }

            return __addMessage(inputObj, message, this.settings.messageTemplate);
        }
    }, {
        key: 'hasMessage',
        value: function hasMessage(element, key) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + (_lodash2.default.isString(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }
            return _lodash2.default.some(inputObj.messages, function (msg) {
                return msg.key === key;
            });
        }
    }, {
        key: 'removeMessage',
        value: function removeMessage(element, key) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + (_lodash2.default.isString(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }
            _lodash2.default.remove(inputObj.messages, function (msg) {
                return msg.key === key && !!_Dom2.default.removeNode(msg.element);
            });
        }

        /**
         * Validates if all errors are removed from form
         * @public
         */

    }, {
        key: 'validate',
        value: function validate() {
            if (!_lodash2.default.some(this.__inputs, function (input) {
                return !input.isValid();
            })) {
                this.unlock();
                this.state = 'ready';
                return true;
            }
            return false;
        }

        /**
         * Submit event listener
         * - can be also forced
         * @Note - no event is triggered
         * @param e
         */

    }, {
        key: 'submit',
        value: function submit(e) {
            var _this2 = this;

            /** catch button with focus first **/
            this.activeBtn = document.activeElement.type === 'button' ? document.activeElement : this.buttons[0];
            /** Continue **/
            e && e.preventDefault();

            /** Lock and Load **/
            this.lock();
            this.state = 'loading';

            /** Parse and send Data **/
            var data = IS_FORM_DATA ? new FormData(this.form) : __parseSymfonyForm(this.form, this.activeBtn),
                url = this.form.action.trim(),
                method = (data.hasOwnProperty('_method') ? data['_method'] : this.form.method).toUpperCase();

            this.emit('submit-data', {
                url: url,
                method: method,
                data: data
            });

            var req = (0, _superagent2.default)(method, url).set({
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }).timeout(this.settings.requestTimeout).send(data).on('progress', function (e) {
                _this2.emit('progress', e);
            });

            this.emit('before-request', req);

            req.end(function (err, response) {
                // Redirect ?
                if (response && response.status === 302) {
                    var redirectTo = response.body.location;
                    // Do callback and then redirect
                    if (_this2.__successHandler(response) === false) {
                        return false;
                    }
                    // Redirect
                    if (!redirectTo && process.env.NODE_ENV !== 'production') {
                        throw new Error('Missing "location" attribute!');
                    }

                    redirectTo && window.location.assign(redirectTo);
                    return;
                }
                // Error ?
                if (err) {
                    return _this2.__errorHandler(err);
                }

                _this2.__successHandler(response);
            });
        }

        /**
         * Adds 'success' event Listener
         * @param callback {function}
         * @param [context] {Object} - this argument
         * @returns {TrinityForm}
         */

    }, {
        key: 'success',
        value: function success(callback, context) {
            this.addListener('success', callback, context);
            return this; // for chaining
        }

        /**
         * Adds 'error' event Listener
         * @param callback {function}
         * @param [context] {Object} - this argument
         * @returns {TrinityForm}
         */

    }, {
        key: 'error',
        value: function error(callback, context) {
            this.addListener('error', callback, context);
            return this; // for chaining
        }

        /**
         * Abbreviation for addListener
         * @param eventName
         * @param callback
         * @param context
         * @returns {TrinityForm}
         */

    }, {
        key: 'on',
        value: function on(eventName, callback, context) {
            this.addListener.apply(this, arguments);
        }

        /**
         * Force set submit buttons
         * @param buttons {Array<HTMLElement>}
         */

    }, {
        key: 'setSubmitButtons',
        value: function setSubmitButtons(buttons) {
            /** Add ready class to all buttons **/
            var btnReadyClass = this.settings.button['ready'].split(' ');
            _lodash2.default.each(this.buttons, function (btn) {
                _Dom2.default.classlist.removeAll(btn, btnReadyClass);
            });
            this.buttons = buttons;
            _lodash2.default.each(this.buttons, function (btn) {
                _Dom2.default.classlist.addAll(btn, btnReadyClass);
            });
        }
    }, {
        key: 'detach',
        value: function detach() {
            // Main listener
            this.unlistenSubmit();
            this.unlistenValueChange();
            this.element = null;
            this.__inputs = null;
        }
    }, {
        key: '__findInput',
        value: function __findInput(element) {
            return this.__inputs[_lodash2.default.isString(element) ? element : element.name];
        }

        /**
         * Form success handler
         * @param response {Object}
         * @private
         */

    }, {
        key: '__successHandler',
        value: function __successHandler(response) {
            var _this3 = this;

            var event = new _TrinityEvent2.default(response);

            this.state = 'success';
            this.emit('success', event);

            this.unlock();
            var id = setTimeout(function () {
                _this3.state = 'ready';
                clearTimeout(id);
            }, this.settings.successTimeout);

            return !event.defaultPrevented;
        }

        /**
         * Form error handler
         * @param error
         * @private
         * @returns {boolean}
         */

    }, {
        key: '__errorHandler',
        value: function __errorHandler(error) {
            var _this4 = this;

            if (error.timeout) {
                (function () {
                    _this4.state = 'timeout';
                    var id = setTimeout(function () {
                        _this4.unlock();
                        _this4.state = 'ready';
                        clearTimeout(id);
                    }, _this4.settings.timeoutTimeout);
                })();
            } else {
                this.state = 'error';
            }

            // Emit event
            var event = new _TrinityEvent2.default(error);
            this.emit('error', event);
            return !event.defaultPrevented;
        }
    }, {
        key: 'state',
        set: function set(newState) {
            var _this5 = this;

            if (newState === this.__state) {
                return;
            }
            var oldState = this.__state;
            this.__state = newState;

            if (newState === 'error' || newState === 'ready') {
                // For all btns
                _lodash2.default.each(this.buttons, function (btn) {
                    _Dom2.default.classlist.removeAll(btn, _this5.settings.button[oldState].split(' '));
                    _Dom2.default.classlist.addAll(btn, _this5.settings.button[newState].split(' '));
                });
            } else {
                //Switch classes for active
                _Dom2.default.classlist.removeAll(this.activeBtn, this.settings.button[oldState].split(' '));
                _Dom2.default.classlist.addAll(this.activeBtn, this.settings.button[newState].split(' '));
            }

            // Emit new state change
            this.emit('state-change', {
                oldValue: oldState,
                value: newState
            });
        }

        /**
         * returns actual state of form
         */
        ,
        get: function get() {
            return this.__state;
        }
    }]);

    return TrinityForm;
}(_fbemitter.EventEmitter);

/**
 * Create error object
 * @param formInput {FormInput}
 * @param error {string|*}
 * @param template {function}
 * @returns {string}
 * @private
 */


exports.default = TrinityForm;
function __addError(formInput, error, template) {
    error = _lodash2.default.isString(error) ? { message: error } : error;
    error.key = error.key || formInput.element.name + '_error_' + ('' + Math.random() * 100).substr(3, 4);

    // Create error message
    error.element = _Dom2.default.htmlToDocumentFragment(error.isTemplate ? error.message : template(error.message));

    formInput.errors.push(error);
    _Dom2.default.classlist.add(formInput.element, 'error');
    formInput.messageWrapper.appendChild(error.element);

    return error.key;
}

/**
 * Create message plain object
 * @param formInput {FormInput}
 * @param msg {string|*}
 * @param template {function}
 * @returns {string}
 * @private
 */
function __addMessage(formInput, msg, template) {
    msg = _lodash2.default.isString(msg) ? { message: msg } : msg;
    msg.key = msg.key || formInput.element.name + '_msg_' + ('' + Math.random() * 100).substr(3, 4);

    // Create error message
    msg.element = _Dom2.default.htmlToDocumentFragment(msg.isTemplate ? msg.message : template(msg.message));

    formInput.messages.push(msg);
    formInput.messageWrapper.appendChild(msg.element);

    return msg.key;
}

/**** PRIVATE METHODS ****/
/** FORM PARSER ************************************************************/

/**
 * Used to parse input name -> object path
 * @type {RegExp}
 */
var nameRegExp = /\w+/g;

/**
 * Parse form inputs and create json object according symfony name specifications
 * Example: <input value="test" name="necktie_product[name]" />
 *  {
 *      necktie_product : {
 *          name: 'test'
 *      }
 *  }
 * @private
 * @param form {HTMLFormElement}
 * @param button {HTMLElement}
 * @returns {{object}}
 */
function __parseSymfonyForm(form, button) {
    var data = {},
        formLength = form.length;
    /** Go through all inputs in form */
    for (var i = 0; i < formLength; i++) {
        if (!form[i].name || form[i].name.length < 1) {
            continue;
        }
        if ((!form[i].value || form[i].value.length < 1) && form[i].type !== 'submit') {
            continue; // No need to do any work if there are no values
        }

        switch (form[i].type) {
            case 'submit':
                {
                    if (form[i] === button) {
                        break;
                    }
                    continue;
                }
            case 'radio':
            case 'checkbox':
                {
                    if (!form[i].checked) {
                        continue;
                    }
                    break;
                }
            default:
                break;
        }

        // Init necessary variables
        var isArray = ~form[i].name.indexOf('[]'),
            parsed = form[i].name.match(nameRegExp),
            reference = data,
            last = parsed.length - 1;
        /** Evaluate parsed reference object */
        for (var j = 0; j <= last; j++) {
            if (!reference[parsed[j]]) {
                if (j === last) {
                    if (isArray) {
                        reference[parsed[j]] = [];
                        reference[parsed[j]].push(form[i].value);
                    } else {
                        reference[parsed[j]] = form[i].value;
                    }
                } else {
                    /** Not last -> create object */
                    reference[parsed[j]] = {};
                    reference = reference[parsed[j]];
                }
            } else {
                if (j === last) {
                    if (isArray) {
                        reference[parsed[j]].push(form[i].value);
                    } else {
                        reference[parsed[j]] = form[i].value;
                    }
                } else {
                    reference = reference[parsed[j]]; // create reference
                }
            }
        }
    }
    return data;
}

//function __parseSymfonyForm2(form, button){
//    let data = {};
//
//    /** Go through all inputs in form */
//    _(form).filter((el)=>{
//        return !el.name
//            || (
//                !el.value
//                && el.type !== 'submit'
//                && el !== button
//            )
//            || (
//                !el.checked
//                && (
//                    el.type === 'radio'
//                    || el.type === 'checkbox'
//                )
//            );
//    }).each((el)=>{
//        let isArray = el.name.indexOf('[]') !== -1,
//            parsed = el.name.match(nameRegExp),
//            ref = data,
//            lastIndex = parsed.length -1;
//
//        _.each(parsed, ()=>{
//            //TODO:
//        })
//    });
//}