/**
 * Created by fisa on 11/1/15.
 */
'use strict';

import _ from 'lodash';
import Router from './Router';
import Controller from './Controller.js';
import Debug from './Debug';

const defaultSettings = {
    env: 'prod',
    attributeName: 'data-ng-scope',
    globalController: null
};

/**
 * Represents application, provides main control over running js
 */
export default class App {
    constructor(routes, controllers, settings){
        //Settings FIRST !
        this.settings = _.defaultsDeep(settings || {}, defaultSettings);
        if(this.settings.env === 'dev' || this.settings.env === 'development'){
            Debug.env = 'dev';
        }

        this.routes = routes;
        this.controllers = controllers;
        this.router = new Router(routes);
        this.global = null;
        this.activeController = null;

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
     * @param [errorCallback] {Function} optional error callback
     * @returns {boolean}
     */
    start(successCallback, errorCallback){
        let name = this.settings.globalController,
            action = 'indexAction';

        if(!_.isNull(name)){
            name += 'Controller';
            // Create new active controller instance
            if(!this.controllers.hasOwnProperty(name)){
                throw new Error('Global Controller '+ name+ ' does not exist, did you forget to run "buildControllers.js" script?');
            }

            this.global = new this.controllers[name](name);
            if(!(this.global instanceof Controller)){
                throw new Error(name + ' does not inherit from "Controller" class!');
            }
            this.global._scope = this.$scope;
            this.global._app = this;
            this.global[action](this.$scope);
        }

        /**
         * Active controller
         */
        let controllerInfo = this.router.findController();
        if(_.isNull(controllerInfo)) {
            return this.finishCallback(false, successCallback);
        }

        [name, action] = controllerInfo.action.split('.');

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
            throw new Error('Controller '+ name
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
            instance.beforeAction(this.$scope);
            instance[action](this.$scope);
            instance.afterAction(this.$scope);
        } else {
            let err = new Error('Action "'+ action + '" doesn\'t exists');
            if(errorCallback){
                return errorCallback(err);
            }
            throw err;
        }
        return this.finishCallback(true, successCallback);
    }

    /**
     * Finishing success callback
     * @param isController {boolean}
     * @param callback {function}
     * @returns {boolean}
     */
    finishCallback(isController, callback){
        let message = isController ?
            this.activeController.name + ' loaded.'
            : 'Route does\'t have any controller.';

        Debug.log(message);
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
        let attName = this.settings.attributeName,
            elements = root.querySelectorAll('['+ attName +']');

        let bag = {};
        _.each(elements, (el, i)=>{
            let name = el.getAttribute(attName) || ''+el.name + i;
            if(_.isUndefined(bag[name])) {
                bag[name] = el;
            } else {
                if(_.isArray(bag[name])){
                    bag[name].push(el);
                }
                // crate new array
                bag[name] = [bag[name], el];
            }
        });
        return bag;
    }

    /**
     * Getter for environment
     * @returns {string|*|string}
     */
    get environment(){
        return this.settings.env;
    }

    isDevEnvironment(){
        return Debug.isDev();
    }
}