'use strict';

import './testLess.less';
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
window.application = application;

