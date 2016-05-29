/*
 * GM API Object Type
 *
 * Facilitates all of the needed functionality
 * for interfacing with the GM API and formats
 * the results to be compatible with SmartCar.
 *
 */

// Private
var API_URL = "http://gmapi.azurewebsites.net/";

function callAPI(service, id, params){
    var response;
    var body = { 'id': id, 'responseType': 'JSON' };

    //This will let you override the defaults as well as extend
    for (var i in params){
        body[i] = params[i];
    }

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
                    return response;
                }
                response['payload'] = apiRes;
                return response;
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




 // Public
module.exports = GMAPI;

function GMAPI(id) {
    this.id = id;
}


GMAPI.prototype.getVehicleInfo = function(){
    var serviceTag = 'getVehicleInfoService'; //API service identifier
    var params = {};    //Additional *optional* parameters for callAPI
    var response = {};  //Our response object sent back to our API
    var vehicle = {};   //Our vehicle object that we'll construct with info

    //Make the GM API call for the requested data
    var apiRequest = callAPI(serviceTag, this.id, params);
    if( apiRequest.hasOwnProperty('error') ){
        return apiRequest;
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
    return response;
}


GMAPI.prototype.getSecurityStatus = function(){
    var serviceTag = 'getSecurityStatusService'; //API service identifier
    var params = {};    //Additional *optional* parameters for callAPI
    var response = {};  //Our response object sent back to our API
    var security = [];  //Our security array that we'll construct with info

    //Make the GM API call for the requested data
    var apiRequest = callAPI(serviceTag, this.id, params);
    if( apiRequest.hasOwnProperty('error') ){
        return apiRequest;
    }
    var apiResponse = apiRequest.payload.data.doors;  //Holds the results from the API call if successfull

    //Now we build a response formatted for the Smartcar API...
    if( String(apiResponse.type).toLowerCase != 'array' ){
        response['error'] = {'error': 'Unable to understand API response!'};
        response['statusCode'] = 500; //Unexpected response would be server error not client (i.e. 400s)
        return response;
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
    return response;
}



























