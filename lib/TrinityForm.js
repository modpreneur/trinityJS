/**
* Created by fisa on 8/19/15.
*/

import _ from 'lodash';
import Gateway from './Gateway.js';
import events from './utils/closureEvents.js';
import Dom from './utils/Dom.js';
import Store from './Store.js';
import {messageService} from './Services.js';

/**
 * Super form class - automatically handles form with ajax requests and adds extra behaviour
 * @param form {HTMLFormElement}
 * @param type {string}
 * @constructor
 */
export default class TrinityForm {
    constructor(formElement, type) {
        if (_.isNull(formElement)) {
            throw new Error('Input parameter "formElement" cannot be NULL!');
        }
        this.element = formElement;
        this.type = type || null;
        this.loading = false;
        this.errors = [];
        this.activeBtn = null;
        this.buttons = formElement.qAll('input[type="submit"]');
        //Main init
        _initialize.call(this, formElement);
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
     * @param key
     * @param input
     * @param message
     * @public
     */
    addError(key, input, message){
        // Create Error
        var error = new FieldError(key, input, message, _createErrorMessage(key, message));
        // Add error to Form errors and get its index
        var index = this.errors.push(error) - 1;
        //Add event listener and save listener key
        error.listenerKey = events.listenOnce(input, 'change', _removeError.bind(this, index));
    };

    /**
     * Removes error from TrinityForm
     * @param input {string} | {HTMLInputElement}
     * @public
     */
    removeError(input){
        var index = _.isString(input) ?
            _.findIndex(this.errors, function(err){
                return err.key === input;
            }) : _.findIndex(this.errors, function(err){
            return err.input === input;
        });
        var error = _removeError(index);
        events.unlistenByKey(error.listenerKey);
    };

    /**
     * Validates if all errors are removed from form
     * @public
     */
    validate(){
        if(this.errors.length < 1){
            this.unlock();
            this.removeButtonIcon();
        }
    }

    /**
     * Turn on/off Loading Effect
     * @public
     */
    toggleLoading(){
        if(this.loading) {
            this.loading = false;
            _removeIconWrapper(this.activeBtn);
        } else {
            this.activeBtn = this.activeBtn || (this.buttons[0] || null);
            if(_.isNull(this.activeBtn)){ return; } // Should never be true

            this.loading = true;
            _addIconWrapper(this.activeBtn, TrinityForm.tiecons.loading);
        }
    }

    /**
     * Add icon to active button
     * @param icon {HTMLElement} | {string}
     */
    addButtonIcon(icon){
        var btn = this.activeBtn ? this.activeBtn : this.buttons[0];
        if(_.isString(icon)){
            icon = Dom.htmlToDocumentFragment(icon);
        }
        _addIconWrapper.call(this, btn, icon);
    }

    /**
     * Remove whole wrapper of active button
     */
    removeButtonIcon(){
        _removeIconWrapper(this.activeBtn ? this.activeBtn : this.buttons[0]);
    }
}

/** STATIC CONSTANTS **/
/**
 * Form types
 * @static
 */
TrinityForm.formType = {
    EDIT:'edit',
    NEW :'new',
    DELETE:'delete'
};

/**
 * Static default settings property
 * @static
 */
TrinityForm.settings = {
    debug = false
};

/**
 * Default icons
 * @static
 */
TrinityForm.tiecons = {
    loading:_createIcon({
        'class' : 'tiecons tiecons-loading tiecons-rotate font-20',
        'style' : 'color:#530e6d;'
    }),
    ok:_createIcon({
        'class' : 'tiecons tiecons-check font-20',
        'style' : 'color:#39b54a;'
    }),
    error:_createIcon({
        'class' : 'tiecons tiecons-cross-radius font-20',
        'style' : 'color: rgb(121, 0, 0);'
    })
};

/**
 * Initialize TrinityForm
 * @param form
 * @param type
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
        this.toggleLoading();

        /** Parse and send Data **/
        var data = parseSymfonyForm(form, this.activeBtn);
        var method = data.hasOwnProperty('_method')? data['_method'] : form.method;

        /** Discover type **/
        if(_.isNull(this.type)){
            switch(method){
                case 'POST' : this.type = TrinityForm.formType.NEW; break;
                case 'PUT' : this.type = TrinityForm.formType.EDIT; break;
                default : this.type = TrinityForm.formType.DELETE; break;
            }
        }
        Gateway.sendJSON(
            form.action,
            method,
            data, //Json object
            _successHandler.bind(this),
            _errorHandler.bind(this)
        );
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
function _successHandler(response){
    // Default Behaviour
    if(this.type === 'edit'){
        this.toggleLoading();
        this.unlock();
        messageService(response.message, 'success');
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
function _errorHandler(error){
    /** DEFAULT ERROR HANDLER **/
    if(error.db){
        //TODO: replace with message service
        messageService(error.db, 'warning');
        this.toggleLoading();
        this.unlock();
        return true;
    }
    var noErrors = true;
    if(error.global && error.global.length > 0){
        noErrors = false;
        _globalErrors(error.global);
    }

    if(error.fields && error.fields.length > 0){
        noErrors = false;
        this.loading = false;
        this.addButtonIcon(TrinityForm.tiecons.error);
        _fieldErrors.call(this, error.fields);
    } else {
        this.toggleLoading();
        this.unlock();
    }
    if(noErrors && TrinityForm.settings.debug){
        messageService('DEBUG: Request failed but no FORM errors returned! check server response', 'warning')
    }
    return true;
}

/**
 * Handles global errors
 * @param errors
 * @private
 */
function _globalErrors(errors){
    var count = errors.length;
    for(var i=0; i< count; i++){
        //TODO: replace with message service
        messageService(errors[i], 'warning')
    }
}

/**
 * Handles Field Errors - adds them to form
 * @param fields
 * @private
 */
function _fieldErrors(fields){
    for(var key in fields){
        if(fields.hasOwnProperty(key)){
            var input = q.id(key);
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
function FieldError(key, input, message, warn){
    this.key = key;
    this.input = input;
    this.message = message;
    this.warning = warn;
    this.listenerKey = null;
    // Add error message
    Dom.classlist.add(input, 'error');
    input.parentElement.appendChild(warn);
}

/**
 * Remove Error from TrinityForm instance and returns removed FieldError instance
 * @param index
 * @param e {Event}
 * @private
 * @return {FieldError}
 */
function _removeError(index, e){
    if(!_.isUndefined(e)){
        e.stopPropagation();
        e.preventDefault();
    }
    var error = this.errors[index];
    _.pullAt(this.errors, index);
    Dom.classlist.remove(error.input, 'error');
    Dom.removeNode(error.warning);
    this.validate();
    return error;
}

/**
 * Just return Error message element
 * @param key
 * @param message
 * @private
 */
function _createErrorMessage(key, message){
    let errDiv = document.createElement('div');
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
function _createIcon(attributes, innerHTMLstring){
    let icon = document.createElement('i'),
        attrKeys = Object.keys(attributes);
    _.each(attrKeys, function(key){
        icon.setAttribute(key, attributes[key]);
    });
    if(innerHTMLstring){
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
function _addIconWrapper(btn, icon){
    /** Prepare Icon **/
    icon = icon.cloneNode(true);
    icon.style.width = '100%';
    icon.style.marginTop = '7px';
    Dom.classlist.addAll(icon, ['absolute', 'display-block']);

    var wrapper = Store.getValue(btn, 'wrapper');
    if(_.isNull(wrapper)) {
        wrapper = Dom.createDom('span', {'class': 'clearfix relative text-center'});
        Dom.classlist.addAll(wrapper, Dom.classlist.get(btn));
        wrapper.style.setProperty('padding', '0px', 'important');
        /** Store info **/
        Store.setValue(btn, 'wrapper', wrapper);
        Store.setValue(btn, 'value', btn.value);
    } else if(wrapper.children.length > 1){
        /** Replace icon **/
        Dom.replaceNode(icon, wrapper.children[1]);
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
function _removeIconWrapper(btn){
    var btnValue = Store.getValue(btn, 'value'),
        wrapper = Store.getValue(btn, 'wrapper');
    if(!_.isNull(wrapper)){
        //restore button
        wrapper.parentElement.insertBefore(btn, wrapper);
        btn.value = btnValue;
        btn.style.width = '';
        btn.style.margin = '';
        // Clean wrapper
        Dom.removeNode(wrapper);
        Dom.removeChildren(wrapper);
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
function parseSymfonyForm(form, button){
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
