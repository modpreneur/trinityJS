/**
 * Created by fisa on 7/23/15.
 */
'use strict';

import _ from 'lodash';

/**
 * Private help RegExpressions
 * @type {RegExp}
 */
const optionalParam = /\((.*?)\)/g,
    namedParam = /(\(\?)?:\w+/g,
    splatParam = /\*\w+/g,
    escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g,
    paramsRegExp = /:\w+/g
    ;


class Router {
    /**
     * Takes routes and create regular expression for each
     * @param routes
     * @constructor
     */
    constructor(routes){
        this.rawRoutes = routes;
        this.routes = Router.routeParser(routes);
        console.time('old-create');
        _.each(this.routes, (route) => {
            route.regx = Router.routeToRegularExpression(route.path);
        });
        console.timeEnd('old-create');


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
     * @param route {string}
     * @returns {Object| null}
     */
    findController(route = window.location.pathname) {
        let data = null,
            cache,
            controllerInfo;

        // console.time('experimental');
        // let experimental = this.findRoute(this.rawRoutes, route);
        // console.timeEnd('experimental');

        console.time('old');
        controllerInfo = _.find(this.routes, function(el) {
            cache = el.regx.exec(route);
            if(cache){
                data = cache;
                return true;
            }
            return false;
        }) || null;

        console.timeEnd('old');

        // console.log('COMPARE', controllerInfo, experimental);

        // If we found any controller -> create request and return it
        if(controllerInfo){
            /** Create request Info object */
            let search = window.location.search;
            controllerInfo.request = {
                path: controllerInfo.path,
                query: search.length > 0 ? _getQueryObj(search) : null,
                params: data.length > 2 ? __getParams(controllerInfo.path, data) : null,
            };
            //And return all inside one package
            return controllerInfo;
        }
        return null;
    }

    findRoute(routeObject, pathName){
        let resultRoute = null;

        function inner(routes, prefix = ''){
            _.each(routes, (route, pathFragment) => {
                let pathTemplate = `${prefix}${pathFragment}`;
                if(_.isString(route)){
                    if(Router.routeToRegularExpression(pathTemplate).test(pathName)){
                        resultRoute = {
                            path: pathTemplate,
                            action: route
                        };
                        return false;
                    }
                } else {
                    if(Router.routeToRegularExpressionPartial(pathTemplate).test(pathName)){
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
     * @param routeObject {Object} describing routes
     * @param prefix {string}
     * @returns {Array}
     */
    static routeParser(routeObject, prefix = '') {
        let routesArray = [];

        const innerParser = (routes, prefix = '') => {
            _.each(routes, (route, key) => {
                if(_.isString(route)) {
                    routesArray.push({
                        path: prefix + key,
                        action: route
                    });
                } else {
                    innerParser(route, prefix + key);
                }
            });
        };
        // call it
        innerParser(routeObject, prefix);

        return routesArray;
    }

    /**
     * Create regular expression from route - from backbone framework
     * @param route
     * @returns {RegExp}
     * @private
     */
    static routeToRegularExpression(route) {
        route = route.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function(match, optional) {
                return optional ? match : '([^/?]+)';
            })
            .replace(splatParam, '([^?]*?)');
        return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    }

    static routeToRegularExpressionPartial(route) {
        route = route.replace(escapeRegExp, '\\$&')
            .replace(optionalParam, '(?:$1)?')
            .replace(namedParam, function(match, optional) {
                return optional ? match : '([^/?]+)';
            })
            .replace(splatParam, '([^?]*?)');
        return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?');
    }
}




/**
 * Regular expression template to modify regular expressions of routes
 * @type {string}
 */
const prefixRegExp = '(?:\/\w+)*';

/**
 * Adds prefix to regular expression that any path can have any route prefix
 * Note: used only for debug purposes
 * @param regx
 * @returns {RegExp}
 * @private
 */
function __modifyRouteRegx(regx){
    let source = regx.source;
    let start = source.indexOf('^') !== 0 ? 0 : 1;
    return new RegExp(prefixRegExp + source.substring(start));
}


/**
 * Returns object with params like key:value
 * @param path {string}
 * @param regxResult
 * @returns {Object}
 * @private
 */
function __getParams(path, regxResult){
    let keys = path.match(paramsRegExp),
        values = regxResult.slice(1, regxResult.length - 1),
        params = {};

    // create pairs
    _.each(values, (val, i) => {
        params[keys[i].substring(1)] = val;
    });

    return params;
}

/**
 * Creates object with key:value pairs from query string (e.g. location.search)
 * @param str
 * @returns {Object}
 * @private
 */
function _getQueryObj(str){
    let pairs = str.substr(1).split('&'),
        query = {};

    _.each(pairs, p => {
        let ind = p.indexOf('=');
        query[p.substr(0, ind)] = p.substr(ind + 1);
    });
    return query;
}





export default Router;