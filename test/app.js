'use strict';

let colors = require('colors'),
    path = require('path'),
    express = require('express'),
    multer  = require('multer'),
    upload = multer({ dest: 'uploads/' }),
    bodyParser = require('body-parser')
    ;


let app = express();

app.set('view engine', 'jade');
// Normal static
app.use(express.static(path.join(__dirname, 'public')));
// Trinity js
app.use('/trinity', express.static(path.join(__dirname, '../src')));
// Node Modules
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));
// jspm packages
app.use('/jspm_packages', express.static(path.join(__dirname, '../jspm_packages')));
// config file
app.use('/jspm-config', express.static(path.join(__dirname, '../config.js')));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// ROUTES
app.get('/', (req, res)=>{
    res.render('index');
});

let fileUpload = upload.fields([{name: 'photos', maxCount: 2}]);
app.post('/process-file', fileUpload, (req, res)=>{
    console.log('###### HEADERS');
    console.log(req.headers);
    console.log('###### BODY');
    console.log(req.body);
    //console.log(req.body.photos[0]);
    console.log('###### FILES');
    console.log(req.files);
    res.json({'message': 'OK'});
});



//TODO : progress




let server = app.listen(3000, function () {
    let host = server.address().address,
        port = server.address().port;
    console.log('Example app listening at http://%s:%s', colors.red(host), colors.yellow(port));
});