//SmartCar API Server


var express     = require('express');
var bodyParser  = require('body-parser');
var request     = require('superagent');
var GMAPI       = require('./GMAPI');
var app         = express();
var router      = express.Router();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use('/', router);

router.use(function(req, res, next){
    console.log("Request has been received!");
    next();
});

router.get('/', function(req, res){
    res.json({ message: "Hello World"});
});

router.get('/vehicles/:id', function(req, res){
    //Create the new API object and call needed method
    var gmapi = new GMAPI(req.params.id);
    gmapi.getVehicleInfo(function(response){
        if( response.hasOwnProperty('error') ){
            res.statusCode = response.statusCode;
            res.json(response.error);
        }else{
            //If no errors, 200 will usually only be implied. Not explicitly set
            res.statusCode = response.statusCode || 200;
            res.json(response.json);
        }

    });
});


router.get('/vehicles/:id/doors', function(req, res){
    //Create the new API object and call needed method
    var gmapi = new GMAPI(req.params.id);
    gmapi.getSecurityStatus(function(response){
        if( response.hasOwnProperty('error') ){
            res.statusCode = response.statusCode;
            res.json(response.error);
        }else{
            //If no errors, 200 will usually only be implied. Not explicitly set
            res.statusCode = response.statusCode || 200;
            res.send(response.send);
        }
    });
});

router.get('/vehicles/:id/fuel', function(req, res){
    //Create the new API object and call needed method
    var gmapi = new GMAPI(req.params.id);
    gmapi.getEnergy('tank', function(response){
        if( response.hasOwnProperty('error') ){
            res.statusCode = response.statusCode;
            res.json(response.error);
        }else{
            //If no errors, 200 will usually only be implied. Not explicitly set
            res.statusCode = response.statusCode || 200;
            res.json(response.json.tankLevel);
        }
    });
});

router.get('/vehicles/:id/battery', function(req, res){
    //Create the new API object and call needed method
    var gmapi = new GMAPI(req.params.id);
    gmapi.getEnergy('battery', function(response){
        if( response.hasOwnProperty('error') ){
            res.statusCode = response.statusCode;
            res.json(response.error);
        }else{
            //If no errors, 200 will usually only be implied. Not explicitly set
            res.statusCode = response.statusCode || 200;
            res.json(response.json.batteryLevel);
        }
    });
});

router.post('/vehicles/:id/engine', function(req, res){
    var action = req.body.action;
    var command;

    if (String(action).toLowerCase() == 'start'){
        command = "START_VEHICLE";
    }else if (String(action).toLowerCase() == 'stop'){
        command = "STOP_VEHICLE";
    }else{
        res.statusCode = 400; //Bad Request
        return res.json({error: "Invalid Action Parameter"});
    }
    //Create the new API object and call needed method
    var gmapi = new GMAPI(req.params.id);
    gmapi.actionEngine({'command': command}, function(response){
        if( response.hasOwnProperty('error') ){
            res.statusCode = response.statusCode;
            res.json(response.error);
        }else{
            //If no errors, 200 will usually only be implied. Not explicitly set
            res.statusCode = response.statusCode || 200;
            res.json(response.json);
        }
    });
});

var port = process.env.PORT || 8081;
app.listen(port);
console.log("SmartCar API listening on port: " + port);
