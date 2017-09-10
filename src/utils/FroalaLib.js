/**
 * Created by rockuo on 24.8.16.
 */
import _ from 'lodash';
import $ from 'jquery';
import Events from 'trinity/utils/Events';
import Gateway from 'trinity/Gateway';

let froalaState = 'none';
/**
 *
 * @param containers {HTMLElement[]|HTMLElement}
 * @param froalaBundlePath {String}
 * @param callback {Function}
 * @param packages
 */
export function startFroala(containers, froalaBundlePath, callback = () => {
}) {
    let url = froalaBundlePath;
    if (!url) {
        url = '/js/dist/froala.bundle.min.js';
        if (process.env.NODE_ENV !== 'production') {
            url = '/js/dist/froala.bundle.js';
        }
    }
    let doneFn = () => {
        _.each([].concat(containers), container => {
            let settings = JSON.parse(container.getAttribute('data-settings')),
                froala = $(container.children[0]).froalaEditor(settings);
            manageFroala(froala, settings);
        });
        callback();
        froalaState = 'done';
    };
    let testFroala = () => {
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
                setTimeout(testFroala, 100);
            }
                break;
            default: {
                doneFn();
            }
        }
    };
    testFroala();
}

function manageFroala(froala, settings) {
    _.each(settings, (value, key) => {
        if (key === 'imageDeleteURL') {
            froala.on('froalaEditor.image.removed', function(e, editor, $img) {
                Gateway.post(
                    value,
                    {
                        src: $img.attr('src')
                    },
                    response => {
                        if (process.env.NODE_ENV !== 'production'){
                            console.log(response);
                        }
                    },
                    error => {
                        if (process.env.NODE_ENV !== 'production'){
                            console.log(error);
                        }
                    }
                );
            });
        }
    });
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