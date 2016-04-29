'use strict';

import _ from 'lodash';
import Router from './Router';
import Controller from './Controller.js';
import Debug from './Debug';

const defaultSettings = {
    env: 'production',
    controllersPath: '/'
};

/**
 * Represents application, provides main control over running js
 * @deprecated
 */
export default class App {
    constructor(routes, controllers, settings){
        //Settings FIRST !
        this.settings = _.defaultsDeep(settings || {}, defaultSettings);
        // Removed in new version
        if(settings.environment){
            this.settings.env = settings.environment;
        }
        if(this.settings.env === 'dev' || this.settings.env === 'development'){
            Debug.env = 'dev';
            System.import('trinity/devTools');
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
        if(this.isDevEnvironment()) {
            return this.__devStart(successCallback, errorCallback);
        } else {
            return this.__prodStart();
        }
    }

    /**
     * Kick up production application
     * @returns {boolean}
     * @private
     */
    __prodStart(){
        let controller = this.router.findController();
        if(_.isNull(controller)) {
            return false;
        }

        let controllerInfo = controller.action.split('.');
        if(controllerInfo.length < 1){
            throw new Error('No Controller defined! did you forget to define controller in routes?');
        }
        let name = controllerInfo[0] + 'Controller',
            action = controllerInfo[1] + 'Action' || 'indexAction';

        // Create new active controller instance
        if(!this.controllers.hasOwnProperty(name)){
            throw new Error('Controller '+ name+ ' does not exist, did you forget to run "buildControllers.js" script?');
        }

        /** Create and Set up controller instance **/
        let instance = new this.controllers[name]();
        if(!(instance instanceof Controller)){
            throw new Error(name + ' does not inherit from "Controller" class!');
        }
        instance._scope = this.$scope;
        instance._app = this;
        instance.request = controller.request;
        this.activeController = instance;

        /** Run **/
        if(instance[action]){
            instance[action](this.$scope);
        }
        return true;
    }

    /**
     * Kick up development application
     * @param successCallback {Function} optional success callback
     * @param errorCallback {Function} optional error callback
     * @returns {boolean}
     * @private
     */
    __devStart(successCallback, errorCallback){
        let path =  this.settings.controllersPath;
        let controller = this.router.findController();
        if(_.isNull(controller)) {
            if(successCallback){
                successCallback(false);
            }
            return false;
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
        let self = this;
        System.import(path + '/'+name+'.js').then(function(resp){
            /** Create and Set up controller instance **/
            let instance = new resp.default();
            if(!(instance instanceof Controller)){
                let err = new Error(name + ' does not inherit from "Controller" class!');
                if(errorCallback){
                    return errorCallback(err);
                }
                throw err;
            }
            instance._scope = self.$scope;
            instance._app = self;
            instance.request = controller.request;
            self.activeController = instance;

            /** Run **/
            if(instance[action]){
                instance[action](self.$scope);
                if(successCallback){
                    successCallback(instance);
                }
            } else {
                let err = new Error('Action "'+ action + '" doesn\'t exists');
                if(errorCallback){
                    return errorCallback(err);
                }
                throw err;
            }
        }).catch(function(err){
            if(errorCallback){
                errorCallback(err);
            }
        });
        return true;
    }

    /**
     * Kick up application
     * @deprecated use start() instead and define path in settings as "controllersPath"
     * @param path {String} where to look for controller
     *  - used for async lazy load of controller file described in routes array
     * @param successCallback {Function} optional success callback
     * @param errorCallback {Function} optional error callback
     * @returns {boolean}
     */
    devStart(path, successCallback, errorCallback){
        this.settings.controllersPath = path;
        return this.__devStart(successCallback, errorCallback);
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