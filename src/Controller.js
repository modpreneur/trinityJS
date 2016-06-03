/**
 * Created by fisa on 11/2/15.
 */
'use strict';

/**
 * Abstract Controller class, provides connection between app and activeController itself
 * Should be inherited from in every controller
 */
export default class Controller {
    constructor(name){
        this.name = name;
        this._app = null;
        this._scope = null;
        this._request = null;
    }

    /**
     * Simple getter - has to be specified
     * @returns {*}
     */
    get request(){
        return this._request;
    }

    /**
     * Setter for "request" property - make sure that request can be assigned only once
     * @param value
     * @returns {void}
     */
    set request(value){
        if(this._request === null){
            this._request = value;
        }
    }

    getScope(){
        return this._scope;
    }

    getApp(){
        return this._app;
    }

    /**
     * Hook to run before every action
     */
    beforeAction($scope){}

    /**
     * Hook after every action run
     */
    afterAction($scope){}

    /**
     * Not implemented
     * @param serviceName
     */
    getService(serviceName){
        console.warn('Method not implemented');
        //TODO: should pull from app requested service, if exists, if not return null
    }

}