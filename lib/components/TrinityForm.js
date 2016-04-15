'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Gateway = require('../Gateway');

var _Gateway2 = _interopRequireDefault(_Gateway);

var _fbemitter = require('fbemitter');

var _closureEvents = require('../utils/closureEvents');

var _closureEvents2 = _interopRequireDefault(_closureEvents);

var _Dom = require('../utils/Dom');

var _Dom2 = _interopRequireDefault(_Dom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Default FORM settings
 * @type {{
 *      type: null,
 *      button: {loading: string, success: string, error: string, ready: string},
 *      successTimeout: number
 *   }}
 */
var defaultSettings = {
    type: null,
    button: { // Defines which classes add to active button in which state
        loading: 'trinity-form-loading',
        success: 'trinity-form-success',
        timeout: 'trinity-form-timeout',
        error: 'trinity-form-error',
        ready: 'trinity-form-ready'
    },
    successTimeout: 3000,
    timeoutTimeout: 2000
};

/**
 * Trinity form types
 * @type {{EDIT: string, NEW: string, DELETE: string}}
 */
var formType = {
    EDIT: 'edit',
    NEW: 'new',
    DELETE: 'delete'
};

var IS_FORM_DATA = !!window.FormData;

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

    function TrinityForm(formElement, type, settings) {
        _classCallCheck(this, TrinityForm);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TrinityForm).call(this));

        if (!formElement) {
            throw new Error('Missing "formElement" parameter!');
        }
        _this.element = formElement;
        _this.buttons = formElement.querySelectorAll('input[type="submit"], button[type="submit"]');
        _this.activeBtn = null;
        _this.type = type || null;
        _this.settings = _lodash2.default.defaultsDeep(settings || {}, defaultSettings);
        _this.__errors = [];
        _this.__state = 'ready';

        //Main initialize
        // Add ready class to all buttons
        var btnReadyClass = _this.settings.button['ready'].split(' ');
        _lodash2.default.each(_this.buttons, function (btn) {
            _Dom2.default.classlist.addAll(btn, btnReadyClass);
        });

        // Add listener to form element
        _closureEvents2.default.listen(formElement, 'submit', _this.submit, false, _this);
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
            if (this.loading) {
                return false;
            }
            _lodash2.default.each(this.buttons, _Dom2.default.enable);
            return true;
        }
        /**
         * Returns name of the form
         * @returns {string}
         */

    }, {
        key: 'getName',
        value: function getName() {
            return this.element.getAttribute('name');
        }
    }, {
        key: 'addError',


        /**
         * Adds new error to TrinityForm instance
         * @param key {string}
         * @param message {string}
         * @param inputElement {HTMLElement}
         * @public
         */
        value: function addError(key, message, inputElement) {
            this.state = 'error';
            // Add error to Form errors and get its index
            var fieldErr = _lodash2.default.find(this.__errors, function (err) {
                return err.key === key;
            });
            if (!fieldErr) {
                fieldErr = new FieldError(key, inputElement);
                this.__errors.push(fieldErr);
            }
            if (!fieldErr.listener) {
                fieldErr.listener = _closureEvents2.default.listenOnce(inputElement, 'input', function removeError(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    _lodash2.default.remove(this.__errors, function (err) {
                        return err.key === fieldErr.key;
                    });
                    fieldErr.removeAll();
                    this.validate();
                }, false, this);
            }
            return fieldErr.add(message);
        }
    }, {
        key: 'hasError',


        /**
         * Check if form has error with same key
         * @param inputKey {string} - key of input
         * @param [errorId] {string} - id of error message
         * @returns {boolean}
         */
        value: function hasError(inputKey, errorId) {
            return this.__errors.length > 0 && !!_lodash2.default.find(this.__errors, function (err) {
                return err.key === inputKey && (!errorId || err.has(errorId));
            });
        }

        /**
         * Remove errors from TrinityForm input
         * @param input {string} | {HTMLInputElement}
         * @public
         */

    }, {
        key: 'removeError',
        value: function removeError(input) {
            var fieldError = _lodash2.default.isString(input) ? _lodash2.default.remove(this.__errors, function (err) {
                return err.key === input;
            }) : _lodash2.default.remove(this.__errors, function (err) {
                return err.input === input;
            })[0];
            fieldError.removeAll();
            _closureEvents2.default.unlistenByKey(fieldError.listener);
        }
    }, {
        key: 'validate',


        /**
         * Validates if all errors are removed from form
         * @public
         */
        value: function validate() {
            if (this.__errors.length < 1) {
                this.unlock();
                this.state = 'ready';
            }
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
            /** catch button with focus first **/
            this.activeBtn = document.activeElement.type === 'button' ? document.activeElement : this.buttons[0];
            /** Continue **/
            if (e) {
                e.preventDefault();
            }
            /** Lock and Load **/
            this.lock();
            this.state = 'loading';
            //this.toggleLoading();

            /** Parse and send Data **/
            var data = null;
            if (IS_FORM_DATA) {
                data = new FormData(this.element);
            } else {
                data = __parseSymfonyForm(this.element, this.activeBtn);
            }

            var method = data.hasOwnProperty('_method') ? data['_method'] : this.element.method;

            /** Discover type **/
            if (_lodash2.default.isNull(this.type)) {
                switch (method) {
                    case 'POST':
                        this.type = formType.NEW;break;
                    case 'PUT':
                        this.type = formType.EDIT;break;
                    default:
                        this.type = formType.DELETE;break;
                }
            }
            _Gateway2.default.sendJSON(this.element.action, method, data, //Json object
            __successHandler.bind(this), __errorHandler.bind(this));
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
        key: 'state',
        set: function set(newState) {
            var _this2 = this;

            if (newState === this.__state) {
                return;
            }
            var oldState = this.__state;
            this.__state = newState;

            if (newState === 'error' || newState === 'ready') {
                // For all btns
                _lodash2.default.each(this.buttons, function (btn) {
                    _Dom2.default.classlist.removeAll(btn, _this2.settings.button[oldState].split(' '));
                    _Dom2.default.classlist.addAll(btn, _this2.settings.button[newState].split(' '));
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

/** STATIC CONSTANTS **/
/**
 * Form types
 * @static
 */


exports.default = TrinityForm;
TrinityForm.formType = formType;

/**** PRIVATE METHODS ****/
/** RESPONSE HANDLERS ************************************************************/

/**
 * Form success handler
 * @param response {Object}
 * @private
 */
function __successHandler(response) {
    var _this3 = this;

    this.state = 'success';
    this.emit('success', response);

    // Edit type behaviour
    //if(this.type === 'edit'){
    this.unlock();
    var id = setTimeout(function (e) {
        _this3.state = 'ready';
        clearTimeout(id);
    }, this.settings.successTimeout);
    //}
}

/**
 * Form error handler
 * @param error
 * @private
 * @returns {boolean}
 */
function __errorHandler(error) {
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
    this.emit('error', error);
}

/**
 * Class representing field error
 * @param key {string}
 * @param message {string}
 * @param input {HTMLElement}
 * @private
 * @constructor
 */

var FieldError = function () {
    function FieldError(key, input) {
        _classCallCheck(this, FieldError);

        this.key = key;
        this.input = input;
        this.listener = null;
        this.errors = [];
        this.__counter = 0;
        // Add error message
        _Dom2.default.classlist.add(input, 'error');
    }

    _createClass(FieldError, [{
        key: 'add',
        value: function add(message) {
            var errMessage = {
                id: this.__counter++ + '_' + this.key,
                message: message,
                warning: __createErrorMessage(this.key, message)
            };
            this.errors.push(errMessage);

            var sibling = this.input.nextSibling;
            if (sibling) {
                this.input.parentElement.insertBefore(errMessage.warning, sibling);
            } else {
                this.input.parentElement.appendChild(errMessage.warning);
            }
            return errMessage.id;
        }
    }, {
        key: 'has',
        value: function has(id) {
            return !!_lodash2.default.find(this.errors, function (err) {
                return err.id === id;
            });
        }
    }, {
        key: 'remove',
        value: function remove(id) {
            _lodash2.default.remove(this.errors, function (err) {
                if (err.id === id) {
                    _Dom2.default.removeNode(err.warning);
                    return true;
                }
                return false;
            });
            if (this.errors.length === 0) {
                _Dom2.default.classlist.remove(this.input, 'error');
            }
        }
    }, {
        key: 'removeAll',
        value: function removeAll() {
            _lodash2.default.map(this.errors, function (err) {
                _Dom2.default.removeNode(err.warning);
            });
            this.errors = [];
            _Dom2.default.classlist.remove(this.input, 'error');
        }
    }]);

    return FieldError;
}();

/**
 * Just return Error message element
 * TODO: possibility for custom message in settings
 * @param key {string}
 * @param message {string}
 * @private
 */


function __createErrorMessage(key, message) {
    var errDiv = document.createElement('div');
    errDiv.className = 'validation-error';
    errDiv.id = key + '_error';
    errDiv.style.paddingTop = '2px';
    errDiv.innerHTML = message;
    return errDiv;
}

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
        var isArray = form[i].name.indexOf('[]') !== -1,
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