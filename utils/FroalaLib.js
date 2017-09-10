'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

exports.startFroala = startFroala;
exports.editFroala = editFroala;
exports.harmonicaPlugin = harmonicaPlugin;

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _Events = require('trinity/utils/Events');

var _Events2 = _interopRequireDefault(_Events);

var _Gateway = require('trinity/Gateway');

var _Gateway2 = _interopRequireDefault(_Gateway);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var froalaState = 'none';
/**
 *
 * @param containers {HTMLElement[]|HTMLElement}
 * @param froalaBundlePath {String}
 * @param callback {Function}
 * @param packages
 */
/**
 * Created by rockuo on 24.8.16.
 */
function startFroala(containers, froalaBundlePath) {
    var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {};

    var url = froalaBundlePath;
    if (!url) {
        url = '/js/dist/froala.bundle.min.js';
        if (process.env.NODE_ENV !== 'production') {
            url = '/js/dist/froala.bundle.js';
        }
    }
    var doneFn = function doneFn() {
        (0, _each3.default)([].concat(containers), function (container) {
            var settings = JSON.parse(container.getAttribute('data-settings')),
                froala = (0, _jquery2.default)(container.children[0]).froalaEditor(settings);
            manageFroala(froala, settings);
        });
        callback();
        froalaState = 'done';
    };
    var testFroala = function testFroala() {
        switch (froalaState) {
            case 'none':
                {
                    froalaState = 'loading';
                    _jquery2.default.getScript(url).done(doneFn).fail(function () {
                        froalaState = 'none';
                    });
                }
                break;
            case 'loading':
                {
                    setTimeout(testFroala, 100);
                }
                break;
            default:
                {
                    doneFn();
                }
        }
    };
    testFroala();
}

function manageFroala(froala, settings) {
    (0, _each3.default)(settings, function (value, key) {
        if (key === 'imageDeleteURL') {
            froala.on('froalaEditor.image.removed', function (e, editor, $img) {
                _Gateway2.default.post(value, {
                    src: $img.attr('src')
                }, function (response) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(response);
                    }
                }, function (error) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log(error);
                    }
                });
            });
        }
    });
}

/**
 *
 * @param containers
 * @param how
 */
function editFroala(containers, how) {
    (0, _each3.default)([].concat(containers), function (container) {
        var $cont = (0, _jquery2.default)(container.children[1]);
        $cont.froalaEditor.apply($cont, how);
    });
}

/**
 * @param $harmonicaContainer {$}
 */
function harmonicaPlugin($harmonicaContainer) {
    var harmonicaForms = [];
    return (0, _map3.default)($harmonicaContainer.find('input[id*=\'harmonica-global-\']'), function (radio) {
        var $harmonicaForm = (0, _jquery2.default)(radio).next().find('form');
        harmonicaForms.push($harmonicaForm);
        if (!radio.checked) {
            $harmonicaForm.css('display', 'none');
        }
        return _Events2.default.listen(radio, 'click', function () {
            (0, _each3.default)(harmonicaForms, function (form) {
                return form.css('display', 'none');
            });
            $harmonicaForm.css('display', 'block');
        });
    });
}