'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       * Created by fisa on 8/19/15.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       */

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Gateway = require('./Gateway.js');

var _Gateway2 = _interopRequireDefault(_Gateway);

var _closureEvents = require('./utils/closureEvents.js');

var _closureEvents2 = _interopRequireDefault(_closureEvents);

var _Dom = require('./utils/Dom.js');

var _Dom2 = _interopRequireDefault(_Dom);

var _Store = require('./Store.js');

var _Store2 = _interopRequireDefault(_Store);

var _Services = require('./Services.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @deprecated
 * Super form class - automatically handles form with ajax requests and adds extra behaviour
 * @param form {HTMLFormElement}
 * @param type {string}
 * @constructor
 */

var TrinityForm = (function () {
    function TrinityForm(formElement, type) {
        _classCallCheck(this, TrinityForm);

        if (_lodash2.default.isNull(formElement)) {
            throw new Error('Input parameter "formElement" cannot be NULL!');
        }
        this.element = formElement;
        this.type = type || null;
        this.loading = false;
        this.errors = [];
        this.activeBtn = null;
        this.buttons = formElement.querySelectorAll('input[type="submit"], button[type="submit"]');
        //Main init
        _initialize.call(this, formElement);
    }
    /**
     * Disable all forms submit inputs
     */

    _createClass(TrinityForm, [{
        key: 'lock',
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
         * @param key
         * @param input
         * @param message
         * @public
         */
        value: function addError(key, input, message) {
            // Create Error
            var error = new FieldError(key, input, message, _createErrorMessage(key, message));
            // Add error to Form errors and get its index
            var index = this.errors.push(error) - 1;
            //Add event listener and save listener key
            error.listenerKey = _closureEvents2.default.listenOnce(input, 'change', _removeError.bind(this, index));
        }
    }, {
        key: 'removeError',

        /**
         * Removes error from TrinityForm
         * @param input {string} | {HTMLInputElement}
         * @public
         */
        value: function removeError(input) {
            var index = _lodash2.default.isString(input) ? _lodash2.default.findIndex(this.errors, function (err) {
                return err.key === input;
            }) : _lodash2.default.findIndex(this.errors, function (err) {
                return err.input === input;
            });
            var error = _removeError(index);
            _closureEvents2.default.unlistenByKey(error.listenerKey);
        }
    }, {
        key: 'validate',

        /**
         * Validates if all errors are removed from form
         * @public
         */
        value: function validate() {
            if (this.errors.length < 1) {
                this.unlock();
                this.removeButtonIcon();
            }
        }

        /**
         * Turn on/off Loading Effect
         * @public
         */

    }, {
        key: 'toggleLoading',
        value: function toggleLoading() {
            if (this.loading) {
                this.loading = false;
                _removeIconWrapper(this.activeBtn);
            } else {
                this.activeBtn = this.activeBtn || this.buttons[0] || null;
                if (_lodash2.default.isNull(this.activeBtn)) {
                    return;
                } // Should never be true

                this.loading = true;
                _addIconWrapper(this.activeBtn, TrinityForm.tiecons.loading);
            }
        }

        /**
         * Add icon to active button
         * @param icon {HTMLElement} | {string}
         */

    }, {
        key: 'addButtonIcon',
        value: function addButtonIcon(icon) {
            var btn = this.activeBtn ? this.activeBtn : this.buttons[0];
            if (_lodash2.default.isString(icon)) {
                icon = _Dom2.default.htmlToDocumentFragment(icon);
            }
            _addIconWrapper.call(this, btn, icon);
        }

        /**
         * Remove whole wrapper of active button
         */

    }, {
        key: 'removeButtonIcon',
        value: function removeButtonIcon() {
            _removeIconWrapper(this.activeBtn || this.buttons[0]);
        }
    }]);

    return TrinityForm;
})();

/** STATIC CONSTANTS **/
/**
 * Form types
 * @static
 */

exports.default = TrinityForm;
TrinityForm.formType = {
    EDIT: 'edit',
    NEW: 'new',
    DELETE: 'delete'
};

/**
 * Static default settings property
 * @static
 */
TrinityForm.settings = {
    debug: false
};

/**
 * Default icons
 * @deprecated - removed
 * @static
 */
TrinityForm.tiecons = {
    loading: _createIcon({
        'class': 'tiecons tiecons-loading tiecons-rotate font-20',
        'style': 'color:#530e6d;'
    }),
    ok: _createIcon({
        'class': 'tiecons tiecons-check font-20',
        'style': 'color:#39b54a;'
    }),
    error: _createIcon({
        'class': 'tiecons tiecons-cross-radius font-20',
        'style': 'color: rgb(121, 0, 0);'
    })
};

/**
 * Initialize TrinityForm
 * @param form
 * @private
 */
function _initialize(form) {
    /** Add listener to form element **/
    _closureEvents2.default.listen(form, 'submit', function (e) {
        /** catch button with focus first **/
        this.activeBtn = document.activeElement.type === 'submit' ? document.activeElement : this.buttons[0];
        /** Continue **/
        e.preventDefault();
        /** Lock and Load **/
        this.lock();
        this.toggleLoading();

        /** Parse and send Data **/
        var data = parseSymfonyForm(form, this.activeBtn);
        var method = data.hasOwnProperty('_method') ? data['_method'] : form.method;

        /** Discover type **/
        if (_lodash2.default.isNull(this.type)) {
            switch (method) {
                case 'POST':
                    this.type = TrinityForm.formType.NEW;break;
                case 'PUT':
                    this.type = TrinityForm.formType.EDIT;break;
                default:
                    this.type = TrinityForm.formType.DELETE;break;
            }
        }
        _Gateway2.default.sendJSON(form.action, method, data, //Json object
        _successHandler.bind(this), _errorHandler.bind(this));
    }, false, this);
}

/**** PRIVATE METHODS ****/

/** RESPONSE HANDLERS ************************************************************/
/*** SUCCESS **/
/**
 * Form success handler
 * @param response
 * @private
 * @return {boolean}
 */
function _successHandler(response) {
    // Default Behaviour
    if (this.type === 'edit') {
        this.toggleLoading();
        this.unlock();
        (0, _Services.messageService)(response.message, 'success');
    } else {
        this.addButtonIcon(TrinityForm.tiecons.ok);
    }
}
/*** ERROR **/
/**
 * Form error handler, if users callback returns false, omit default behaviour
 * @param error
 * @private
 * @returns {boolean}
 */
function _errorHandler(error) {
    /** DEFAULT ERROR HANDLER **/
    if (error.db) {
        //TODO: replace with message service
        (0, _Services.messageService)(error.db, 'warning');
        this.toggleLoading();
        this.unlock();
        return true;
    }
    var noErrors = true;
    if (error.global && error.global.length > 0) {
        noErrors = false;
        _globalErrors(error.global);
    }

    if (error.fields && error.fields.length > 0) {
        noErrors = false;
        this.loading = false;
        this.addButtonIcon(TrinityForm.tiecons.error);
        _fieldErrors.call(this, error.fields);
    } else {
        this.toggleLoading();
        this.unlock();
    }
    if (noErrors && TrinityForm.settings.debug) {
        (0, _Services.messageService)('DEBUG: Request failed but no FORM errors returned! check server response', 'warning');
    }
    return true;
}

/**
 * Handles global errors
 * @param errors
 * @private
 */
function _globalErrors(errors) {
    var count = errors.length;
    for (var i = 0; i < count; i++) {
        //TODO: replace with message service
        (0, _Services.messageService)(errors[i], 'warning');
    }
}

/**
 * Handles Field Errors - adds them to form
 * @param fields
 * @private
 */
function _fieldErrors(fields) {
    for (var key in fields) {
        if (fields.hasOwnProperty(key)) {
            var input = document.getElementById(key);
            this.addError(key, input, fields[key]);
        }
    }
}

/**
 * Class representing field error
 * @param key
 * @param input
 * @param message
 * @param warn
 * @private
 * @constructor
 */
function FieldError(key, input, message, warn) {
    this.key = key;
    this.input = input;
    this.message = message;
    this.warning = warn;
    this.listenerKey = null;
    // Add error message
    _Dom2.default.classlist.add(input, 'error');
    input.parentElement.appendChild(warn);
}

/**
 * Remove Error from TrinityForm instance and returns removed FieldError instance
 * @param index
 * @param e {Event}
 * @private
 * @return {FieldError}
 */
function _removeError(index, e) {
    if (!_lodash2.default.isUndefined(e)) {
        e.stopPropagation();
        e.preventDefault();
    }
    var error = this.errors[index];
    _lodash2.default.pullAt(this.errors, index);
    _Dom2.default.classlist.remove(error.input, 'error');
    _Dom2.default.removeNode(error.warning);
    this.validate();
    return error;
}

/**
 * Just return Error message element
 * @param key
 * @param message
 * @private
 */
function _createErrorMessage(key, message) {
    var errDiv = document.createElement('div');
    errDiv.className = 'validation-error';
    errDiv.id = key + '_error';
    errDiv.innerHTML = '* ' + message;
    return errDiv;
}

/**
 * Creates icon dom
 * @param attributes
 * @param innerHTMLstring
 * @private
 */
function _createIcon(attributes, innerHTMLstring) {
    var icon = document.createElement('i'),
        attrKeys = Object.keys(attributes);
    _lodash2.default.each(attrKeys, function (key) {
        icon.setAttribute(key, attributes[key]);
    });
    if (innerHTMLstring) {
        icon.innerHTML = innerHTMLstring;
    }
    return icon;
}

/** BUTTON ICON ************************************************************/

/**
 * Add Icon wrapper to btn input
 * @param btn
 * @param icon
 * @private
 */
function _addIconWrapper(btn, icon) {
    /** Prepare Icon **/
    icon = icon.cloneNode(true);
    icon.style.width = '100%';
    icon.style.marginTop = '7px';
    _Dom2.default.classlist.addAll(icon, ['absolute', 'display-block']);

    var wrapper = _Store2.default.getValue(btn, 'wrapper');
    if (_lodash2.default.isNull(wrapper)) {
        wrapper = _Dom2.default.createDom('span', { 'class': 'clearfix relative text-center' });
        _Dom2.default.classlist.addAll(wrapper, _Dom2.default.classlist.get(btn));
        wrapper.style.setProperty('padding', '0px', 'important');
        /** Store info **/
        _Store2.default.setValue(btn, 'wrapper', wrapper);
        _Store2.default.setValue(btn, 'value', btn.value);
    } else if (wrapper.children.length > 1) {
        /** Replace icon **/
        _Dom2.default.replaceNode(icon, wrapper.children[1]);
        return;
    }
    /** Prepare and insert Button with icon **/
    btn.style.width = '100%';
    btn.style.setProperty('margin', '0px', 'important');
    btn.value = '';
    btn.parentElement.insertBefore(wrapper, btn);
    wrapper.appendChild(btn);
    wrapper.appendChild(icon);
}

/**
 * Remove Icon wrapper from btn input
 * @param btn
 * @private
 */
function _removeIconWrapper(btn) {
    var btnValue = _Store2.default.getValue(btn, 'value'),
        wrapper = _Store2.default.getValue(btn, 'wrapper');
    if (!_lodash2.default.isNull(wrapper)) {
        //restore button
        wrapper.parentElement.insertBefore(btn, wrapper);
        btn.value = btnValue;
        btn.style.width = '';
        btn.style.margin = '';
        // Clean wrapper
        _Dom2.default.removeNode(wrapper);
        _Dom2.default.removeChildren(wrapper);
    }
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
function parseSymfonyForm(form, button) {
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