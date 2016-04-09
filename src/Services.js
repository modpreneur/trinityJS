/**
 * Created by fisa on 10/26/15.
 */
import Dom from './utils/Dom.js';


/**
 * Flash messages
 * @param message
 * @param type
 */
export function messageService(message, type){
    type = type || 'info';
    message = message || type;

    var ajaxInput = q('.ajax-checkbox');
    var ajaxAlert = q('.ajax-alert');

    if(!ajaxInput || !ajaxAlert){
        console.log('MESSAGE', message);
        alert(message);
        return;
    }

    ajaxInput = ajaxInput.cloneNode(true);
    ajaxAlert = ajaxAlert.cloneNode(true);

    var id = Math.floor( Math.random() * (9999 - 10) );

    ajaxInput.setAttribute('id', 'close-alert-' + type + '-' + id.toString());
    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{id}', id.toString());
    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{type}', type);
    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{message}', message);
    ajaxAlert.className = ajaxAlert.className.replace('{type}', type);

    if (type == 'success') {
        ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{icon}', 'trinity trinity-ok');
    }
    if (type == 'warning') {
        ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{icon}', 'trinity trinity-warning');
    }
    if (type == 'danger') {
        ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{icon}', 'tiecons tiecons-exclamation-mark-circle');
    }
    if (type == 'info') {
        ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{icon}', 'trinity trinity-info');
    }

    ajaxAlert.innerHTML = ajaxAlert.innerHTML.replace('{icon}', 'trinity trinity-info');

    Dom.classlist.remove(ajaxInput, 'ajax-checkbox');
    Dom.classlist.remove(ajaxAlert,'ajax-alert');

    var box = q.id('flashMessages');
    box.appendChild(ajaxInput);
    box.appendChild(ajaxAlert);

    if(type == 'success'){
        let timeOutId = null;
        timeOutId = setTimeout(function(){
            Dom.removeNode(ajaxInput);
            Dom.removeNode(ajaxAlert);
            clearTimeout(timeOutId); // just to be sure
        }, 2000);
    }
}