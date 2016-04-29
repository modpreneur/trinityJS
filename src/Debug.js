'use strict';

let ENV = 'prod';
let IS_DEV = false;

function noop(){/*Nothing will happen*/}

export default class Debug {

    static error(){
        if(IS_DEV){
            console.error.apply(console, arguments)
        }
    }

    static log(){
        if(IS_DEV){
            console.log.apply(console, arguments)
        }
    }

    static isDev(){
        return ENV === 'dev' || ENV === 'development';
    }

    static get env(){
        return ENV;
    }

    static set env(val){
        ENV = val;
        IS_DEV = Debug.isDev();
    }
}

/** Class Extensions - default just empty function **/
Debug.dump = noop;
