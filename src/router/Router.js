'use strict';

import _each from 'lodash/each';
import _find from 'lodash/find';
import _isString from 'lodash/isString';
import queryString from 'query-string';

/**
 * Private help RegExpressions
 * @type {RegExp}
 */
const optionalParam = /\((.*?)\)/g,
    namedParam = /(\(\?)?:\w+/g,
    splatParam = /\*\w+/g,
    escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g
    ;


class Router {
    /**
     * Takes routes and create regular expression for each
     * @param {object} routes
     * @constructor
     */
    constructor(routes){
        this.rawRoutes = routes;
        this.routes = Router.compileRoutes(routes);

        // initialize
        this._initialize();
    }

    /**
     * Initialize router
     * prepare and parse routes
     */
    _initialize(){
        _each(this.routes, (route) => {
            route.regx = Router.routeToRegExp(route.path);
        });

        /** Adds prefix to regular expressions **/
        if(process.env.NODE_ENV !== 'production'){
            this.routes = this.routes.map((route) => {
                let path = route.path;
                if(path.indexOf('/') > 1){
                    console.warn('Route should start with "/" char. Or should be index page "(/)". It can cause unexpected behaviour!', route);
                }
                route.regx = __modifyRouteRegx(route.regx);
                return route;
            });
        }
    }

    /**
     * Finds controller for route parameter
     * @param {string} route
     * @returns {Object | null}
     */
    findController(route = window.location.pathname) {
        let data = null,
            controller;

        controller = _find(this.routes, function(el) {
            data = el.regx.exec(route);
            return !!data;
        }) || null;
 

        // If we found any controller -> create request and return it
        if(controller){
            controller.request = {
                path: controller.path,
                query: queryString.parse(window.location.search),
                params: data.length > 2 ? _getParams(controller.path, data) : null
            };
        }
        return controller;
    }

    /**
     * Experimental function that search for specific route and dynamically creates regualr expressions
     * @param {Object} routeObject
     * @param {string} pathName
     * @ignore
     */
    findRoute(routeObject, pathName){
        let resultRoute = null;

        function inner(routes, prefix = ''){
            _each(routes, (route, pathFragment) => {
                let pathTemplate = `${prefix}${pathFragment}`;
                if(_isString(route)){
                    if(Router.routeToRegExp(pathTemplate).test(pathName)){
                        resultRoute = {
                            path: pathTemplate,
                            action: route
                        };
                        return false;
                    }
                } else {
                    if(Router.routeToRegExpPartial(pathTemplate).test(pathName)){
                        inner(route, pathTemplate);
                        return false; // break iteration
                    }
                }
            });
        }
        inner(routeObject);

        return resultRoute;
    }

    /**
     * Parser for nested routes object
     * Use recursive depth search to find and concat all routes
     * @param {Object} routeObject describing routes
     * @param {string} prefix
     * @returns {Array}
     */
    static compileRoutes(routeObject, prefix = '') {
        let routesArray = [];
        const inner = (routes, prefix) => {
            _each(routes, (route, key) => {
                if(_isString(route)) {
                    routesArray.push({
                        path: prefix + key,
                        action: route
                    });
                } else {
                    inner(route, prefix + key);
                }
            });
        };

        // call
        inner(routeObject, prefix);
       
        return routesArray;
    }

    /**
     * Create regular expression from route - from backbone framework
     * @param {string} route
     * @returns {RegExp}
     * @private
     */
    static routeToRegExp(route) {
        return new RegExp(`${Router._baseRouteToRegExp(route)}$`);
    }

    /**
     * Create regualr expression for route but does not include terminate char
     * @param {string} route
     * @returns {RegExp}
     * @ignore
     */
    static routeToRegExpPartial(route) {
        return new RegExp(Router._baseRouteToRegExp(route));
    }

    /**
     * Shared part of reacting RegExp route
     * @param {string} route
     * @returns {string}
     * @private
     */
    static _baseRouteToRegExp(route){
        return `^${route
            .replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, (match, optional) => optional ? match : '([^/?]+)')
            .replace(splatParam, '([^?]*?)')
        }(?:\\?([\\s\\S]*))?`;
    }
}




/**
 * Regular expression template to modify regular expressions of routes
 * Used for development only
 * @type {string}
 */
const prefixRegExp = '(?:\/\w+)*';

/**
 * Adds prefix to regular expression that any path can have any route prefix
 * Note: used only for development purposes. For example symfony have different entry points for developemnt, test and production.
 * @param {RegExp} regx
 * @returns {RegExp}
 * @private
 * @ignore
 */
function __modifyRouteRegx(regx){
    let source = regx.source;
    return new RegExp(prefixRegExp + source.substring(source.indexOf('^') !== 0 ? 0 : 1));
}


/**
 * Returns object with params like key:value
 * @param {string} path
 * @param {Array} regxResult
 * @returns {Object}
 * @private
 */
function _getParams(path, regxResult){
    let keys = path.match(namedParam),
        values = regxResult.slice(1, keys.length + 1),
        params = {};

    // create pairs
    _each(values, (val, i) => {
        params[keys[i].substring(1)] = val;
    });

    return params;
}

export default Router;