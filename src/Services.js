/**
 * Created by fisa on 10/26/15.
 */
'use strict';

import Dom from './utils/Dom.js';
import _ from 'lodash';

/**
 * Flash messages
 * @param message
 * @param type
 */
export function messageService(message, type) {
    type = type || 'info';
    message = message || type;

    let ajaxInput = document.querySelector('.ajax-checkbox'),
        ajaxAlert = document.querySelector('.ajax-alert'),
        box = document.getElementById('flashMessages');

    if (!ajaxInput || !ajaxAlert) {
        console.log('MESSAGE', message);
        alert(message);
        return;
    }

    ajaxInput = ajaxInput.cloneNode(true);
    ajaxAlert = ajaxAlert.cloneNode(true);


    let iconClass = '';
    switch (type) {
        case 'success':
        {
            iconClass = 'trinity trinity-ok';
        }
            break;
        case 'warning':
        {
            iconClass = 'trinity trinity-warning';
        }
            break;
        case 'error':
        case 'danger':
        {
            type = 'danger';
            iconClass = 'tiecons tiecons-exclamation-mark-circle';
        }
            break;
        default :
        {
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
        let timeOutId = setTimeout(()=> {
            Dom.removeNode(ajaxInput);
            Dom.removeNode(ajaxAlert);
            clearTimeout(timeOutId); // just to be sure
        }, 2000);
    }
}


export class ErrorService {
    static ajaxError(error) {
        if (error.timeout) {
            messageService('We apologize, our servers are full. Please try again in few seconds', 'error');
        }
        if (error.response) {
            let code = error.response.statusCode,
                message = error.response.body && error.response.body.message;
            if (code >= 500) {
                messageService(message || 'Oops, Something went wrong. Please try again later.', 'error');
            } else if (code === 400) {
                messageService(message, 'error');
            } else if (code <= 403) { //401 and 403 are about denying access
                messageService(message || 'You don\'t have, permission to this action', 'error');
            } else if (code >= 404) {
                messageService(message || 'We are sorry, but api does not exist yet.', 'info');
            }
        }

        if (DEVELOPMENT) {
            if (error.timeout) {
                console.warn('Request timed out');
            } else {
                console.error(error);
                console.log(error.response);
            }
        }
        setTimeout(() => {
            throw new Error('Ajax Error');
        }, 0); // error will not stop flow
    }

    /**
     * 
     * @param message
     */
    static dataError(message) {
        messageService(message || 'We\'r sorry, but page was not loaded properly and some parts may not work.', 'w');
        throw new Error('Data Error');
    }

    /**
     * Missing parts in Page
     * @param message {String} default = 'warning'
     * @param type {String}
     */
    static contentError(message, type = 'warning') {
        messageService(message || 'We\'r sorry, but page was not loaded properly and some parts may not work.', type);
        throw new Error('Content Error');
    }

    /**
     * Tests if scope have required keys
     * @param $scope {Object}
     * @param required {Array< String|Object<String {key}, boolean {multiple}> >}
     * @returns {Array<String|Object<String {key}, String {error}>>}
     */
    static testScope($scope, ...required) {
        return _.map(required, r => {
            if (_.isString(r)) {
                if (!$scope[r]) {
                    return r;
                }
            } else if ($scope[r.key]) {
                if (
                    (r.multiple && !_.isArray($scope[r.key])) ||
                    (!r.multiple && _.isArray($scope[r.key]))
                ) {
                    return r.key;
                }

            } else {
                return r.key;
            }
        });
    }

}