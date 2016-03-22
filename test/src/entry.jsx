'use strict';

//require('./style.css');
import './style.css';
import TestClass from './TestClass.jsx';

console.log('Hello world');
let fn = (x, y)=>(Math.pow(x+y,3));
console.log('something completely eles');

let tc = new TestClass('Mike');

tc.sayHello();

console.log(fn(1,2));