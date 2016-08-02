'use strict';

import ClassList from 'trinity/utils/classlist';

// Default is value
const TYPE_VAL_MAP = {
    radio: 'checked',
    checkbox: 'checked'
};

export default class FormInput {
    constructor(element){
        this.element = element;
        this.errors = [];
        this.rules = [];
        this.messages = [];
        this.messageWrapper = document.createElement('div');

        let sibling = element.nextSibling;
        if(sibling){
            element.parentElement.insertBefore(this.messageWrapper, sibling);
        } else {
            element.parentElement.appendChild(this.messageWrapper);
        }
    }

    getValue(){
        return this.element[TYPE_VAL_MAP[this.element.type] || 'value'];
    }

    isValid(){
        return this.errors.length === 0 ? ClassList.remove(this.element, 'error') || true : false;
    }
}