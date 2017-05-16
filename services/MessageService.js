'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MessageService = function () {
    /**
     * Constructor for message service
     * @param container {HTMLElement}
     * @param template {function}
     */
    function MessageService(container, template) {
        _classCallCheck(this, MessageService);

        this.container = container;
        this.template = template;
        this.maxMessages = 10;
        this.removeTimeout = 300;
        this.queue = [];
        this.messages = {};
    }

    /**
     * Adds new message (notification)
     * @param message {string}
     * @param type {string}
     */


    _createClass(MessageService, [{
        key: 'add',
        value: function add(message, type) {
            var _this = this;

            var id = 'flash-message-' + type + '-' + Math.floor(Math.random() * (9999 - 10)),
                newMessage = this.template(id, type, message);

            // assign id to be sure
            newMessage.id = id;

            // Add to DOM
            this.container.appendChild(newMessage.input);
            this.container.appendChild(newMessage.box);

            // Add to queue and collection
            this.messages[id] = newMessage;
            this.queue.push(id);

            // Add onclose callback
            newMessage.input.onchange = function () {
                return _this.remove(id);
            };

            // Add timeout if needed
            if (newMessage.timeout) {
                newMessage.timeoutId = setTimeout(function () {
                    return _this.remove(id);
                }, newMessage.timeout);
            }

            // At last, check if stack queue is full and then remove first element in queue
            if (this.queue.length > this.maxMessages) {
                this.remove(this.queue[0]);
            }
        }

        /**
         * Removes message from DOM
         * @param id {string}
         */

    }, {
        key: 'remove',
        value: function remove(id) {
            var _this2 = this;

            var msg = this.messages[id];

            // remove from queue
            _lodash2.default.pull(this.queue, id);

            // remove from messages
            var input = msg.input,
                box = msg.box;

            this.messages[id] = null;
            delete this.messages[id];

            // check for animation
            msg.input.checked = true;

            // clear timeout if needed
            if (msg.timeoutId) {
                clearTimeout(msg.timeoutId);
            }

            // prepare for removing from DOM
            setTimeout(function () {
                _this2.container.removeChild(input);
                _this2.container.removeChild(box);
            }, this.removeTimeout);
        }
    }]);

    return MessageService;
}();

exports.default = MessageService;