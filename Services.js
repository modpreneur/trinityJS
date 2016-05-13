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
 */
function messageService(message, type) {
    type = type || 'info';
    message = message || type;

    var ajaxInput = q('.ajax-checkbox'),
        ajaxAlert = q('.ajax-alert'),
        box = q.id('flashMessages');

    if (!ajaxInput || !ajaxAlert) {
        console.log('MESSAGE', message);
        alert(message);
        return;
    }

    ajaxInput = ajaxInput.cloneNode(true);
    ajaxAlert = ajaxAlert.cloneNode(true);

    var iconClass = '';
    switch (type) {
        case 'success':
            {
                iconClass = 'trinity trinity-ok';
            }break;
        case 'warning':
            {
                iconClass = 'trinity trinity-warning';
            }break;
        case 'error':
        case 'danger':
            {
                type = 'danger';
                iconClass = 'tiecons tiecons-exclamation-mark-circle';
            }break;
        default:
            {
                iconClass = 'trinity trinity-info';
            }break;
    }

    // Assign new values
    var id = Math.floor(Math.random() * (9999 - 10));
    ajaxInput.setAttribute('id', 'close-alert-' + type + '-' + id);
    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{id}', id.toString()).replace('{message}', message).replace('{icon}', iconClass).replace('{type}', type);

    _Dom2.default.classlist.remove(ajaxInput, 'ajax-checkbox');
    _Dom2.default.classlist.remove(ajaxAlert, 'ajax-alert');

    box.appendChild(ajaxInput);
    box.appendChild(ajaxAlert);

    if (type == 'success') {
        (function () {
            var timeOutId = setTimeout(function () {
                _Dom2.default.removeNode(ajaxInput);
                _Dom2.default.removeNode(ajaxAlert);
                clearTimeout(timeOutId); // just to be sure
            }, 2000);
        })();
    }
}