/*
 * GM API Object Type
 *
 * Facilitates all of the needed functionality
 * for interfacing with the GM API and formats
 * the results to be compatible with SmartCar.
 *
 */

// Private
var request = require('superagent');
var API_URL = "http://gmapi.azurewebsites.net/";

function callAPI(service, id, params, callback, respondBack){
    var response = {};
    var body = { 'id': id, 'responseType': 'JSON' };

    //This will let you override the defaults as well as extend
    for (var i in params){
        body[i] = params[i];
    }

    //This is the actual HTTP call to the API
    request
        .post(API_URL + service)
        .send(body)
        .set('Accept', 'application/json')
        .end(function(reqErr, reqRes){
            if(reqErr || !reqRes.ok){
                console.log("Got an error!");
                response['statusCode'] = reqErr.statusCode;
                response['text'] = reqErr.response.text;
            }else{
                apiRes = reqRes.body;
                if( Number(apiRes.status) != 200){
                    //Return error status code. If NaN, return 500!
                    response['statusCode'] = Number(apiRes.status) || 500;
                    response['error'] = {'error': apiRes.reason};
                    respondBack(response);
                    return;
                }
                response['payload'] = apiRes;
                response['callback'] = respondBack;
                callback(response);
            }
        });
}

//Spec claims that GM API is badly structured and not always
//consistent. So we'll validate the type field returned.
function validateTypeValue(data, format){
    var nullType = String(data.type).toLowerCase() === 'null' ? true : false;
    if(nullType){
        return null;
    }

    switch(format){
        case 'string':
            return String(data.value) || null;
            break;
        case 'number':
            return Number(data.value) || null;
            break;
        case 'bool':
            if (String(data.type).toLowerCase() === 'boolean'){
                return String(data.value).toLowerCase() === 'true' ? true : false;
            }
            return false;
            break;
        default:
            return null;
    }
}

function returnVehicleInformation(apiRequest){
    var response = {};  //Our response object sent back to our API
    var vehicle = {};   //Our vehicle object that we'll construct with info

    if( apiRequest.hasOwnProperty('error') ){
        apiRequest['callback'](apiRequest);
        return;
    }
    var apiResponse = apiRequest.payload.data; //Holds the results from the API call if successfull

    //Now we build a response formatted for the Smartcar API...
    vehicle['vin'] = validateTypeValue(apiResponse.vin, 'string');
    vehicle['color'] = validateTypeValue(apiResponse.color, 'string');
    if (String(apiResponse.fourDoorSedan.value).toLowerCase() === 'true'){
        vehicle['doorCount'] = 4;
    }else if (String(apiResponse.twoDoorCoupe.value).toLowerCase() === 'true'){
        vehicle['doorCount'] = 2;
    }else if (String(apiResponse.threeDoorVan.value).toLowerCase() === 'true'){
        vehicle['doorCount'] = 3;
    }else{
        vehicle['doorCount'] = null;
    }
    vehicle['driveTrain'] = validateTypeValue(apiResponse.driveTrain, 'string');

    //Return vehicle information!
    response['json'] = vehicle;
    apiRequest['callback'](response);
}

function returnSecurityStatus(apiRequest){
    var response = {};  //Our response object sent back to our API
    var security = [];  //Our security array that we'll construct with info

    if( apiRequest.hasOwnProperty('error') ){
        apiRequest['callback'](apiRequest);
        return;
    }
    var apiResponse = apiRequest.payload.data.doors;  //Holds the results from the API call if successfull

    //Now we build a response formatted for the Smartcar API...
    if( String(apiResponse.type).toLowerCase() != 'array' ){
        console.log(apiResponse.type);
        response['error'] = {'error': 'Unable to understand API response!'};
        response['statusCode'] = 500; //Unexpected response would be server error not client (i.e. 400s)
        apiRequest['callback'](response);
        return;
    }

    //Go through returned door array and format the response for Smartcar API
    var doors = apiResponse.values;
    for (var i in doors){
        door = {}; //Door object holding info for each single door..
        door['location'] = validateTypeValue(doors[i].location, 'string');
        door['locked']   = validateTypeValue(doors[i].locked, 'bool');
        security.push(door);
    }

    response['send'] = security;
    apiRequest['callback'](response);
}

function returnTankStatus(apiRequest){
    returnEnergyStatus('tank', apiRequest);
}

function returnBattStatus(apiRequest){
    returnEnergyStatus('battery', apiRequest);
}

function returnEnergyStatus(source, apiRequest){
    var response = {};  //Our response object sent back to our API
    var energy = {};    //Our energy object that we'll construct with info
    var invalid;        //Check to see what energy information was made available

    if( apiRequest.hasOwnProperty('error') ){
        apiRequest['callback'](apiRequest);
        return
    }
    var apiResponse = apiRequest.payload.data;  //Holds the results from the API call if successfull

    if(source == 'tank'){
        invalid = String(apiResponse.tankLevel.type).toLowerCase() === 'null' ? true : false;
    }else if(source == 'battery'){
        invalid = String(apiResponse.batteryLevel.type).toLowerCase() === 'null' ? true : false;
    }else{
        response['error'] = {'error': 'Invalid Energy Source'};
        response['statusCode'] = 400;
        apiRequest['callback'](response);
        return;
    }

    //Check if null was retunred for energy level.
    if(invalid){
        response['error'] = {'error': 'Not Supported'};
        response['statusCode'] = 501;
        apiRequest['callback'](response);
        return;
    }else{
        //We've already verified the type for the requested source. The other is a freebie...
        energy['batteryLevel']  = {'percent': Number(apiResponse.batteryLevel.value)};
        energy['tankLevel']     = {'percent': Number(apiResponse.tankLevel.value)};
    }

    response['json'] = energy;
    apiRequest['callback'](response);
}

function returnEngineAction(apiRequest){
    var response = {};  //Our response object sent back to our API

    if( apiRequest.hasOwnProperty('error') ){
        apiRequest['callback'](apiRequest);
        return;
    }
    var apiResponse = apiRequest.payload.actionResult;  //Holds the results from the API call if successfull

    switch(apiResponse.status){
        case 'EXECUTED':
            response['json'] = {"status": "success"};
            response['statusCode'] = 200;
            break;
        case 'FAILED':
            response['json'] = {"status": "error"};
            response['statusCode'] = 503; //The service was unavailable for action
            break;
        default:
            response['statusCode'] = 500; //Unrecognized response
            response['error'] = {"error": "Unexpected Response"};
    }
    apiRequest['callback'](response);
}


 // Public
module.exports = GMAPI;
function GMAPI(id) {
    this.id = id;
}


GMAPI.prototype.getVehicleInfo = function(callback){
    var serviceTag = 'getVehicleInfoService'; //API service identifier
    var params = {};    //Additional *optional* parameters for callAPI

    //Make the GM API call for the requested data
    callAPI(serviceTag, this.id, params, returnVehicleInformation, callback);
}


GMAPI.prototype.getSecurityStatus = function(callback){
    var serviceTag = 'getSecurityStatusService'; //API service identifier
    var params = {};    //Additional *optional* parameters for callAPI

    //Make the GM API call for the requested data
    callAPI(serviceTag, this.id, params, returnSecurityStatus, callback);
}


GMAPI.prototype.getEnergy = function(source, callback){
    var serviceTag = 'getEnergyService'; //API service identifier
    var params = {};    //Additional *optional* parameters for callAPI

    //Make the GM API call for the requested data
    if(source == 'tank'){
        returnStatus = returnTankStatus;
    }else{
        returnStatus = returnBattStatus;
    }
    callAPI(serviceTag, this.id, params, returnStatus, callback);
}


GMAPI.prototype.actionEngine = function(params, callback){
    var serviceTag = 'actionEngineService'; //API service identifier

    //Make the GM API call for the requested data
    var apiRequest = callAPI(serviceTag, this.id, params, returnEngineAction, callback);
}

