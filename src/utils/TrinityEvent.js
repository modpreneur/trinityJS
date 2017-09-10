'use strict';

function TrinityEvent(data){
    this.defaultPrevented = false;
    this.data = data;
    return this;
}

TrinityEvent.prototype.preventDefault = function(){
    this.defaultPrevented = true;
};


export default TrinityEvent;
