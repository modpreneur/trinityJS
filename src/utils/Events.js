'use strict';

const Events = {
    /**
     * Abbreviation for target.addEventListener
     * @param {HTMLElement} target
     * @param {string} event
     * @param {function} callback
     * @param {boolean} [capture]
     * @returns {function}
     */
    on: __listen,

    /**
     * Abbreviation for target.addEventListener
     * @param {HTMLElement} target
     * @param {string} event
     * @param {function} callback
     * @param {boolean} [capture]
     * @returns {function}
     */
    listen: __listen,

    /**
     * Adds wrapper around function and after first invocation, remove listener
     * @Note Returns correct listener for removing
     * @param {HTMLElement} target
     * @param {string} event
     * @param {function} callback
     * @param {boolean} [capture]
     * @returns {function}
     */
    once: __listenOnce,

    /**
     * Adds wrapper around function and after first invocation, remove listener
     * @Note Returns correct listener for removing
     * @param {HTMLElement} target
     * @param {string} event
     * @param {function} callback
     * @param {boolean} [capture]
     * @returns {function}
     */
    listenOnce: __listenOnce,

    /**
     * Abbreviation for target.removeEventListener
     * @param {HTMLElement} target
     * @param {string} event
     * @param {function} callback
     * @param {boolean} [capture]
     * @returns {void}
     */
    off: __removeListener,

    /**
     * Abbreviation for target.removeEventListener
     * @param {HTMLElement} target
     * @param {string} event
     * @param {function} callback
     * @param {boolean} [capture]
     * @returns {void}
     */
    unlisten: __removeListener,


    /**
     * Abbreviation for target.removeEventListener
     * @param {HTMLElement} target
     * @param {string} event
     * @param {function} callback
     * @param {boolean} [capture]
     * @returns {void}
     */
    removeListener: __removeListener,

    /**
     * @inherit
     */
    onAnimation: __onAnimation,

    /**
     * @inherit
     */
    offAnimation: __offAnimation,

    /**
     * @inherit
     */
    onceAnimation: __onceAnimation
};


/**
 * Abbreviation for target.addEventListener
 * @param {HTMLElement} target
 * @param {string} event
 * @param {function} callback
 * @param {boolean} [capture]
 * @returns {function}
 * @private
 */
function __listen(target, event, callback, capture = false){
    target.addEventListener(event, callback, capture);
    return __removeListener.bind(null, target, event, callback, capture);
}

/**
 * Adds wrapper around function and after first invocation, remove listener
 * @Note Returns correct listener for removing
 * @param {HTMLElement} target
 * @param {string} event
 * @param {function} callback
 * @param {boolean} [capture]
 * @private
 * @returns {function}
 */
function __listenOnce(target, event, callback, capture = false){
    let wrapper = (function(){
        return function(e){
            target.removeEventListener(event, wrapper, capture);
            callback(e);
        };
    })();
    target.addEventListener(event, wrapper, capture);
    return __removeListener.bind(null, target, event, wrapper, capture);
}

/**
 * Abbreviation for target.removeEventListener
 * @param {HTMLElement} target
 * @param {string} event
 * @param {function} callback
 * @param {boolean} [capture]
 * @returns {void}
 * @private
 */
function __removeListener(target, event, callback, capture = false){
    return target.removeEventListener(event, callback, capture);
}

/** ANIMATIONS **/
const ANIMATION_TYPE = {
    end:'AnimationEnd',
    start:'AnimationStart',
    iteration:'AnimationIteration'
};

const ANIMATION_PREFIX = {
    'WebkitAnimation':'webkit',
    'OAnimation':'o'
};

/**
 * Finds Correct animation event name for current browser
 * @param {string} type enum: [start, end, iteration]
 * @returns {string} Animation Event name
 * @throws Incorrect animation type
 * @private
 */
function __whichAnimationEvent(type){
    type = ANIMATION_TYPE[type.toLowerCase()];
    if(!type){
        throw new Error('Incorrect animation type! Correct values: [start, end, iteration]');
    }
    let el = window.document.createElement('fakeelement'),
        prefix = '';

    for(let key in ANIMATION_PREFIX){
        if(el.style[key] !== undefined){
            prefix = ANIMATION_PREFIX[key];
            break;
        }
    }

    return prefix + !prefix ? type.toLowerCase() : type;
}

/**
 * Adds animation event listener
 * @param {HTMLElement} element
 * @param {string} type enum:[start, end, iteration]
 * @param {Function} callback
 * @param {boolean} [capture]
 * @returns {Function} - bound callback to remove listener
 * @private
 */
function __onAnimation(element, type, callback, capture = false){
    let eventName = __whichAnimationEvent(type);
    return __listen(element, eventName, callback, capture);
}

/**
 * Adds animation event listener and after first execution its removed
 * @param {HTMLElement} element
 * @param {string} type enum:[start, end, iteration]
 * @param {Function} callback
 * @param {boolean} [capture]
 * @returns {Function} - bound callback to remove listener
 * @private
 */
function __onceAnimation(element, type, callback, capture = false){
    let eventName = __whichAnimationEvent(type);
    return __listenOnce(element, eventName, callback, capture);
}

/**
 * Remove animation event listener
 * @param {HTMLElement} element
 * @param {string} type enum:[start, end, iteration]
 * @param {Function} callback
 * @param {boolean} [capture]
 * @returns {void}
 * @private
 */
function __offAnimation(element, type, callback, capture = false){
    let eventName = __whichAnimationEvent(type);
    return __removeListener(element, eventName, callback, capture);
}


export default Events;