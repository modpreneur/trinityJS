/**
 * Created by fisa on 11/1/15.
 */
'use strict';

import _ from 'lodash';
import Controller from './Controller.js';

const defaultSettings = {
    attributeName: 'data-ng-scope',
};

/**
 * Represents application, provides main control over running js
 */
export default class App {
    /**
     * Constructor of App
     * @param router {Router}
     * @param controllers {Object} <Name: classFunction>
     * @param [settings] {Object}
     *
     * @default settings
     * {
     *      attributeName: 'data-ng-scope'
     * }
     */
    constructor(router, controllers, settings){
        //Settings FIRST !
        this.settings = _.defaultsDeep(settings || {}, defaultSettings);

        this.controllers = controllers;
        this.router = router;
        // this.global = null;
        this.activeController = null;
        this.preBootScripts = [];

        // This way $scope property cannot be reassigned
        Object.defineProperty(this, '$scope', {
            value: {}
        });

        /** Try to find initial scope **/
        _.extend(this.$scope, this.parseScope());
    }

    /**
     * Kick up application
     * @param [successCallback] {Function} optional success callback
     * @param [errorCallback] {Function} optional error callback. If not provided, error is thrown
     * @returns {boolean}
     */
    start(successCallback, errorCallback){
        //super cool feature
        _.find(this.preBootScripts, script => script(this.$scope));

        /**
         * Active controller
         */
        let controllerInfo = this.router.findController();
        if(_.isNull(controllerInfo)) {
            return this.finishCallback(false, successCallback);
        }

        let [name, action] = controllerInfo.action.split('.');

        if(!name){
            let err = new Error('No Controller defined! did you forget to define controller in routes?');
            if(errorCallback){
                return errorCallback(err);
            }
            throw err;
        }

        // Load controller
        name += 'Controller';
        action = (action || 'index') + 'Action';

        // Create new active controller instance
        if(!this.controllers.hasOwnProperty(name)){
            throw new Error('Controller ' + name
                + ' does not exist, did you forget to run "buildControllers.js" script?'
                + ' or did you write correct routes?'
            );
        }

        /** Create and Set up controller instance **/
        let instance = new this.controllers[name](name);
        if(!(instance instanceof Controller)){
            throw new Error(name + ' does not inherit from "Controller" class!');
        }

        instance._scope = this.$scope;
        instance._app = this;
        instance.request = controllerInfo.request;
        this.activeController = instance;

        /** Run **/
        if(instance[action]){
            // Defer function to make place for initial rendering
            _.defer(() => {
                instance.beforeAction(this.$scope);
                instance[action](this.$scope);
                instance.afterAction(this.$scope);

                // now run finish
                this.finishCallback(true, successCallback);
            });

            return true;
        }

        // Something screw up - error
        let err = new Error('Action "' + action + '" doesn\'t exists');
        if(errorCallback){
            return errorCallback(err);
        }
        throw err;
    }

    /**
     * add script befor launching of app
     * @param func {function} if true is returned => lounch app (skip other pre-scripts)
     */
    addPreBOOTScript(func){
        this.preBootScripts.push(func);
    }

    /**
     * Finishing success callback
     * @param isController {boolean}
     * @param callback {function}
     * @returns {boolean}
     */
    finishCallback(isController, callback){
        if(process.env.NODE_ENV !== 'production'){
            let message = isController ?
                this.activeController.name + ' loaded.'
                : 'Route does\'t have any controller.';
            console.log(message);
        }
        if(callback){
            callback(this.activeController || false);
        }
        return isController;
    }

    /**
     * Search in "root" element for every element with attribute defined in settings
     * @param root
     * @returns {{}} - bag with {attName.value:element}
     */
    parseScope(root){
        root = root || window.document;
        let attName = defaultSettings.attributeName,
            elements = root.querySelectorAll('[' + attName + ']');

        let bag = {};
        _.each(elements, (el, i) => {
            let name = el.getAttribute(attName) || '' + el.name + i;
            if(_.isUndefined(bag[name])) {
                bag[name] = el;
            } else {
                if(_.isArray(bag[name])){
                    bag[name].push(el);
                } else {
                    // crate new array
                    bag[name] = [bag[name], el];
                }
            }
        });
        return bag;
    }
}