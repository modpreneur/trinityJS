'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
function TrinityEvent(data) {
    this.defaultPrevented = false;
    this.data = data;
    return this;
}

TrinityEvent.prototype.preventDefault = function () {
    this.defaultPrevented = true;
};

exports.default = TrinityEvent;