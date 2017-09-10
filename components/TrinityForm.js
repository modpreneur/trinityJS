'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _remove2 = require('lodash/remove');

var _remove3 = _interopRequireDefault(_remove2);

var _some2 = require('lodash/some');

var _some3 = _interopRequireDefault(_some2);

var _isFunction2 = require('lodash/isFunction');

var _isFunction3 = _interopRequireDefault(_isFunction2);

var _filter2 = require('lodash/filter');

var _filter3 = _interopRequireDefault(_filter2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _defaultsDeep2 = require('lodash/defaultsDeep');

var _defaultsDeep3 = _interopRequireDefault(_defaultsDeep2);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

        var _this = _possibleConstructorReturn(this, (TrinityForm.__proto__ || Object.getPrototypeOf(TrinityForm)).call(this));

        if (!formElement) {
            throw new Error('Missing "formElement" parameter!');
        }
        _this.form = formElement;
        _this.buttons = formElement.querySelectorAll('input[type="submit"], button[type="submit"]');
        _this.activeBtn = null;
        _this.settings = (0, _defaultsDeep3.default)(settings || {}, defaultSettings);
        _this.__state = 'ready';
        _this.__inputs = {};

        //Main initialize
        // Create inputs
        (0, _each3.default)(_this.form, function (el) {
            if (el.name && !~INPUT_TYPE_FILTER.indexOf(el.type)) {
                _this.__inputs[el.name] = new _FormInput2.default(el);
            }
        });

        // Add ready class to all buttons
        var btnReadyClass = _this.settings.button['ready'].split(' ');
        (0, _each3.default)(_this.buttons, function (btn) {
            return _Dom2.default.classlist.addAll(btn, btnReadyClass);
        });

        // Listeners at last
        // Add listener to form element
        _this.unlistenSubmit = _Events2.default.listen(formElement, 'submit', _this.submit.bind(_this));
        // Add listener for input value change
        _this.unlistenValueInput = _Events2.default.listen(formElement, 'input', _this.onInputChange.bind(_this));
        _this.unlistenValueChange = _Events2.default.listen(formElement, 'change', _this.onInputChange.bind(_this));
        return _this;
    }

    /**
     *
     * @param element {HTMLElement}
     */


    _createClass(TrinityForm, [{
        key: 'addInput',
        value: function addInput(element) {
            this.__inputs[element.name] = new _FormInput2.default(element);
        }

        /**
         *
         * @param element {HTMLElement || string} - name of input or input itself
         */

    }, {
        key: 'removeInput',
        value: function removeInput(element) {
            var name = (0, _isString3.default)(element) ? element : element.name;
            delete this.__inputs[name];
        }

        /**
         * Sets new form state
         *  - add state classes to button
         *  - emit "state-change" event
         * @param newState
         */

    }, {
        key: 'lock',


        /**
         * Disable all forms submit inputs
         */
        value: function lock() {
            (0, _each3.default)(this.buttons, _Dom2.default.disable);
        }

        /**
         * Enable all forms submit inputs
         */

    }, {
        key: 'unlock',
        value: function unlock() {
            return this.state !== 'loading' && !!(0, _each3.default)(this.buttons, _Dom2.default.enable);
        }

        /**
         * Main function which runs validation
         * @param e {Event}
         */

    }, {
        key: 'onInputChange',
        value: function onInputChange(e) {
            // Only elements with name can be tested

            // Filter
            var isSelectType = e.target.type ? !!~e.target.type.indexOf('select') : false,
                //tesxtarea does not have type prop
            isChangeEvent = e.type === 'change';

            if (isSelectType ^ isChangeEvent || !e.target.name) {
                return;
            }
            var inputObj = this.__inputs[e.target.name];
            if (!inputObj) {
                return;
            }
            inputObj.errors = (0, _filter3.default)(inputObj.errors, function (err) {
                if (!(0, _isFunction3.default)(err.validate) || err.validate(inputObj.getValue(), inputObj.element)) {
                    _Dom2.default.removeNode(err.element);
                    return false;
                }
                return true;
            });
            this.validate();
        }

        /*eslint-disable*/
        /**
         * TODO: feature
         * @notImplemented
         * @param element {HTMLElement || string} - name of input or input itself
         * @param validator
         * @returns {boolean}
         */

    }, {
        key: 'addRule',
        value: function addRule(element, validator) {}
        // return;
        // let inputObj = this.__findInput(element);
        // if (!inputObj) {
        //     if (process.env.NODE_ENV !== 'production') {
        //         throw new Error('Form does not have input ' + (_.isString(element) ? 'with name ' : '') + element + '.');
        //     }
        //     return false;
        // }
        // return !!inputObj.rules.push(validator);

        /*eslint-enable*/

        /**
         * Adds new error to TrinityForm instance
         * @param element {string || HTMLElement} - input name or instance itself
         * @param error {string || object}
         * @param [args] {Array}
         * @public
         */

    }, {
        key: 'addError',
        value: function addError(element, error) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + ((0, _isString3.default)(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }
            this.state = 'error';

            for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                args[_key - 2] = arguments[_key];
            }

            var errObj = __createMessage(error, // error object or string
            this.settings.errorTemplate, // template
            inputObj.element.name + '_error_', // prefix if no id
            args // rest of args
            );
            return inputObj.addError(errObj);
        }

        /**
         * Check if input element has error with provided key
         * or if key not provided, checks if input has any error
         * @param element {HTMLElement || string} - name of input or input itself
         * @param [errorId] {string}
         * @returns {boolean}
         */

    }, {
        key: 'hasError',
        value: function hasError(element, errorId) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + ((0, _isString3.default)(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }
            return errorId ? (0, _some3.default)(inputObj.errors, function (err) {
                return err.id === errorId;
            }) : inputObj.errors.length > 0;
        }

        /**
         * Remove error with errorKey provided, or remove all errors if errorKey is not provided
         * @param element {HTMLElement || string} - name of input or input itself
         * @param [errorId] {string}
         * @returns {boolean}
         */

    }, {
        key: 'removeError',
        value: function removeError(element, errorId) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + ((0, _isString3.default)(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }

            if (errorId) {
                (0, _remove3.default)(inputObj.errors, function (err) {
                    return err.id === errorId && !!_Dom2.default.removeNode(err.element);
                });
            } else {
                // Remove all if error key not provided
                (0, _each3.default)(inputObj.errors, function (err) {
                    return _Dom2.default.removeNode(err.element);
                });
                inputObj.errors = [];
            }
            this.validate();
            return true;
        }

        /**
         * Set message to requested element
         * @param element {HTMLElement || string} - name of input or input itself
         * @param message {object || string}
         * @param [args]
         * @returns {*} id or false if element was not found
         */

    }, {
        key: 'setMessage',
        value: function setMessage(element, message) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + ((0, _isString3.default)(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }

            for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
                args[_key2 - 2] = arguments[_key2];
            }

            var msg = __createMessage(message, // msg object or string
            this.settings.messageTemplate, // template object
            inputObj.element.name + '_msg_', // prefix
            args // args
            );
            return inputObj.setMessage(msg);
        }

        /**
         * Removes message from input
         * @param element {HTMLElement || string} - name of input or input itself
         * @returns {*}
         */

    }, {
        key: 'removeMessage',
        value: function removeMessage(element) {
            var inputObj = this.__findInput(element);
            if (!inputObj) {
                if (process.env.NODE_ENV !== 'production') {
                    throw new Error('Form does not have input ' + ((0, _isString3.default)(element) ? 'with name ' : '') + element + '.');
                }
                return false;
            }
            return inputObj.clearMessage() || true;
        }

        /**
         * Validates if all errors are removed from form
         * @public
         */

    }, {
        key: 'validate',
        value: function validate() {
            if (!(0, _some3.default)(this.__inputs, function (input) {
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
            var data = IS_FORM_DATA ? serializeFrom(this.form, this.activeBtn) : __parseSymfonyForm(this.form, this.activeBtn),
                url = this.form.action.trim(),
                method = (data.hasOwnProperty('_method') ? data['_method'] : this.form.method).toUpperCase(),
                submitEvent = new _TrinityEvent2.default({
                url: url,
                method: method,
                data: data
            });

            this.emit('submit', submitEvent);

            if (submitEvent.defaultPrevented) {
                return;
            }

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
         * @param eventName {string}
         * @param callback {function}
         * @param context {object}
         * @returns {TrinityForm}
         */
        /*eslint-disable*/

    }, {
        key: 'on',
        value: function on(eventName, callback, context) {
            /*eslint-enable*/
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
            (0, _each3.default)(this.buttons, function (btn) {
                _Dom2.default.classlist.removeAll(btn, btnReadyClass);
            });
            this.buttons = buttons;
            (0, _each3.default)(this.buttons, function (btn) {
                _Dom2.default.classlist.addAll(btn, btnReadyClass);
            });
        }
    }, {
        key: 'detach',
        value: function detach() {
            // Main listener
            this.unlistenSubmit();
            this.unlistenValueChange();
            this.unlistenValueInput();
            this.element = null;
            this.__inputs = null;
        }
    }, {
        key: '__findInput',
        value: function __findInput(element) {
            return this.__inputs[(0, _isString3.default)(element) ? element : element.name];
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
                this.state = 'timeout';
                var id = setTimeout(function () {
                    _this4.unlock();
                    _this4.state = 'ready';
                    clearTimeout(id);
                }, this.settings.timeoutTimeout);
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
                (0, _each3.default)(this.buttons, function (btn) {
                    _Dom2.default.classlist.removeAll(btn, _this5.settings.button[oldState].split(' '));
                    _Dom2.default.classlist.addAll(btn, _this5.settings.button[newState].split(' '));
                });
            } else {
                //Switch classes for active
                _Dom2.default.classlist.removeAll(this.activeBtn, this.settings.button[oldState].split(' '));
                _Dom2.default.classlist.addAll(this.activeBtn, this.settings.button[newState].split(' '));
            }

            if (newState === 'error') {
                this.lock();
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
 * Create message and returns object with description and element object
 * @param msg {object || string}
 * @param template {function}
 * @param prefix {string}
 * @param args {Array}
 * @returns {{message: *}|*}
 * @private
 */


exports.default = TrinityForm;
function __createMessage(msg, template, prefix, args) {
    msg = (0, _isString3.default)(msg) ? { message: msg } : msg;
    msg.id = msg.id || prefix + ('' + Math.random() * 100).substr(3, 4);

    // Create message
    msg.element = _Dom2.default.htmlToDocumentFragment(msg.isHtml ? msg.message : template.apply(null, [msg.message].concat(args)));
    msg.element.setAttribute('id', msg.id);
    return msg;
}

/**** PRIVATE METHODS ****/
/** FORM PARSER ************************************************************/

/**
 * Used to parse input name -> object path
 * @type {RegExp}
 */
var nameRegExp = /\w+/g;

function serializeFrom(form, button) {
    var formData = new FormData();

    (0, _each3.default)(form, function (el) {
        if (!el.name) {
            return;
        }

        var isValid = false;

        switch (el.type) {
            case 'submit':
                {
                    isValid = el === button;
                }break;
            case 'radio':
            case 'checkbox':
                {
                    isValid = el.checked;
                }break;
            default:
                {
                    isValid = el.value && el.value.length !== 0;
                }break;
        }

        if (isValid) {
            formData.append(el.name, el.value);
        }
    });
    return formData;
}

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