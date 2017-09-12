/**
 * Created by fisa on 10/26/15.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.messageService = messageService;

var _Dom = require('./utils/Dom.js');

var _Dom2 = _interopRequireDefault(_Dom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Flash messages
 * @param message
 * @param type
 * @deprecated
 * This is kind of memory leak, as it is expected to delete message on close button
 * This should be fixed, also whole service should be upgraded to have some message management, and handle
 * all events in once place
 */
function messageService(message, type) {
    type = type || 'info';
    message = message || type;

    var ajaxInput = document.querySelector('.ajax-checkbox'),
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

    var iconClass = '';
    switch (type) {
        case 'success':
            {
                iconClass = 'mdi mdi-check-circle';
            }
            break;
        case 'warning':
            {
                iconClass = 'mdi mdi-alert';
            }
            break;
        case 'error':
        case 'danger':
            {
                type = 'danger';
                iconClass = 'mdi mdi-alert-circle-outline';
            }
            break;
        default:
            {
                iconClass = 'mdi mdi-information-outline';
            }
            break;
    }

    // Assign new values
    var id = Math.floor(Math.random() * (9999 - 10));
    ajaxInput.setAttribute('id', 'close-alert-' + type + '-' + id);
    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{id}', id.toString()).replace('{message}', message).replace('{icon}', iconClass).replace('{type}', type);
    ajaxAlert.className = ajaxAlert.className.replace('{type}', type);

    _Dom2.default.classlist.remove(ajaxInput, 'ajax-checkbox');
    _Dom2.default.classlist.remove(ajaxAlert, 'ajax-alert');

    box.appendChild(ajaxInput);
    box.appendChild(ajaxAlert);

    if (type === 'success') {
        var timeOutId = setTimeout(function () {
            _Dom2.default.removeNode(ajaxInput);
            _Dom2.default.removeNode(ajaxAlert);
            clearTimeout(timeOutId); // just to be sure
        }, 2000);
    }
    return {
        ajaxInput: ajaxInput,
        ajaxAlert: ajaxAlert
    };
}