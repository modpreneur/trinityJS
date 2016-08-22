'use strict';

function noop(){/*Nothing will happen*/}

export default class Debug {

    static error(){
        if(process.env.NODE_ENV !== 'production'){
            console.error.apply(console, arguments)
        }
    }

    static log(){
        if(process.env.NODE_ENV !== 'production'){
            console.log.apply(console, arguments)
        }
    }
}

/** Class Extensions - default just empty function **/
Debug.dump = noop;
