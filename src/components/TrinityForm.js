'use strict';

import _ from 'lodash';
import Request from 'superagent';
import {EventEmitter} from 'fbemitter';
import Events from '../utils/Events';
import Dom from '../utils/Dom';
import TrinityEvent from '../utils/TrinityEvent';
import FormInput from './FormInput';
import {
    STATE_READY,
    STATE_ERROR,
    STATE_LOADING,
    STATE_SUCCESS,
    STATE_TIMEOUT
} from './FormStates';


const IS_FORM_DATA = !!window.FormData,
    INPUT_TYPE_FILTER = ['radio', 'checkbox'];

/**
 * Default FORM settings
 * @type {{
 *      button: {loading: string, success: string, error: string, ready: string},
 *      successTimeout: number
 *   }}
 */
const defaultSettings = {
    button: { // Defines which classes add to active button in which state
        [STATE_LOADING]: 'trinity-form-loading',
        [STATE_SUCCESS]: 'trinity-form-success',
        [STATE_TIMEOUT]: 'trinity-form-timeout',
        [STATE_ERROR]: 'trinity-form-error',
        [STATE_READY]: 'trinity-form-ready'
    },
    requestTimeout: 10000,
    successTimeout: 3000,
    timeoutTimeout: 2000,
    errorTemplate: (message) => `<div>${message}</div>`,
    messageTemplate: (message) => `<div>${message}</div>`
};

/**
 * Connects to formElement and change it to ajax form
 *
 * @param form {HTMLFormElement}
 * @param [type] {String} - type of form
 * @param [settings] {Object}
 * @constructor
 */
export default class TrinityForm {
    constructor(formElement, settings) {
        if (!formElement) {
            throw new Error('Missing "formElement" parameter!');
        }
        this.__emitter = new EventEmitter();
        this.form = formElement;
        this.buttons = formElement.querySelectorAll('input[type="submit"], button[type="submit"]');
        this.activeBtn = null;
        this.settings = _.defaultsDeep(settings || {}, defaultSettings);
        this.__state = STATE_READY;
        this.__inputs = {};


        //Main initialize
        // Create inputs
        _.each(this.form, (el) => {
            if (el.name && !~INPUT_TYPE_FILTER.indexOf(el.type)) {
                this.__inputs[el.name] = new FormInput(el);
            }
        });

        // Add ready class to all buttons
        let btnReadyClass = this.settings.button[STATE_READY].split(' ');
        _.each(this.buttons, btn => Dom.classlist.addAll(btn, btnReadyClass));

        // Listeners at last
        // Add listener to form element
        this.unlistenSubmit = Events.listen(formElement, 'submit', this.submit.bind(this));
        // Add listener for input value change
        this.unlistenValueInput = Events.listen(formElement, 'input', this.onInputChange.bind(this));
        this.unlistenValueChange = Events.listen(formElement, 'change', this.onInputChange.bind(this));
    }

    /**
     *
     * @param element {HTMLElement}
     */
    addInput(element) {
        this.__inputs[element.name] = new FormInput(element);
    }

    /**
     *
     * @param element {HTMLElement || string} - name of input or input itself
     */
    removeInput(element) {
        let name = _.isString(element) ? element : element.name;
        delete this.__inputs[name];
    }

    /**
     * Sets new form state
     *  - add state classes to button
     *  - emit "state-change" event
     * @param newState
     */
    set state(newState) {
        if (newState === this.__state) {
            return;
        }
        let oldState = this.__state;
        this.__state = newState;

        if (newState === STATE_ERROR || newState === STATE_READY) {
            // For all btns
            _.each(this.buttons, (btn) => {
                Dom.classlist.removeAll(btn, this.settings.button[oldState].split(' '));
                Dom.classlist.addAll(btn, this.settings.button[newState].split(' '));
            });
        } else {
            //Switch classes for active
            Dom.classlist.removeAll(this.activeBtn, this.settings.button[oldState].split(' '));
            Dom.classlist.addAll(this.activeBtn, this.settings.button[newState].split(' '));
        }

        if (newState === STATE_ERROR) {
            this.lock();
        }

        // Emit new state change
        this.__emitter.emit('state-change', {
            oldValue: oldState,
            value: newState
        });
    }

    /**
     * returns actual state of form
     */
    get state() {
        return this.__state;
    }

    /**
     * Disable all forms submit inputs
     */
    lock() {
        _.each(this.buttons, Dom.disable);
    }

    /**
     * Enable all forms submit inputs
     */
    unlock() {
        return this.state !== STATE_LOADING && !!_.each(this.buttons, Dom.enable);
    }

    /**
     * Main function which runs validation
     * @param e {Event}
     */
    onInputChange(e) {
        // Only elements with name can be tested

        // Filter
        let isSelectType = e.target.type ? !!~e.target.type.indexOf('select') : false, //tesxtarea does not have type prop
            isChangeEvent = e.type === 'change';

        if (isSelectType ^ isChangeEvent || !e.target.name) {
            return;
        }
        let inputObj = this.__inputs[e.target.name];
        if (!inputObj) {
            return;
        }
        inputObj.errors = _.filter(inputObj.errors, (err) => {
            if (!_.isFunction(err.validate) || err.validate(inputObj.getValue(), inputObj.element)) {
                Dom.removeNode(err.element);
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
    addRule(element, validator) {
        // return;
        // let inputObj = this.__findInput(element);
        // if (!inputObj) {
        //     if (process.env.NODE_ENV !== 'production') {
        //         throw new Error('Form does not have input ' + (_.isString(element) ? 'with name ' : '') + element + '.');
        //     }
        //     return false;
        // }
        // return !!inputObj.rules.push(validator);
    }
    /*eslint-enable*/

    /**
     * Adds new error to TrinityForm instance
     * @param element {string || HTMLElement} - input name or instance itself
     * @param error {string || object}
     * @param [args] {Array}
     * @public
     */
    addError(element, error, ...args) {
        let inputObj = this.__findInput(element);
        if (!inputObj) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('Form does not have input ' + (_.isString(element) ? 'with name ' : '') + element + '.');
            }
            return false;
        }
        this.state = STATE_ERROR;
        let errObj = __createMessage(
            error, // error object or string
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
    hasError(element, errorId) {
        let inputObj = this.__findInput(element);
        if (!inputObj) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('Form does not have input ' + (_.isString(element) ? 'with name ' : '') + element + '.');
            }
            return false;
        }
        return errorId ?
            _.some(inputObj.errors, err => err.id === errorId)
            : inputObj.errors.length > 0;
    }

    /**
     * Remove error with errorKey provided, or remove all errors if errorKey is not provided
     * @param element {HTMLElement || string} - name of input or input itself
     * @param [errorId] {string}
     * @returns {boolean}
     */
    removeError(element, errorId) {
        let inputObj = this.__findInput(element);
        if (!inputObj) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('Form does not have input ' + (_.isString(element) ? 'with name ' : '') + element + '.');
            }
            return false;
        }

        if (errorId) {
            _.remove(inputObj.errors, err => {
                return err.id === errorId && !!Dom.removeNode(err.element);
            });
        } else {
            // Remove all if error key not provided
            _.each(inputObj.errors, err => Dom.removeNode(err.element));
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
    setMessage(element, message, ...args) {
        let inputObj = this.__findInput(element);
        if (!inputObj) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('Form does not have input ' + (_.isString(element) ? 'with name ' : '') + element + '.');
            }
            return false;
        }
        let msg = __createMessage(
            message, // msg object or string
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
    removeMessage(element) {
        let inputObj = this.__findInput(element);
        if (!inputObj) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error('Form does not have input ' + (_.isString(element) ? 'with name ' : '') + element + '.');
            }
            return false;
        }
        return inputObj.clearMessage() || true;
    }

    /**
     * Validates if all errors are removed from form
     * If yes, unlock form and remove error state if neccessary
     * @public
     * @returns {boolean}
     */
    validate() {
        if (this.isValid()) {
            this.unlock();
            if (this.state === STATE_ERROR) {
                this.state = STATE_READY;
            }
            return true;
        }
        return false;
    }

    /**
     * Check if form is in valid state but does not have side effect
     * @returns {boolean}
     */
    isValid() {
        return !_.some(this.__inputs, input => !input.isValid());
    }

    /**
     * Submit event listener
     * - can be also forced
     * @Note - no event is triggered
     * @param e
     */
    submit(e) {
        /** catch button with focus first **/
        this.activeBtn = document.activeElement.type === 'button' ? document.activeElement : this.buttons[0];
        /** Continue **/
        e && e.preventDefault();

        /** Lock and Load **/
        this.lock();
        this.state = STATE_LOADING;

        /** Parse and send Data **/
        let data = IS_FORM_DATA ?
                serializeFrom(this.form, this.activeBtn) : __parseSymfonyForm(this.form, this.activeBtn),
            url = this.form.action.trim(),
            method = (data.hasOwnProperty('_method') ? data['_method'] : this.form.method).toUpperCase(),
            submitEvent = new TrinityEvent({
                url,
                method,
                data
            })
            ;

        this.__emitter.emit('submit', submitEvent);

        if (submitEvent.defaultPrevented) {
            return;
        }

        let req = Request(method, url)
            .set({
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            })
            .timeout(this.settings.requestTimeout)
            .send(data)
            .on('progress', (e) => {
                this.__emitter.emit('progress', e);
            });

        this.__emitter.emit('before-request', req);

        req.end((err, response) => {
            // Redirect ?
            if (response && response.status === 302) {
                let redirectTo = response.body.location;
                // Do callback and then redirect
                if (this.__successHandler(response) === false) {
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
                return this.__errorHandler(err);
            }

            this.__successHandler(response);
        });
    }

    /**
     * Adds 'success' event Listener
     * @param callback {function}
     * @param [context] {Object} - this argument
     * @returns {TrinityForm}
     */
    success(callback, context) {
        this.on('success', callback, context);
        return this; // for chaining
    }

    /**
     * Adds 'error' event Listener
     * @param callback {function}
     * @param [context] {Object} - this argument
     * @returns {TrinityForm}
     */
    error(callback, context) {
        this.on('error', callback, context);
        return this; // for chaining
    }

    /**
     * Abbreviation for addListener
     * @param eventName {string}
     * @param callback {function}
     * @param context {object}
     * @returns {TrinityForm}
     */
    on(eventName, callback, context) {
        this.addListener(eventName, callback, context);
    }

    /**
     * Abbreviation for addListener
     * @param eventName {string}
     * @param callback {function}
     * @param context {object}
     * @returns {TrinityForm}
     */
    /*eslint-disable*/
    addListener(eventName, callback, context){
    /*eslint-enable*/
        this.__emitter.addListener.apply(this.__emitter, arguments);
    }

    /**
     * Force set submit buttons
     * @param buttons {Array<HTMLElement>}
     */
    setSubmitButtons(buttons) {
        /** Add ready class to all buttons **/
        let btnReadyClass = this.settings.button[STATE_READY].split(' ');
        _.each(this.buttons, (btn) => {
            Dom.classlist.removeAll(btn, btnReadyClass);
        });
        this.buttons = buttons;
        _.each(this.buttons, (btn) => {
            Dom.classlist.addAll(btn, btnReadyClass);
        });
    }

    detach() {
        this.__emitter.emit('beforeDetach', new TrinityEvent(this.element));
        // Main listener
        this.unlistenSubmit();
        this.unlistenValueChange();
        this.unlistenValueInput();
        this.element = null;
        this.__inputs = null;
    }

    __findInput(element) {
        return this.__inputs[_.isString(element) ? element : element.name];
    }

    /**
     * Form success handler
     * @param response {Object}
     * @private
     */
    __successHandler(response) {
        let event = new TrinityEvent(response);

        this.state = STATE_SUCCESS;
        this.__emitter.emit('success', event);

        this.unlock();
        let id = setTimeout(() => {
            this.state = STATE_READY;
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
    __errorHandler(error) {
        if (error.timeout) {
            this.state = STATE_TIMEOUT;
            let id = setTimeout(() => {
                this.unlock();
                this.state = STATE_READY;
                clearTimeout(id);
            }, this.settings.timeoutTimeout);
        } else {
            this.state = STATE_ERROR;
        }

        // Emit event
        let event = new TrinityEvent(error);
        this.__emitter.emit('error', event);
        return !event.defaultPrevented;
    }

}

/**
 * Create message and returns object with description and element object
 * @param msg {object || string}
 * @param template {function}
 * @param prefix {string}
 * @param args {Array}
 * @returns {{message: *}|*}
 * @private
 */
function __createMessage(msg, template, prefix, args) {
    msg = _.isString(msg) ? {message: msg} : msg;
    msg.id = msg.id || (prefix + ('' + (Math.random() * 100)).substr(3, 4));

    // Create message
    msg.element = Dom.htmlToDocumentFragment(msg.isHtml ?
        msg.message : template.apply(null, [msg.message].concat(args))
    );
    msg.element.setAttribute('id', msg.id);
    return msg;
}

/**** PRIVATE METHODS ****/
/** FORM PARSER ************************************************************/

/**
 * Used to parse input name -> object path
 * @type {RegExp}
 */
const nameRegExp = /\w+/g;


function serializeFrom(form, button){
    let formData = new FormData();

    _.each(form, el => {
        if(!el.name){
            return;
        }

        let isValid = false;

        switch (el.type) {
            case 'submit' : {
                isValid = el === button;
            } break;
            case 'radio' :
            case 'checkbox' : {
                isValid = el.checked;
            } break;
            default: {
                isValid = el.value && el.value.length !== 0;
            } break;
        }

        if(isValid) {
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
    let data = {},
        formLength = form.length;
    /** Go through all inputs in form */
    for (let i = 0; i < formLength; i++) {
        if (!form[i].name || form[i].name.length < 1) {
            continue;
        }
        if ((!form[i].value || form[i].value.length < 1) && form[i].type !== 'submit') {
            continue; // No need to do any work if there are no values
        }

        switch (form[i].type) {
            case 'submit' : {
                if (form[i] === button) {
                    break;
                }
                continue;
            }
            case 'radio' :
            case 'checkbox' : {
                if (!form[i].checked) {
                    continue;
                }
                break;
            }
            default:
                break;
        }

        // Init necessary variables
        let isArray = ~form[i].name.indexOf('[]'),
            parsed = form[i].name.match(nameRegExp),
            reference = data,
            last = parsed.length - 1;
        /** Evaluate parsed reference object */
        for (let j = 0; j <= last; j++) {
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
