'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _find2 = require('lodash/find');

var _find3 = _interopRequireDefault(_find2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Private help RegExpressions
 * @type {RegExp}
 */
var optionalParam = /\((.*?)\)/g,
    namedParam = /(\(\?)?:\w+/g,
    splatParam = /\*\w+/g,
    escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g,
    paramsRegExp = /:\w+/g;

var Router = function () {
    /**
     * Takes routes and create regular expression for each
     * @param {object} routes
     * @constructor
     */
    function Router(routes) {
        _classCallCheck(this, Router);

        this.rawRoutes = routes;
        this.routes = Router.compileRoutes(routes);

        // initialize
        this._initialize();
    }

    /**
     * Initialize router
     * prepare and parse routes
     */


    _createClass(Router, [{
        key: '_initialize',
        value: function _initialize() {
            (0, _each3.default)(this.routes, function (route) {
                route.regx = Router.routeToRegExp(route.path);
            });

            /** Adds prefix to regular expressions **/
            if (process.env.NODE_ENV !== 'production') {
                this.routes = this.routes.map(function (route) {
                    var path = route.path;
                    if (path.indexOf('/') > 1) {
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

    }, {
        key: 'findController',
        value: function findController() {
            var route = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.location.pathname;

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
                controllerInfo.request = {
                    path: controllerInfo.path,
                    query: search.length > 0 ? _getQueryObj(search) : null,
                    params: data.length > 2 ? _getParams(controllerInfo.path, data) : null
                };
                //And return all inside one package
                return controllerInfo;
            }
            return null;
        }

        /**
         * Experimental function that search for specific route and dynamically creates regualr expressions
         * @param {Object} routeObject
         * @param {string} pathName
         * @ignore
         */

    }, {
        key: 'findRoute',
        value: function findRoute(routeObject, pathName) {
            var resultRoute = null;

            function inner(routes) {
                var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

                (0, _each3.default)(routes, function (route, pathFragment) {
                    var pathTemplate = '' + prefix + pathFragment;
                    if ((0, _isString3.default)(route)) {
                        if (Router.routeToRegExp(pathTemplate).test(pathName)) {
                            resultRoute = {
                                path: pathTemplate,
                                action: route
                            };
                            return false;
                        }
                    } else {
                        if (Router.routeToRegExpPartial(pathTemplate).test(pathName)) {
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

    }], [{
        key: 'compileRoutes',
        value: function compileRoutes(routeObject) {
            var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

            var routesArray = [];
            var inner = function inner(routes, prefix) {
                (0, _each3.default)(routes, function (route, key) {
                    if ((0, _isString3.default)(route)) {
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

    }, {
        key: 'routeToRegExp',
        value: function routeToRegExp(route) {
            return new RegExp(Router._baseRouteToRegExp(route) + '$');
        }

        /**
         * Create regualr expression for route but does not include terminate char
         * @param {string} route
         * @returns {RegExp}
         * @ignore
         */

    }, {
        key: 'routeToRegExpPartial',
        value: function routeToRegExpPartial(route) {
            return new RegExp(Router._baseRouteToRegExp(route));
        }

        /**
         * Shared part of reacting RegExp route
         * @param {string} route
         * @returns {string}
         * @private
         */

    }, {
        key: '_baseRouteToRegExp',
        value: function _baseRouteToRegExp(route) {
            return '^' + route.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, function (match, optional) {
                return optional ? match : '([^/?]+)';
            }).replace(splatParam, '([^?]*?)') + '(?:\\?([\\s\\S]*))?';
        }
    }]);

    return Router;
}();

/**
 * Regular expression template to modify regular expressions of routes
 * Used for development only
 * @type {string}
 */


var prefixRegExp = '(?:\/\w+)*';

/**
 * Adds prefix to regular expression that any path can have any route prefix
 * Note: used only for development purposes. For example symfony have different entry points for developemnt, test and production.
 * @param regx
 * @returns {RegExp}
 * @private
 * @ignore
 */
function __modifyRouteRegx(regx) {
    var source = regx.source;
    return new RegExp(prefixRegExp + source.substring(source.indexOf('^') !== 0 ? 0 : 1));
}

/**
 * Returns object with params like key:value
 * @param {string} path
 * @param {Array} regxResult
 * @returns {Object}
 * @private
 */
function _getParams(path, regxResult) {
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
 * @param {string} str
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

exports.default = Router;