var request = require('request');
var alexa = require('alexa-app');
var AWS = require('aws-sdk');
var async = require('async');
var app = new alexa.app('nest');

app.launch(function(request, response) {
    console.log('launch requested.');

    var responseText = "Ask for current status.";

    response
        .say(responseText)
        .card("Welcome", responseText)
        .shouldEndSession(false)
        .send();
});

app.sessionEnded(function(request, response) {
   // cleanup if necessary
});

app.error = function(error) {
    console.log(error);
};

// Alexa, ask nest the current status
app.intent('Current',
    {
        "utterances":
            [
                "current",
                "for the current temperature",
                "what is the current temperature",
                "how hot",
                "how cold"
            ]
    },
    function(request, response) {
        console.log('current temperature requested.');
        async.waterfall([
            async.apply(getNestInfo, request.userId),
            getThermostatsInfo,
            buildResult
        ], function (error, responseText) {
            if (error) {
                console.log(error);
            } else {
                response
                    .say(responseText)
                    .card("Current", responseText)
                    .shouldEndSession(true)
                    .send();
            }
        });

        // Asynchronous must return false.
        return false;
    }
);

app.intent('SetThermostat',
    {
        "slots":        { "number":"NUMBER" },
        "utterances":
            [
                "set temperature {1-100|number}",
                "set temperature to {1-100|number}"
            ]
    },
    function (request, response) {
        console.log('set temperatore requested.');
        var requestedTemperature = parseInt(request.data.request.intent.slots.number.value);
        async.waterfall([
            async.apply(getNestInfo, request.userId),
            async.apply(setThermostatTemperature, requestedTemperature)
        ], function (error, statusCode) {
            if (error) {
                console.log(error);
            } else {
                var responseText = "";
                if (statusCode === 200) {
                    responseText = "Temperature has been set to " + requestedTemperature + " degrees.";
                } else {
                    responseText = "I couldn't ask Nest to change the temperature. Try again later.";
                }

                response
                    .say(responseText)
                    .card("Temperature Changed", responseText)
                    .shouldEndSession(true)
                    .send();
            }
        });

        // Asynchronous must return false.
        return false;
    }
);

app.intent('TurnDownHeat',
    {
        "utterances":
            [
                "down",
                "temperature down",
                "to turn the temperature down",
                "to turn it down"
            ]
    },
    function (request, response)
    {
        // TODO
        return false;
    }
);

app.intent('TurnUpHeat',
    {
        "utterances":
            [
                "up",
                "temperature up",
                "to turn the temperature up"
            ]
    },
    function (request, response) {
        // TODO
        return false;
    }
);

function getNestInfo(userId, callback) {
    AWS.config.loadFromPath('./apps/nest/credentials.json');
    var documentClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName : "AlexaNestUser",
        KeyConditionExpression: "#id = :user",
        ExpressionAttributeNames:{
            "#id": "AmazonUserId"
        },
        ExpressionAttributeValues: {
            ":user": userId
        }
    };

    documentClient.query(params, function(error, data) {
        if (error) {
            callback(error);
            return;
        }
        else {
            callback(null, data.Items[0]);    // only expecting one record in db since querying by key
        }
    })
}

function getThermostatsInfo(nestInfo, callback) {
    var nestApiDeviceUrl = 'https://developer-api.nest.com/devices?auth=';
    var path = nestApiDeviceUrl + nestInfo.NestAuthorizationCode;

    // Perform HTTPS request
    request(
        path,
        function (error, response, body) {
            console.log("Nest response status: " + response.statusCode);
            if (error) {
                callback(error, null);
            }

            var environment = JSON.parse(body);
            callback(null, environment);
        });
}

function buildResult(environment, callback) {
    var responseText = "";
    for (var key in environment.thermostats)
    {
        var thermostat = environment.thermostats[key];
        responseText = responseText + "In the " + thermostat.name + " it is currently ";
        switch (thermostat.temperature_scale)
        {
            case "F":
                responseText = responseText + thermostat.ambient_temperature_f + " degrees fahrenheit, and ";
                break;
            case "C":
                responseText = responseText + thermostat.ambient_temperature_c + " degrees celsius, and ";
        }

        responseText = responseText + thermostat.humidity + " percent humidity.";
    }

    callback(null, responseText);
}

function setThermostatTemperature(requestedTemperature, nestInfo, callback) {
    var nestApiThermostatUrl = 'https://developer-api.nest.com/devices/thermostats/kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7?auth=';
    var url = nestApiThermostatUrl + nestInfo.NestAuthorizationCode;

    var postData =
    {
        "target_temperature_f": requestedTemperature
    };

    var options = {
        method: 'put',
        body: postData,
        json: true,
        url: url
    };

    // Perform HTTPS request
    request(
        options,
        function (error, response, body) {
            if (error) {
                callback(error);
                return;
            } else {
                callback(null, response.statusCode);
            }
        });
}

module.exports = app;
exports.handler = app.lambda();