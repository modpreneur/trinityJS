'use strict';

import './style.css';
import 'trinity/src/devTools';
import Debug from 'trinity/src/Debug';

import _ from 'lodash';
import App from 'trinity/src/App';
import superagent from 'superagent';

import routes from './routes.jsx';
import IndexController from './Controllers/IndexController.jsx';
import GlobalController from './Controllers/GlobalController.jsx';

let application = new App(routes, {
    IndexController,
    GlobalController
}, {
    env: 'dev',
    globalController: 'Global'
});

application.start();
window.application = application;
window.Debug = Debug;

