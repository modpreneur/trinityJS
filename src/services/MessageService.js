'use strict';

import _ from 'lodash';

export default class MessageService {
    /**
     * Constructor for message service
     * @param container {HTMLElement}
     * @param template {function}
     */
    constructor(container, template) {
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
    add(message, type){

        let id = `flash-message-${type}-${Math.floor(Math.random() * (9999 - 10))}`,
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
        newMessage.input.onchange = () => this.remove(id);

        // Add timeout if needed
        if(newMessage.timeout){
            newMessage.timeoutId = setTimeout(() => this.remove(newMessage.input.id), newMessage.timeout);
        }

        // At last, check if stack queue is full and then remove first element in queue
        if(this.queue.length > this.maxMessages) {
            this.remove(this.queue[0]);
        }
    }

    /**
     * Removes message from DOM
     * @param id {string}
     */
    remove(id){
        let msg = this.messages[id];

        // remove from queue
        _.pull(this.queue, id);

        // remove from messages
        let {input, box} = msg;
        this.messages[id] = null;
        delete this.messages[id];

        // check for animation
        msg.input.checked = true;

        // clear timeout if needed
        if(msg.timeoutId){
            clearTimeout(msg.timeoutId);
        }

        // prepare for removing from DOM
        setTimeout(() => {
            this.container.removeChild(input);
            this.container.removeChild(box);
        }, this.removeTimeout);
    }
}
