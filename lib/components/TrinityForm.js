import _ from 'lodash';
import Gateway from '../Gateway';
import {EventEmitter} from 'fbemitter';
import events from 'trinity/utils/closureEvents';
import Dom from 'trinity/utils/Dom';

/**
 * Default settings of form instances
 * @type {{type: null, button: {loading: string, success: string, error: string, ready: string}}}
 */
const defaultSettings = {
    type: null,
    button : { // Defines which classes add to active button in which state
        loading: 'trinity-form-loading',
        success: 'trinity-form-success',
        error: 'trinity-form-error',
        ready: 'trinity-form-ready'
    }
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
        this.element = formElement;
        this.activeBtn = null;
        this.buttons = formElement.querySelectorAll('input[type="submit"], button[type="submit"]');
        this.type = type || null;
        this.settings = _.extend(_.cloneDeep(defaultSettings), settings);
        this.__errors = [];
        this.__state = 'ready';
        //Main init
        _initialize.call(this, formElement);
    }

    /**
     * Sets new form state
     *  - add state classes to button
     *  - emit "state-change" event
     * @param newState
     */
    set state(newState){
        let oldState = this.__state;
        this.__state = newState;

        //Switch classes
        Dom.classlist.removeAll(this.activeBtn, this.settings.button[oldState].split(' '));
        Dom.classlist.addAll(this.activeBtn, this.settings.button[newState].split(' '));

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
        return this.element.getAttribute('name');
    };

    /**
     * Adds new error to TrinityForm instance
     * @param key {string}
     * @param message {string}
     * @param inputElement {HTMLElement}
     * @public
     */
    addError(key, message, inputElement){
        // Create Error
        let error = new FieldError(key, message, inputElement, __createErrorMessage(key, message));
        // Add error to Form errors and get its index
        let index = this.__errors.push(error) - 1;
        //Add event listener and save listener key
        error.listenerKey = events.listenOnce(inputElement, 'change', __removeError.bind(this, index));
    };

    /**
     * Removes error from TrinityForm
     * @param input {string} | {HTMLInputElement}
     * @public
     */
    removeError(input){
        let index = _.isString(input) ?
            _.findIndex(this.__errors, (err)=>{
                return err.key === input;
            }) : _.findIndex(this.__errors, (err)=>{
                return err.input === input;
            }
        );
        let error = __removeError(index);
        events.unlistenByKey(error.listenerKey);
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
}

/** STATIC CONSTANTS **/
/**
 * Form types
 * @static
 */
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
function _initialize(form){
    /** Add listener to form element **/
    events.listen(form, 'submit', function(e){
        /** catch button with focus first **/
        this.activeBtn = document.activeElement.type === 'button' ? document.activeElement : this.buttons[0];
        /** Continue **/
        e.preventDefault();
        /** Lock and Load **/
        this.lock();
        this.state = 'loading';
        //this.toggleLoading();

        /** Parse and send Data **/
        let data = __parseSymfonyForm(form, this.activeBtn);
        let method = data.hasOwnProperty('_method')? data['_method'] : form.method;

        /** Discover type **/
        if(_.isNull(this.type)){
            switch(method){
                case 'POST' : this.type = formType.NEW; break;
                case 'PUT' : this.type = formType.EDIT; break;
                default : this.type = formType.DELETE; break;
            }
        }
        Gateway.sendJSON(
            form.action,
            method,
            data, //Json object
            __successHandler.bind(this),
            __errorHandler.bind(this)
        );
    }, false, this);
}

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
    if(this.type === 'edit'){
        this.unlock();
        let id = setTimeout((e)=>{
            this.state = 'ready';
            clearTimeout(id);
        }, 3000);
    }
}

/**
 * Form error handler
 * @param error
 * @private
 * @returns {boolean}
 */
function __errorHandler(error){
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
function FieldError(key, message, input, warn){
    this.key = key;
    this.input = input;
    this.message = message;
    this.warning = warn;
    this.listenerKey = null;
    // Add error message
    Dom.classlist.add(input, 'error');
    let sibling = input.nextSibling;
    if(sibling){
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
function __removeError(index, e){
    if(!_.isUndefined(e)){
        e.stopPropagation();
        e.preventDefault();
    }
    let error = _.pullAt(this.__errors, index)[0];
    Dom.classlist.remove(error.input, 'error');
    Dom.removeNode(error.warning);
    this.validate();
    return error;
}

/**
 * Just return Error message element
 * TODO: possibility for custom in settings
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
