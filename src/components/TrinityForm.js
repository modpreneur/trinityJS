'use strict';

import _ from 'lodash';
import Request from 'superagent';
import {EventEmitter} from 'fbemitter';
import Events from '../utils/Events';
import Dom from '../utils/Dom';

/**
 * Default FORM settings
 * @type {{
 *      type: null,
 *      button: {loading: string, success: string, error: string, ready: string},
 *      successTimeout: number
 *   }}
 */
const defaultSettings = {
    type: null,
    button : { // Defines which classes add to active button in which state
        loading: 'trinity-form-loading',
        success: 'trinity-form-success',
        timeout: 'trinity-form-timeout',
        error: 'trinity-form-error',
        ready: 'trinity-form-ready'
    },
    requestTimeout: 10000,
    successTimeout: 3000,
    timeoutTimeout: 2000
};

/**
 * Trinity form types
 * @type {{EDIT: string, NEW: string, DELETE: string}}
 */
const formType = {
    EDIT: 'edit',
    NEW : 'new',
    DELETE : 'delete'
};

const IS_FORM_DATA = !!window.FormData;

/**
 * Connects to formElement and change it to ajax form
 *
 * @param form {HTMLFormElement}
 * @param [type] {String} - type of form
 * @param [settings] {Object}
 * @constructor
 */
export default class TrinityForm extends EventEmitter {
    constructor(formElement, type, settings) {
        super();
        if (!formElement) {
            throw new Error('Missing "formElement" parameter!');
        }
        this.form = formElement;
        this.buttons = formElement.querySelectorAll('input[type="submit"], button[type="submit"]');
        this.activeBtn = null;
        this.type = type || null;
        this.settings = _.defaultsDeep(settings || {}, defaultSettings);
        this.__errors = [];
        this.__state = 'ready';

        //Main initialize
        // Add ready class to all buttons
        let btnReadyClass = this.settings.button['ready'].split(' ');
        _.each(this.buttons, (btn)=>{
            Dom.classlist.addAll(btn, btnReadyClass);
        });

        // Add listener to form element
        this.unlistenSubmit = Events.listen(formElement, 'submit', this.submit.bind(this));
    }

    /**
     * Sets new form state
     *  - add state classes to button
     *  - emit "state-change" event
     * @param newState
     */
    set state(newState){
        if(newState === this.__state){
            return;
        }
        let oldState = this.__state;
        this.__state = newState;

        if(newState === 'error' || newState === 'ready'){
            // For all btns
            _.each(this.buttons, (btn)=>{
                Dom.classlist.removeAll(btn, this.settings.button[oldState].split(' '));
                Dom.classlist.addAll(btn, this.settings.button[newState].split(' '));
            });
        } else {
            //Switch classes for active
            Dom.classlist.removeAll(this.activeBtn, this.settings.button[oldState].split(' '));
            Dom.classlist.addAll(this.activeBtn, this.settings.button[newState].split(' '));
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
    get state(){
        return this.__state;
    }

    /**
     * Disable all forms submit inputs
     */
    lock(){
        _.each(this.buttons, Dom.disable);
    }
    /**
     * Enable all forms submit inputs
     */
    unlock(){
        if(this.loading){
            return false;
        }
        _.each(this.buttons, Dom.enable);
        return true;
    }
    /**
     * Returns name of the form
     * @returns {string}
     */
    getName(){
        return this.form.getAttribute('name');
    };

    /**
     * Adds new error to TrinityForm instance
     * @param key {string}
     * @param message {string}
     * @param inputElement {HTMLElement}
     * @public
     */
    addError(key, message, inputElement){
        this.state = 'error';
        // Add error to Form errors and get its index
        let fieldErr = _.find(this.__errors, (err)=>{
            return err.key === key;
        });
        if(!fieldErr){
            fieldErr = new FieldError(key, inputElement);
            this.__errors.push(fieldErr);
        }
        if(!fieldErr.listener){
            fieldErr.listener = Events.listenOnce(inputElement, 'input', (e)=>{
                e.preventDefault();
                e.stopPropagation();

                _.remove(this.__errors, (err)=>{
                    return err.key === fieldErr.key;
                });
                fieldErr.removeAll();
                this.validate()
            });
        }
        return fieldErr.add(message);
    };

    /**
     * Check if form has error with same key
     * @param inputKey {string} - key of input
     * @param [errorId] {string} - id of error message
     * @returns {boolean}
     */
    hasError(inputKey, errorId){
        return this.__errors.length > 0 && !!_.find(this.__errors, (err)=>{
                return err.key === inputKey && (!errorId || err.has(errorId));
            });
    }

    /**
     * Remove errors from TrinityForm input
     * @param input {string} | {HTMLInputElement}
     * @public
     */
    removeError(input){
        let fieldError = (_.isString(input) ?
                _.remove(this.__errors, (err)=>{
                    return err.key === input;
                }) : _.remove(this.__errors, (err)=>{
                return err.input === input;
            })[0]
        );
        fieldError.removeAll();
        Events.removeListener(fieldError.input, 'input', fieldError.listener);
    };

    /**
     * Validates if all errors are removed from form
     * @public
     */
    validate(){
        if(this.__errors.length < 1){
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
    submit(e){
        /** catch button with focus first **/
        this.activeBtn = document.activeElement.type === 'button' ? document.activeElement : this.buttons[0];
        /** Continue **/
        if(e){
            e.preventDefault();
        }
        /** Lock and Load **/
        this.lock();
        this.state = 'loading';
        //this.toggleLoading();

        /** Parse and send Data **/
        let data = null;
        if(IS_FORM_DATA){
            data = new FormData(this.form);
        } else {
            data = __parseSymfonyForm(this.form, this.activeBtn);
        }

        let url = this.form.action.trim();
        let method = (data.hasOwnProperty('_method')? data['_method'] : this.form.method).toUpperCase();


        /** Discover type **/
        if(_.isNull(this.type)){
            switch(method){
                case 'POST' : this.type = formType.NEW; break;
                case 'PUT' : this.type = formType.EDIT; break;
                default : this.type = formType.DELETE; break;
            }
        }

        this.emit('submit-data', {
            url,
            method,
            data
        });

        Request(method, url)
            .set({
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            })
            .timeout(this.settings.requestTimeout)
            //.timeout(1)
            .send(data)
            .on('progress', (e)=>{
                this.emit('progress', e);
            })
            .end((err, response)=>{
                // Redirect ?
                if(response && response.status === 302) {
                    let redirectTo = response.body.location;
                    // Do callback and then redirect
                    if(__successHandler.call(this, response) === false){
                        return false;
                    }
                    // Redirect
                    if(!redirectTo && Debug.isDev()){
                        throw new Error('Missing "location" attribute!');
                    }
                    window.location.assign(redirectTo);
                    return;
                }
                // Error ?
                if(err){
                    return __errorHandler.call(this, err);
                }

                __successHandler.call(this, response);
            });
    }

    /**
     * Adds 'success' event Listener
     * @param callback {function}
     * @param [context] {Object} - this argument
     * @returns {TrinityForm}
     */
    success(callback, context){
        this.addListener('success', callback, context);
        return this; // for chaining
    }

    /**
     * Adds 'error' event Listener
     * @param callback {function}
     * @param [context] {Object} - this argument
     * @returns {TrinityForm}
     */
    error(callback, context){
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
    on(eventName, callback, context){
        this.addListener.apply(this, arguments);
    }

    /**
     * Force set submit buttons
     * @param buttons {Array<HTMLElement>}
     */
    setSubmitButtons(buttons){
        /** Add ready class to all buttons **/
        let btnReadyClass = this.settings.button['ready'].split(' ');
        _.each(this.buttons, (btn)=>{
            Dom.classlist.removeAll(btn, btnReadyClass);
        });
        this.buttons = buttons;
        _.each(this.buttons, (btn)=>{
            Dom.classlist.addAll(btn, btnReadyClass);
        });
    }

    detach(){
        // Main listener
        this.unlistenSubmit();
        // Errors if any
        if(this.__errors.length > 0){
            _.each(this.__errors, (err)=>{
                err.removeAll();
                Events.removeListener(err.input, 'input', err.listener);
            });
        }
        this.element = null;
    }
}

/** STATIC CONSTANTS **/
/**
 * Form types
 * @static
 */
TrinityForm.formType = formType;


/**** PRIVATE METHODS ****/
/** RESPONSE HANDLERS ************************************************************/

/**
 * Form success handler
 * @param response {Object}
 * @private
 */
function __successHandler(response){
    this.state = 'success';
    this.emit('success', response);

    // Edit type behaviour
    //if(this.type === 'edit'){
        this.unlock();
        let id = setTimeout((e)=>{
            this.state = 'ready';
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
function __errorHandler(error){
    if(error.timeout){
        this.state = 'timeout';
        let id = setTimeout(()=>{
            this.unlock();
            this.state = 'ready';
            clearTimeout(id);
        }, this.settings.timeoutTimeout)
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
class FieldError {
    constructor(key, input){
        this.key = key;
        this.input = input;
        this.listener = null;
        this.errors = [];
        this.__counter = 0;
        // Add error message
        Dom.classlist.add(input, 'error');
    }

    add(message){
        let errMessage = {
            id: (this.__counter++) + '_'+ this.key,
            message: message,
            warning: __createErrorMessage(this.key, message)
        };
        this.errors.push(errMessage);

        let sibling = this.input.nextSibling;
        if(sibling){
            this.input.parentElement.insertBefore(errMessage.warning, sibling);
        } else {
            this.input.parentElement.appendChild(errMessage.warning);
        }
        return errMessage.id;
    }

    has(id){
        return !!_.find(this.errors, (err)=>{
            return err.id === id;
        });
    }

    remove(id){
        _.remove(this.errors, (err)=>{
            if(err.id === id){
                Dom.removeNode(err.warning);
                return true;
            }
            return false;
        });
        if(this.errors.length === 0){
            Dom.classlist.remove(this.input, 'error');
        }
    }

    removeAll(){
        _.map(this.errors, (err)=>{
            Dom.removeNode(err.warning);
        });
        this.errors = [];
        Dom.classlist.remove(this.input, 'error');
    }
}

/**
 * Just return Error message element
 * TODO: possibility for custom message in settings
 * @param key {string}
 * @param message {string}
 * @private
 */
function __createErrorMessage(key, message){
    let errDiv = document.createElement('div');
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
const nameRegExp = /\w+/g;

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
function __parseSymfonyForm(form, button){
    var data = {},
        formLength = form.length;
    /** Go through all inputs in form */
    for(var i=0;i< formLength; i++){
        if(!form[i].name || form[i].name.length < 1){
            continue;
        }
        if((!form[i].value || form[i].value.length < 1) && form[i].type !== 'submit' ){
            continue; // No need to do any work if there are no values
        }

        switch(form[i].type){
            case 'submit' : {
                if(form[i] === button){
                    break;
                }
                continue;
            }
            case 'radio' :
            case 'checkbox' :{
                if(!form[i].checked){
                    continue;
                }
                break;
            }
            default:break;
        }

        // Init necessary variables
        var isArray = form[i].name.indexOf('[]') !== -1,
            parsed = form[i].name.match(nameRegExp),
            reference = data,
            last = parsed.length -1;
        /** Evaluate parsed reference object */
        for(var j=0;j<=last;j++){
            if(!reference[parsed[j]]){
                if(j === last){
                    if(isArray){
                        reference[parsed[j]] = [];
                        reference[parsed[j]].push(form[i].value);
                    } else {
                        reference[parsed[j]] = form[i].value;
                    }
                } else { /** Not last -> create object */
                reference[parsed[j]] = {};
                    reference = reference[parsed[j]];
                }
            } else {
                if(j === last) {
                    if(isArray){
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
