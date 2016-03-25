/**
 * Created by fisa on 11/11/15.
 */
/**
 * DevTools should just extend normal framework components with debugging features.
 * For example Gateway is behaving differently in order to provide as much info as
 * possible when something goes wrong
 *
 * TODO: This is just try (prove of concept), all needs to be more deeply considered.
 */

import Debug from './Debug';

Debug.env = 'dev';
Debug.dump = ()=>{
    window.document.documentElement.innerHTML = arguments.join('<br><br>');
};