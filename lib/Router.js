/**
 * Created by fisa on 7/23/15.
 */
import _ from 'lodash';

/**
 * Private help RegExpressions
 * @type {RegExp}
 */
var optionalParam = /\((.*?)\)/g;
var namedParam = /(\(\?)?:\w+/g;
var splatParam = /\*\w+/g;
var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;
var paramsRegExp = /:\w+/g;

/**
 * Takes routes and create regular expression for each
 * @param routes
 * @constructor
 */
function Router(routes) {
    this.routes = routes.map(function (route) {
        route.regx = _routeToRegExp(route.path);
        return route;
    }, this);

    /** Adds prefix to regular expressions **/
    if(Router.settings.debug){
        this.routes = this.routes.map(function(route){
            route.regx = _modifyRouteRegx(route.regx);
            return route;
        }, this);
    }
}

Router.settings ={
    debug: false
};

/**
 * Regular expression template to modify regular expressions of routes
 * @type {string}
 */
var regxPrefix = '(?:\/\w+)*';

/**
 * Adds prefix to regular expression that any path can have any route prefix
 * Note: used only for debug purposes
 * @param regx
 * @returns {RegExp}
 * @private
 */
function _modifyRouteRegx(regx){
    var source = regx.source;
    var start = source.indexOf('^') !== 0 ? 0 : 1;
    return new RegExp(regxPrefix + source.substring(start));
}

/**
 * Finds controller for route parameter
 * @param route
 * @returns {Object| null}
 */
Router.prototype.findController = function findController(route) {
    route = route || window.location.pathname;
    var data = null;
    var c = _.find(this.routes, function (el) {
            var cache = el.regx.exec(route);
            if(!!cache){
                data = cache;
                return true;
            }
            return false;
    }) || null;

    // If we found any controller -> create request and return it
    if(c){
        /** Create request Info object */
        var search = window.location.search;
        c.request = new this.Request(
            c.path,
            data.length > 2 ? _getParams(c.path, data):null,
            search.length > 0 ? _getQueryObj(search):null
        );
        //And return all inside one package
        return c;
    }
    return null;
};


/**
 * Represents request object
 * @param path
 * @param params
 * @param query
 * @constructor
 */
Router.prototype.Request = function Request(path, params, query){
    this.path = path;
    this.query = query;
    this.params = params;
};

/**
 * Returns object with params like key:value
 * @param path {string}
 * @param regxResult
 * @returns {Object}
 * @private
 */
function _getParams(path, regxResult){
    var keys = path.match(paramsRegExp),
        values = regxResult.slice(1, regxResult.length -1),
        params = {};
    // create pairs
    for(var i=0;i<values.length;i++){
        params[keys[i].substring(1)] = values[i];
    }
    return params;
}

/**
 * Creates object with key:value pairs from query string (e.g. location.search)
 * @param str
 * @returns {Object}
 * @private
 */
function _getQueryObj(str){
    var pairs = str.substr(1).split('&'),
        query = {};
    var ln = pairs.length;
    for(var i=0;i<ln;i++){
        var split = pairs[i].split('=');
        query[split[0]] = split[1];
    }
    return query;
}

/**
 * Attach scope object on defined path, If path is not defined, create global scope object
 * @param object
 * @param path
 * @private
 */
function _setScope(object, path){
    if(!path || path.length < 1){
        window['scope'] = object;
        return;
    }

    var parsed = settings.scope.split('.'),
        last = parsed.length-1,
        ref = window;

    for(var i=0; i<last;i++){
        if(!ref.hasOwnProperty(parsed[i])){
            ref[parsed[i]] = {};
        }
        ref = ref[parsed[i]];
    }
    ref[parsed[last]] = object;
}



/**
 * Create regular expression from route - from backbone framework
 * @param route
 * @returns {RegExp}
 * @private
 */
function _routeToRegExp(route) {
    route = route.replace(escapeRegExp, '\\$&')
        .replace(optionalParam, '(?:$1)?')
        .replace(namedParam, function (match, optional) {
            return optional ? match : '([^/?]+)';
        })
        .replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
}

export default Router;