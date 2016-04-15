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
app.set('views', path.join(__dirname, 'app/views'));

// Normal static
app.use(express.static(path.join(__dirname, 'app/public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

//app.use(bodyParser.raw());

// ROUTES
app.get('/', (req, res)=>{
    res.render('webpack/index');
});

app.get('/static', (req, res)=>{
    res.render('webpack/index', {useStatic: true});
});

app.get('/form', (req, res)=>{
    res.render('webpack/form');
});

app.post('/form', upload.array(), (req, res)=>{
    console.log(req.headers);
    //console.log(req.headers);
    console.log(req.body);
    console.log(req.files);
    return res.status(200).json({'message': 'OK'});
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