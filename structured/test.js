var assert  = require('assert');
var request = require('superagent');



function testGetAPI(service, id, callback){
    request
        .get("192.168.1.12:8081/vehicles/" + id + "/" + service)
        .end(function(err, res){
            callback(res);
        });
}

function testPostAPI(service, id, callback){
    if ( id % 2 == 0){
        command = {'action': 'START'};
    }else{
        command = {'action': 'STOP'};
    }

    request
        .post("192.168.1.12:8081/vehicles/" + id + "/" + service)
        .send(command)
        .set('Accept', 'application/json')
        .end(function(err, res){
            callback(res);
        });
}

function testVehicleInfo(){
    for(var i = 0; i < 10; i++){
        var id = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
        testGetAPI('', id, function(res){
            assert(res.status === 404);
            if(!res.hasOwnProperty('error')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
        });
        console.log("Completed vehicleInfo Test: #" + i);
    }
    for(i = 1234; i < 1236; i++){
        id = i;
        testGetAPI('', id, function(res){
        assert(res.status === 200);
            if(!res.hasOwnProperty('body')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
            if(!res.body.hasOwnProperty('vin')){
                assert.fail(1, 2, 'Test Failed for VIN check', '###');
            }
            if(!res.body.hasOwnProperty('color')){
                assert.fail(1, 2, 'Test Failed for Color check', '###');
            }
            if(!res.body.hasOwnProperty('driveTrain')){
                assert.fail(1, 2, 'Test Failed for driveTrain', '###');
            }
            if(!res.body.hasOwnProperty('doorCount')){
                assert.fail(1, 2, 'Test Failed for doorCount', '###');
            }
        });
        console.log("Completed vehicleInfo Test: #" + (i - 1224));
    }

}

function testSecurityStatus(){
    for(var i = 0; i < 10; i++){
        var id = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
        testGetAPI('doors', id, function(res){
            assert(res.status === 404);
            if(!res.hasOwnProperty('error')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
        });
        console.log("Completed securityStatus Test: #" + i);
    }
    for(i = 1234; i < 1236; i++){
        id = i;
        testGetAPI('doors', id, function(res){
            assert(res.status === 200);
            if(!res.hasOwnProperty('body')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
            if(!res.body[0].hasOwnProperty('location')){
                assert.fail(1, 2, 'Test Failed for location check', '###');
            }
            if(!res.body[0].hasOwnProperty('locked')){
                assert.fail(1, 2, 'Test Failed for lock check', '###');
            }
        });
        console.log("Completed securityStatus Test: #" + (i - 1224));
    }

}

function testFuelInfo(){
    for(var i = 0; i < 10; i++){
        var id = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
        testGetAPI('fuel', id, function(res){
            assert(res.status === 404);
            if(!res.hasOwnProperty('error')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
        });
        console.log("Completed fuelInfo Test: #" + i);
    }
    for(i = 1234; i < 1236; i++){
        id = i;
        testGetAPI('fuel', id, function(res){
            if(!res.hasOwnProperty('body')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
            if(!res.body.hasOwnProperty('percent') && !res.body.hasOwnProperty('error')){
                assert.fail(1, 2, 'Test Failed for  fuel', '###');
            }
        });
        console.log("Completed fuelInfo Test: #" + (i - 1224));
    }

}

function testBatteryInfo(){
    for(var i = 0; i < 10; i++){
        var id = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
        testGetAPI('battery', id, function(res){
            assert(res.status === 404);
            if(!res.hasOwnProperty('error')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
        });
        console.log("Completed batteryInfo Test: #" + i);
    }
    for(i = 1234; i < 1236; i++){
        id = i;
        testGetAPI('battery', id, function(res){
            if(!res.hasOwnProperty('body')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
            if(!res.body.hasOwnProperty('percent') && !res.body.hasOwnProperty('error')){
                assert.fail(1, 2, 'Test Failed for  battery', '###');
            }
        });
        console.log("Completed batteryInfo Test: #" + (i - 1224));
    }

}

function testEngine(){
    for(var i = 0; i < 10; i++){
        var id = Math.floor(Math.random() * (1000 - 10 + 1)) + 10;
        testPostAPI('engine', id, function(res){
            assert(res.status === 404);
            if(!res.hasOwnProperty('error')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
        });
        console.log("Completed engine Test: #" + i);
    }
    for(i = 1234; i < 1236; i++){
        id = i;
        testPostAPI('engine', id, function(res){
            if(!res.hasOwnProperty('body')){
                assert.fail(1, 2, 'Test Failed', '###');
            }
            if(!res.body.hasOwnProperty('status') && !res.body.hasOwnProperty('error')){
                assert.fail(1, 2, 'Test Failed for  engine', '###');
            }
        });
        console.log("Completed engine Test: #" + (i - 1224));
    }

}



console.log("Starting Tests....");
testVehicleInfo();
testSecurityStatus();
testFuelInfo();
testBatteryInfo();
testEngine();
console.log("Finished Running Tests...");

