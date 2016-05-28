//SmartCar API Server


var express     = require('express');
var bodyParser  = require('body-parser');
var request     = require('superagent');
var app         = express();
var router      = express.Router();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use('/', router);


function like(){
    return "hello";
}

function securityStatus(data){
    security = [];
    if( String(data.type).toLowerCase() != "array"){
        return null;
    }

    doors = data.values;
    for (var i in doors){
        door = {};
        door['location'] = doors[i].location.value;
        door['locked']   = String(doors[i].locked.value).toLowerCase() === 'true' ? true : false;
        security.push(door);
    }
    return security;
}

function energyStatus(data){
    var energy = {};
    var invalid = String(data.type).toLowerCase() === 'null' ? true : false;
    if(invalid){
        energy['status'] = 501;
        energy['payload'] = {'error': 'Not Supported'};
        return energy;
    }else{
        energy['status'] = 200;
        energy['payload'] = {'percent': Number(data.value)};
        return energy;
    }
}


router.use(function(req, res, next){
    console.log("Something is happening!");
    next();
});

router.get('/', function(req, res){
    res.json({ message: "Hello World"});
});


router.route('/vehicles/:id')

    .get(function(req, res){
        //var vehicle;
        vehicle = {}
        request
            .post('http://gmapi.azurewebsites.net/getVehicleInfoService')
            .send({ 'id': req.params.id, 'responseType': 'JSON' })
            .set('Accept', 'application/json')
            .end(function(reqErr, reqRes){
                if(reqErr || !reqRes.ok){
                    console.log("Got and error!");
                    res.send(reqErr);
                }else{
                    apiRes = reqRes.body;
                    if( Number(apiRes.status) != 200){
                        res.statusCode = Number(apiRes.status);
                        return res.json({error: apiRes.reason});
                    }
                    vehicle['vin'] = apiRes.data.vin.value;
                    vehicle['color'] = apiRes.data.color.value;
                    if (String(apiRes.data.fourDoorSedan.value).toLowerCase() === 'true'){
                        vehicle['doorCount'] = 4;
                    }else if (String(apiRes.data.twoDoorCoupe.value).toLowerCase() === 'true'){
                        vehicle['doorCount'] = 2;
                    }
                    vehicle['driveTrain'] = apiRes.data.driveTrain.value;
                    res.json(vehicle);
                }
            });
    });

router.get('/vehicles/:id/doors', function(req, res){
    request
        .post('http://gmapi.azurewebsites.net/getSecurityStatusService')
        //.post('http://192.168.1.12/getSecurityStatusService')
        .send({ 'id': req.params.id, 'responseType': 'JSON' })
        .set('Accept', 'application/json')
        .end(function(reqErr, reqRes){
            if(reqErr || !reqRes.ok){
                console.log("Got and error!");
                res.statusCode = reqErr.status;
                res.send(reqErr.response.text);
            }else{
                apiRes = reqRes.body;
                if( Number(apiRes.status) != 200){
                    res.statusCode = Number(apiRes.status);
                    return res.json({error: apiRes.reason});
                }
                res.send( securityStatus(apiRes.data.doors) );
            }
        });
});

router.get('/vehicles/:id/fuel', function(req, res){
    request
        .post('http://gmapi.azurewebsites.net/getEnergyService')
        .send({ 'id': req.params.id, 'responseType': 'JSON' })
        .set('Accept', 'application/json')
        .end(function(reqErr, reqRes){
            if(reqErr || !reqRes.ok){
                console.log("Got and error!");
                res.statusCode = reqErr.status;
                res.send(reqErr.response.text);
            }else{
                apiRes = reqRes.body;
                if( Number(apiRes.status) != 200){
                    res.statusCode = Number(apiRes.status);
                    return res.json({error: apiRes.reason});
                }
                fuel = energyStatus(apiRes.data.tankLevel);
                res.statusCode = fuel.status;
                res.json( fuel.payload );
            }
        });
});

router.get('/vehicles/:id/battery', function(req, res){
    request
        .post('http://gmapi.azurewebsites.net/getEnergyService')
        .send({ 'id': req.params.id, 'responseType': 'JSON' })
        .set('Accept', 'application/json')
        .end(function(reqErr, reqRes){
            if(reqErr || !reqRes.ok){
                console.log("Got and error!");
                res.statusCode = reqErr.status;
                res.send(reqErr.response.text);
            }else{
                apiRes = reqRes.body;
                if( Number(apiRes.status) != 200){
                    res.statusCode = Number(apiRes.status);
                    return res.json({error: apiRes.reason});
                }
                battery = energyStatus(apiRes.data.batteryLevel);
                res.statusCode = battery.status;
                res.json( battery.payload );
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

    request
        .post('http://gmapi.azurewebsites.net/actionEngineService')
        .send({ 'id': req.params.id, 'responseType': 'JSON', 'command': command })
        .set('Accept', 'application/json')
        .end(function(reqErr, reqRes){
            if(reqErr || !reqRes.ok){
                console.log("Got and error!");
                res.statusCode = reqErr.status;
                res.send(reqErr.response.text);
            }else{
                apiRes = reqRes.body;
                if( Number(apiRes.status) != 200){
                    res.statusCode = Number(apiRes.status);
                    return res.json({error: apiRes.reason});
                }
                console.log(apiRes);
                switch(apiRes.actionResult.status){
                    case "EXECUTED":
                        res.json({"status": "success"});
                        break;
                    case "FAILED":
                        res.statusCode = 503;
                        res.json({"status": "error"});
                        break;
                    default:
                        res.statusCode = 500; //Unrecognized response
                        res.json({"error": "Unexpected Response"});
                        console.log(apiRes.actionResult.status);
                }
            }
        });
});


var port = process.env.PORT || 8081;
app.listen(port);
console.log("SmartCar API listening on port: " + port);
