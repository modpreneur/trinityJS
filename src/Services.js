/**
 * Created by fisa on 10/26/15.
 */
'use strict';

import Dom from './utils/Dom.js';


/**
 * Flash messages
 * @param message
 * @param type
 */
export function messageService(message, type){
    type = type || 'info';
    message = message || type;

    let ajaxInput = q('.ajax-checkbox'),
        ajaxAlert = q('.ajax-alert'),
        box = q.id('flashMessages');

    if(!ajaxInput || !ajaxAlert){
        console.log('MESSAGE', message);
        alert(message);
        return;
    }

    ajaxInput = ajaxInput.cloneNode(true);
    ajaxAlert = ajaxAlert.cloneNode(true);

    let id = Math.floor( Math.random() * (9999 - 10) );

    ajaxInput.setAttribute('id', 'close-alert-' + type + '-' + id);
    let alertHTMLString = ajaxAlert.innerHTML
        .replace('{id}', id.toString())
        .replace('{type}', type)
        .replace('{message}', message)
        .replace('{type}', type);

    let iconClass = '';
    switch(type){
        case 'success': {
            iconClass = 'trinity trinity-ok';
        } break;
        case 'warning': {
            iconClass = 'trinity trinity-warning';
        } break;
        case 'error':
        case 'danger': {
            iconClass = 'tiecons tiecons-exclamation-mark-circle';
        } break;
        default : iconClass = 'trinity trinity-info'; break;
    }
    ajaxAlert.innerHTML = alertHTMLString.replace('{icon}', iconClass);

    Dom.classlist.remove(ajaxInput, 'ajax-checkbox');
    Dom.classlist.remove(ajaxAlert,'ajax-alert');

    box.appendChild(ajaxInput);
    box.appendChild(ajaxAlert);

    if(type == 'success'){
        let timeOutId = setTimeout(()=>{
            Dom.removeNode(ajaxInput);
            Dom.removeNode(ajaxAlert);
            clearTimeout(timeOutId); // just to be sure
        }, 2000);
    }
}