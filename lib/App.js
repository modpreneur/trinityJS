/**
 * Created by fisa on 11/1/15.
 */
import _ from 'lodash';
import Router from './Router.js';
import Controller from './Controller.js';
import c2 from 'trinity/Controller';
import c3 from 'trinity/Controller.js';

const defaultSettings = {
    environment: 'production'
};

console.log('TEST IF WORKS');
/**
 * Represents application, provides main control over running js
 */
export default class App {
    constructor(routes, controllers, settings){
        this.routes = routes;
        this.controllers = controllers;
        this.router = new Router(routes);
        this.settings = _.extend(_.extend({}, defaultSettings), settings);
        this.activeController = null;
        // This way $scope property cannot be reassigned
        Object.defineProperty(this, '$scope', {
            value: {}
        });
    }

    /**
     * Kick it up
     */
    start(){
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

    devStart(path, successCallback, errorCallback){
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
        System.import(path + '/'+name+'.js').then(function(controler){
            /** Create and Set up controller instance **/
            let instance = new controler.default();
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
     * Getter for environment
     * @returns {string|*|string}
     */
    get environment(){
        return this.settings.environment;
    }
}