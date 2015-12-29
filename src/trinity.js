/**
 * Created by fisa on 11/9/15.
 */
import App from './App.js';
import Controller from './Controller.js';
import Router from './Router.js';
import * as Services from './Services.js';
import Gateway from './Gateway.js';
import Store from './Store.js';
import TrinityForm from './TrinityForm.js';
import TrinityTab from './TrinityTab.js'
import Collection from './Collection.js';
import components from './components.js';

/**
 * Just export all from trinity
 */
export default {
    // Core
    App,
    Controller,
    Router,

    // standalone utils
    Gateway,
    Store,
    Services,
    Collection,

    // depends on Gateway, Store and Services
    TrinityForm, // deprecated
    TrinityTab,
    components
};