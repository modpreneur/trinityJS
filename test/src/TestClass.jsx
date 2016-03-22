'use strict';

export default class TestClass {
    constructor(name){
        this.name = name;
    }

    sayHello(){
        console.log('Hello from Test Class ', this.name);
    }
}