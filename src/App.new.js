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
    attributeName: 'data-ng-scope'
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
        this.activeController = null;

        // This way $scope property cannot be reassigned
        Object.defineProperty(this, '$scope', {
            value: {}
        });
    }

    /**
     * Kick up application
     * @param [successCallback] {Function} optional success callback
     * @param [errorCallback] {Function} optional error callback
     * @returns {boolean}
     */
    start(successCallback, errorCallback){
        let controller = this.router.findController();
        if(_.isNull(controller)) {
            return this.finishCallback(false, successCallback);
        }

        let controllerInfo = controller.action.split('.');
        if(controllerInfo.length < 1){
            let err = new Error('No Controller defined! did you forget to define controller in routes?');
            if(errorCallback){
                return errorCallback(err);
            }
            throw err;
        }
        // Load controller
        let name = controllerInfo[0] + 'Controller',
            action = controllerInfo[1] + 'Action' || 'indexAction';

        // Create new active controller instance
        if(!this.controllers.hasOwnProperty(name)){
            throw new Error('Controller '+ name+ ' does not exist, did you forget to run "buildControllers.js" script?');
        }

        /** Create and Set up controller instance **/
        let instance = new this.controllers[name](name);
        if(!(instance instanceof Controller)){
            throw new Error(name + ' does not inherit from "Controller" class!');
        }

        /** Try to find initial scope **/
        _.extend(this.$scope, this.parseScope());

        instance._scope = this.$scope;
        instance._app = this;
        instance.request = controller.request;
        this.activeController = instance;

        /** Run **/
        if(instance[action]){
            instance[action](this.$scope);
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
            bag[name] = el;
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