'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

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
        error: 'trinity-form-error',
        ready: 'trinity-form-ready'
    },
    successTimeout: 3000
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

/**
 * Connects to formElement and change it to ajax form
 *
 * @param form {HTMLFormElement}
 * @param [type] {String} - type of form
 * @param [settings] {Object}
 * @constructor
 */

var TrinityForm = (function (_EventEmitter) {
    _inherits(TrinityForm, _EventEmitter);

    function TrinityForm(formElement, type, settings) {
        _classCallCheck(this, TrinityForm);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TrinityForm).call(this));

        if (!formElement) {
            throw new Error('Missing "formElement" parameter!');
        }
        _this.element = formElement;
        _this.activeBtn = null;
        _this.buttons = formElement.querySelectorAll('input[type="submit"], button[type="submit"]');
        _this.type = type || null;
        _this.settings = _lodash2.default.extend(_lodash2.default.cloneDeep(defaultSettings), settings);
        _this.__errors = [];
        _this.__state = 'ready';
        //Main init
        _initialize.call(_this, formElement);
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
            // Create Error
            var error = new FieldError(key, message, inputElement, __createErrorMessage(key, message));
            // Add error to Form errors and get its index
            var index = this.__errors.push(error) - 1;
            //Add event listener and save listener key
            error.listenerKey = _closureEvents2.default.listenOnce(inputElement, 'change', __removeError.bind(this, index));
        }
    }, {
        key: 'removeError',

        /**
         * Removes error from TrinityForm
         * @param input {string} | {HTMLInputElement}
         * @public
         */
        value: function removeError(input) {
            var index = _lodash2.default.isString(input) ? _lodash2.default.findIndex(this.__errors, function (err) {
                return err.key === input;
            }) : _lodash2.default.findIndex(this.__errors, function (err) {
                return err.input === input;
            });
            var error = __removeError(index);
            _closureEvents2.default.unlistenByKey(error.listenerKey);
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
    }, {
        key: 'state',
        set: function set(newState) {
            var oldState = this.__state;
            this.__state = newState;

            //Switch classes
            _Dom2.default.classlist.removeAll(this.activeBtn, this.settings.button[oldState].split(' '));
            _Dom2.default.classlist.addAll(this.activeBtn, this.settings.button[newState].split(' '));

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
})(_fbemitter.EventEmitter);

/** STATIC CONSTANTS **/
/**
 * Form types
 * @static
 */

exports.default = TrinityForm;
TrinityForm.formType = formType;

/**
 * Static default settings property
 * @static
 */
TrinityForm.settings = {
    debug: false
};

/**** PRIVATE METHODS ****/

/**
 * Initialize TrinityForm - adds submit event listener
 * @param form {HTMLFormElement}
 * @private
 */
function _initialize(form) {
    /** Add ready class to all buttons **/
    var btnReadyClass = this.settings.button['ready'].split(' ');
    _lodash2.default.each(this.buttons, function (btn) {
        _Dom2.default.classlist.addAll(btn, btnReadyClass);
    });

    /** Add listener to form element **/
    _closureEvents2.default.listen(form, 'submit', function (e) {
        /** catch button with focus first **/
        this.activeBtn = document.activeElement.type === 'button' ? document.activeElement : this.buttons[0];
        /** Continue **/
        e.preventDefault();
        /** Lock and Load **/
        this.lock();
        this.state = 'loading';
        //this.toggleLoading();

        /** Parse and send Data **/
        var data = __parseSymfonyForm(form, this.activeBtn);
        var method = data.hasOwnProperty('_method') ? data['_method'] : form.method;

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
        _Gateway2.default.sendJSON(form.action, method, data, //Json object
        __successHandler.bind(this), __errorHandler.bind(this));
    }, false, this);
}

/** RESPONSE HANDLERS ************************************************************/

/**
 * Form success handler
 * @param response {Object}
 * @private
 */
function __successHandler(response) {
    var _this2 = this;

    this.state = 'success';
    this.emit('success', response);

    // Edit type behaviour
    if (this.type === 'edit') {
        (function () {
            _this2.unlock();
            var id = setTimeout(function (e) {
                _this2.state = 'ready';
                clearTimeout(id);
            }, _this2.settings.successTimeout);
        })();
    }
}

/**
 * Form error handler
 * @param error
 * @private
 * @returns {boolean}
 */
function __errorHandler(error) {
    this.state = 'error';
    this.emit('error', error);
}

/**
 * Class representing field error
 * @param key {string}
 * @param message {string}
 * @param input {HTMLElement}
 * @param warn {HtmlElement}
 * @private
 * @constructor
 */
function FieldError(key, message, input, warn) {
    this.key = key;
    this.input = input;
    this.message = message;
    this.warning = warn;
    this.listenerKey = null;
    // Add error message
    _Dom2.default.classlist.add(input, 'error');
    var sibling = input.nextSibling;
    if (sibling) {
        input.parentElement.insertBefore(warn, sibling);
    } else {
        input.parentElement.appendChild(warn);
    }
}

/**
 * Remove Error from TrinityForm instance and returns removed FieldError instance
 * @param index {Number} - index of error instance
 * @param [e] {Event}
 * @private
 * @return {FieldError}
 */
function __removeError(index, e) {
    if (!_lodash2.default.isUndefined(e)) {
        e.stopPropagation();
        e.preventDefault();
    }
    var error = _lodash2.default.pullAt(this.__errors, index)[0];
    _Dom2.default.classlist.remove(error.input, 'error');
    _Dom2.default.removeNode(error.warning);
    this.validate();
    return error;
}

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