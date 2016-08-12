'use strict';

import Dom from '../utils/Dom';
import ClassList from '../utils/classlist';

// Default is value
const TYPE_VAL_MAP = {
    radio: 'checked',
    checkbox: 'checked'
};

export default class FormInput {
    constructor(element){
        this.element = element;
        this.rules = [];
        this.errors = [];
        this.message = null;
        this.msgWrapper = Dom.createDom('div', { 'class': 'form-msg-wrapper' });
        this.errorWrapper = Dom.createDom('div', { 'class': 'form-error-wrapper' });

        let sibling = element.nextSibling;
        if(sibling){
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
    getValue(){
        return this.element[TYPE_VAL_MAP[this.element.type] || 'value'];
    }

    /**
     * Validates if input has any error, if not removes 'error' className
     * @returns {boolean}
     */
    isValid(){
        return this.errors.length === 0 ? ClassList.remove(this.element, 'error') || true : false;
    }

    /**
     * Adds error to form input
     * @param error
     * @returns {*}
     */
    addError(error){
        this.errors.push(error);
        this.errorWrapper.appendChild(error.element);
        Dom.classlist.add(this.element, 'error');
        return error.id;
    }

    /**
     * Set information message to input
     * @param msg
     * @returns {*}
     */
    setMessage(msg){
        this.clearMessage();
        this.message = msg;
        this.msgWrapper.appendChild(msg.element);
        return msg.id;
    }

    /**
     * Delete message
     */
    clearMessage(){
        if(this.message){
            Dom.removeNode(this.message.element);
            this.message = null;
        }
    }
}