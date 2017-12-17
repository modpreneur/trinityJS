#!/usr/bin/env node
'use strict';

const path = require('path');
const fs = require('fs');

const COMMON_JS = 'common-js',
    REQUIRE_JS = 'require-js';

let args = process.argv.splice(2);
if(args.length === 0){
    console.error('Missing input arguments. Please provide path to controllers directory');
    process.exit(-1);
}

let controllersDir = args[0],
    output = args[1] || './controllers.js',
    outputType = args[2] || COMMON_JS;

try {
    fs.accessSync(controllersDir);
} catch(e) {
    console.error('\"' + controllersDir + '\" directory does not exists!');
    process.exit(-1);
}

console.log('Building Controllers...');

let controllers = loadDir(controllersDir, output);

fs.open(output, 'w+', function(err, fd){
    if(err){
        console.error('ERROR', err);
        process.exit(-1);
    }

    let outputString = '';

    switch(outputType) {
        case REQUIRE_JS: {
            outputString = requireJsOutput(controllers);
            break;
        }
        case COMMON_JS:
        default: {
            outputString = commonJsOutput(controllers);
            break;
        }
    }


    let offset = 0;

    console.log('output:\n', outputString);
    try {
        offset+= fs.writeSync(fd, outputString, offset, outputString.length);
    } catch(e){
        console.error('Write to file failed while writing imports, error:', e);
        process.exit(-1);
    }

    try {
        fs.closeSync(fd);
        console.log(controllersDir, '->', output);
        console.log('done');
    } catch(e){
        console.error('ERROR while closing file');
    }
});

/**
 * Loads dir and prepare controllers object
 * @param dirName {string}
 * @param outputFile {string}
 * @returns {*}
 */
function loadDir(dirName, outputFile) {
    return fs.readdirSync(dirName).filter((file)=>{
        // exclude non `.js` files. "~" means "indexOf('.js') !== -1";
        return ~(path.extname(file).toLowerCase().indexOf('.js'));
    }).map((file)=>{
        return {
            name: file.substring(0, file.indexOf('.js')),
            path: './' + path.relative(path.dirname(outputFile), path.join(dirName, file))
        };
    });
}

/**
 * Create common js style output
 * @param controllers {Array}
 */
function commonJsOutput(controllers = []){
    let controllerRequires = controllers.map((c) => {
        return `import ${c.name} from '${c.path}';`;
    });
    return (
        '\'use strict\';\n'
        + controllerRequires.join('\n')
        + '\n'
        + `export default {\n${controllers.map((c) => `${c.name}`).join(',\n')}\n};`
    ).trim();
}

/**
 * Create require js style output
 * @param controllers {Array}
 */
function requireJsOutput(controllers = []){
    let controllerRequires = controllers.map((c) => {
        return `${c.name}:require('${c.path}').default`;
    });

    return (
        '\'use strict\';\n'
        + 'module.exports = {\n'
        + '\t'+controllerRequires.join(',\n\t')+'\n'
        + '};'
    ).trim();
}

