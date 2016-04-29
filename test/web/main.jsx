'use strict';

import './style.css';
import 'trinity/src/devTools';
import Debug from 'trinity/src/Debug';

import _ from 'lodash';
import App from 'trinity/src/App.new';
import superagent from 'superagent';

import routes from './routes.jsx';
import IndexController from './Controllers/IndexController.jsx';

let application = new App(routes, {
    IndexController
}, {
    env: 'dev'
});

console.log('sdfdfds');
application.start();
window.application = application;
window.Debug = Debug;

