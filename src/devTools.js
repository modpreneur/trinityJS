/**
 * Created by fisa on 11/11/15.
 */
'use strict';
/**
 * DevTools should just extend normal framework components with debugging features.
 * For example Debug object is extended with some methods and mode is automatically set to 'dev'
 *
 * TODO: This is just try (prove of concept), all needs to be more deeply considered.
 */

import Debug from './Debug';

Debug.dump = function(){
    window.document.documentElement.innerHTML = Array.prototype.join.call(arguments, '<br><br>');
};