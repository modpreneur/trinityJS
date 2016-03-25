/**
 * Created by fisa on 11/9/15.
 */
import App from './App';
import AppNew from './App.new';
import Controller from './Controller';
import Router from './Router';
import Debug from './Debug';
import * as Services from './Services';
import Gateway from './Gateway';
import Store from './Store';
import Collection from './Collection';
import components from './components';

/**
 * Just export all from trinity
 */
export default {
    // Core
    App,
    AppNew,
    Controller,
    Router,
    Debug,

    // standalone utils
    Gateway,
    Store,
    Services,
    Collection,

    // depends on Gateway, Store and Services
    components
};