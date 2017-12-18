'use strict';

class TrinityEvent{
    /**
     * TrinityEvent constructor
     * @param {*} data
     */
    constructor(data){
        this.defaultPrevented = false;
        this.data = data;
    }

    /**
     * Set property defaultPerevented to true
     */
    preventDefault() {
        this.defaultPrevented = true;
    }
}

export default TrinityEvent;
