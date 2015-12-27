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

    var ajaxInput = q('.ajax-checkbox');
    var ajaxAlert = q('.ajax-alert');

    if (!ajaxInput || !ajaxAlert) {
        console.log('MESSAGE', message);
        alert(message);
        return;
    }

    ajaxInput = ajaxInput.cloneNode(true);
    ajaxAlert = ajaxAlert.cloneNode(true);

    var id = Math.floor(Math.random() * (9999 - 10));

    ajaxInput.setAttribute('id', 'close-alert-' + type + '-' + id.toString());
    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{id}', id.toString());
    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{type}', type);
    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{message}', message);
    ajaxAlert.className = ajaxAlert.className.replace('{type}', type);

    if (type == 'success') {
        ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{icon}', 'tiecons tiecons-check color-green font-20');
    }
    if (type == 'warning') {
        ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{icon}', 'tiecons tiecons-exclamation-mark-triangle color-red font-20');
    }
    if (type == 'info') {
        ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{icon}', 'tiecons tiecons-info color-blue font-20');
    }

    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{icon}', 'tiecons tiecons-info color-blue font-20');

    _Dom2.default.classlist.remove(ajaxInput, 'ajax-checkbox');
    _Dom2.default.classlist.remove(ajaxAlert, 'ajax-alert');

    var box = q.id('flashMessages');
    box.appendChild(ajaxInput);
    box.appendChild(ajaxAlert);

    if (type == 'success') {
        (function () {
            var timeOutId = null;
            timeOutId = setTimeout(function () {
                _Dom2.default.removeNode(ajaxInput);
                _Dom2.default.removeNode(ajaxAlert);
                clearTimeout(timeOutId); // just to be sure
            }, 2000);
        })();
    }
} /**
   * Created by fisa on 10/26/15.
   */