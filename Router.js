/**
 * Created by fisa on 7/23/15.
 */
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _find2 = require('lodash/find');

var _find3 = _interopRequireDefault(_find2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Private help RegExpressions
 * @type {RegExp}
 */
var optionalParam = /\((.*?)\)/g,
    namedParam = /(\(\?)?:\w+/g,
    splatParam = /\*\w+/g,
    escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g,
    paramsRegExp = /:\w+/g;

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
    if (process.env.NODE_ENV !== 'production') {
        this.routes = this.routes.map(function (route) {
            var path = route['path'];
            if (path.indexOf('/') > 1) {
                console.warn('Route should start with "/" char. Or should be index page "(/)". It can cause unexpected behaviour!', route);
            }
            route.regx = __modifyRouteRegx(route.regx);
            return route;
        }, this);
    }
}

/**
 * Regular expression template to modify regular expressions of routes
 * @type {string}
 */
var prefixRegExp = '(?:\/\w+)*';

/**
 * Adds prefix to regular expression that any path can have any route prefix
 * Note: used only for debug purposes
 * @param regx
 * @returns {RegExp}
 * @private
 */
function __modifyRouteRegx(regx) {
    var source = regx.source;
    var start = source.indexOf('^') !== 0 ? 0 : 1;
    return new RegExp(prefixRegExp + source.substring(start));
}

/**
 * Finds controller for route parameter
 * @param route {string}
 * @returns {Object| null}
 */
Router.prototype.findController = function findController(route) {
    route = route || window.location.pathname;
    var data = null,
        cache = void 0,
        controllerInfo = void 0;

    controllerInfo = (0, _find3.default)(this.routes, function (el) {
        cache = el.regx.exec(route);
        if (cache) {
            data = cache;
            return true;
        }
        return false;
    }) || null;

    // If we found any controller -> create request and return it
    if (controllerInfo) {
        /** Create request Info object */
        var search = window.location.search;
        controllerInfo.request = new this.Request(controllerInfo.path, data.length > 2 ? __getParams(controllerInfo.path, data) : null, search.length > 0 ? _getQueryObj(search) : null);
        //And return all inside one package
        return controllerInfo;
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
Router.prototype.Request = function Request(path, params, query) {
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
function __getParams(path, regxResult) {
    var keys = path.match(paramsRegExp),
        values = regxResult.slice(1, regxResult.length - 1),
        params = {};

    // create pairs
    (0, _each3.default)(values, function (val, i) {
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
function _getQueryObj(str) {
    var pairs = str.substr(1).split('&'),
        query = {};

    (0, _each3.default)(pairs, function (p) {
        var ind = p.indexOf('=');
        query[p.substr(0, ind)] = p.substr(ind + 1);
    });
    return query;
}

/**
 * Create regular expression from route - from backbone framework
 * // TODO: check if there is new version
 * @param route
 * @returns {RegExp}
 * @private
 */
function _routeToRegExp(route) {
    route = route.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, function (match, optional) {
        return optional ? match : '([^/?]+)';
    }).replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
}

exports.default = Router;