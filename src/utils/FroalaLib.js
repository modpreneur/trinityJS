/**
 * Created by rockuo on 24.8.16.
 */
import _ from 'lodash';
import $ from 'jquery';
import Events from 'trinity/utils/Events';

let froalaState = 'none';
/**
 *
 * @param containers {HTMLElement[]|HTMLElement}
 * @param froalaBundlePath {String}
 * @param callback {Function}
 */
export function startFroala(containers, froalaBundlePath, callback = () => {}) {
    let url = froalaBundlePath;
    if(!url) {
        url = '/js/dist/froala.bundle.min.js';
        if (process.env.NODE_ENV !== 'production') {
            url = '/js/dist/froala.bundle.js';
        }
    }
    let doneFn = () => {
        _.each([].concat(containers), container=> {
            $(container.children[0]).froalaEditor(JSON.parse(container.getAttribute('data-settings')));
        });
        callback();
        froalaState = 'done';
    };
    let testFroala =  () => {
        switch (froalaState) {
            case 'none' : {
                froalaState = 'loading';
                $.getScript(url)
                    .done(doneFn)
                    .fail(() => {
                        froalaState = 'none';
                    });
            }
                break;
            case 'loading': {
                setTimeout(testFroala,100);
            }
                break;
            default: {
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
export function editFroala(containers, how) {
    _.each([].concat(containers), container => {
        let $cont = $(container.children[1]);
        $cont.froalaEditor.apply($cont, how);
    });
}

/**
 * @param $harmonicaContainer {$}
 */
export function harmonicaPlugin($harmonicaContainer) {
    let harmonicaForms = [];
    return _.map($harmonicaContainer.find('input[id*=\'harmonica-global-\']'), (radio) => {
        let $harmonicaForm = $(radio).next().find('form');
        harmonicaForms.push($harmonicaForm);
        if (!radio.checked) {
            $harmonicaForm.css('display', 'none');
        }
        return Events.listen(radio, 'click', () => {
            _.each(harmonicaForms, form => form.css('display', 'none'));
            $harmonicaForm.css('display', 'block');
        });
    });
}