/**
 * Created by fisa on 10/26/15.
 */
'use strict';

import Dom from './utils/Dom.js';

/**
 * Flash messages
 * @param message
 * @param type
 *
 * todo: Only 'success' alert is cleared form DOM, other messages stays there
 * This is kind of memory leak, as it is expected to delete message on close button
 * This should be fixed, also whole service should be upgraded to have some message management, and handle
 * all events in once place
 */
export function messageService(message, type) {
    type = type || 'info';
    message = message || type;

    let ajaxInput = document.querySelector('.ajax-checkbox'),
        ajaxAlert = document.querySelector('.ajax-alert'),
        box = document.getElementById('flashMessages');

    if (!ajaxInput || !ajaxAlert) {
        /*eslint-disable*/
        console.log('MESSAGE', message);
        /*eslint-enable*/
        alert(message);
        return;
    }

    ajaxInput = ajaxInput.cloneNode(true);
    ajaxAlert = ajaxAlert.cloneNode(true);


    let iconClass = '';
    switch (type) {
        case 'success': {
            iconClass = 'trinity trinity-ok';
        }
            break;
        case 'warning': {
            iconClass = 'trinity trinity-warning';
        }
            break;
        case 'error':
        case 'danger': {
            type = 'danger';
            iconClass = 'tiecons tiecons-exclamation-mark-circle';
        }
            break;
        default : {
            iconClass = 'trinity trinity-info';
        }
            break;
    }

    // Assign new values
    let id = Math.floor(Math.random() * (9999 - 10));
    ajaxInput.setAttribute('id', 'close-alert-' + type + '-' + id);
    ajaxAlert.innerHTML = ajaxAlert.innerHTML
        .replace('{id}', id.toString())
        .replace('{message}', message)
        .replace('{icon}', iconClass)
        .replace('{type}', type);
    ajaxAlert.className = ajaxAlert.className.replace('{type}', type);

    Dom.classlist.remove(ajaxInput, 'ajax-checkbox');
    Dom.classlist.remove(ajaxAlert, 'ajax-alert');

    box.appendChild(ajaxInput);
    box.appendChild(ajaxAlert);

    if (type == 'success') {
        let timeOutId = setTimeout(() => {
            Dom.removeNode(ajaxInput);
            Dom.removeNode(ajaxAlert);
            clearTimeout(timeOutId); // just to be sure
        }, 2000);
    }
    return {
        ajaxInput,
        ajaxAlert
    };
}
