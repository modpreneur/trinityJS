'use strict';

import './style.css';
import _ from 'lodash';
import App from 'trinity/src/App.new';
import routes from './routes.jsx';
import IndexController from './Controllers/IndexController.jsx';
let application = new App(routes, {
    IndexController
}, {
    env: 'dev'
});

application.start();
console.log('meh')
window.application = application;

