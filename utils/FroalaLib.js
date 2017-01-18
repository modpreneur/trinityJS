'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.startFroala = startFroala;
exports.editFroala = editFroala;
exports.harmonicaPlugin = harmonicaPlugin;

var _lodash = require('./lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _Events = require('trinity/utils/Events');

var _Events2 = _interopRequireDefault(_Events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var froalaState = 'none';
/**
 *
 * @param containers {HTMLElement[]|HTMLElement}
 * @param froalaBundlePath {String}
 * @param callback {Function}
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
        _lodash2.default.each([].concat(containers), function (container) {
            (0, _jquery2.default)(container.children[0]).froalaEditor(JSON.parse(container.getAttribute('data-settings')));
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

/**
 *
 * @param containers
 * @param how
 */
function editFroala(containers, how) {
    _lodash2.default.each([].concat(containers), function (container) {
        var $cont = (0, _jquery2.default)(container.children[1]);
        $cont.froalaEditor.apply($cont, how);
    });
}

/**
 * @param $harmonicaContainer {object}
 */
function harmonicaPlugin($harmonicaContainer) {
    var harmonicaForms = [];
    return _lodash2.default.map($harmonicaContainer.find('input[id*=\'harmonica-global-\']'), function (radio) {
        var $harmonicaForm = (0, _jquery2.default)(radio).next().find('form');
        harmonicaForms.push($harmonicaForm);
        if (!radio.checked) {
            $harmonicaForm.css('display', 'none');
        }
        return _Events2.default.listen(radio, 'click', function () {
            _lodash2.default.each(harmonicaForms, function (form) {
                return form.css('display', 'none');
            });
            $harmonicaForm.css('display', 'block');
        });
    });
}