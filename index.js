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

app.error = function(error)
{
    console.log(error);
};

// Alexa, ask nest the current status
app.intent('Current',
    {
        "utterances":
            [
                "current",
                "for the current temperature"
            ]
    },
    function(request, response) {
        console.log('current temperature requested.');
        async.waterfall([
            async.apply(getNestInfo, request),
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
        async.waterfall([
            async.apply(getNestInfo, request),
            async.apply(setThermostatTemperature),
            buildResult
        ], function (error, responseText) {
            if (error) {
                console.log(error);
            } else {
                response
                    .say(responseText)
                    .card("Temperature Changed", responseText)
                    .shouldEndSession(true)
                    .send();
            }
        });

/*
        setTemperature(
            'https://developer-api.nest.com',
            '/devices/thermostats/kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7?auth=c.dIcXQLCJsrZcXKBdYpvWvHsutiX0FADKw7YLGrZNGrwln0ezizQLxdvx3HoG0zpGiysKb614YCjqBWKCeCc4QvS2tKZwAKZhSd5IxfcAd0Oe8ZUvtcgbF5UjZmauiZwe95U1gE7Gp6iRY9LB',
            requestedTemperature,
            function(statusCode) {
                var responseText = "";
                if (statusCode === 200) {
                    responseText = "Temperature has been set to ";
                    responseText = responseText + request.data.request.intent.slots.number.value + " degrees.";
                }
                else
                {
                    responseText = "I couldn't ask Nest to change the temperature. Try again later.";
                }

                response
                    .say(responseText)
                    .card("Temperature Changed", responseText)
                    .shouldEndSession(true)
                    .send();

                response.send();
            }
        );

*/

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
                "to turn the temperature down"
            ]
    },
    function (request, response)
    {
        currentStatus(
            'https://developer-api.nest.com',
            '/devices?auth=c.dIcXQLCJsrZcXKBdYpvWvHsutiX0FADKw7YLGrZNGrwln0ezizQLxdvx3HoG0zpGiysKb614YCjqBWKCeCc4QvS2tKZwAKZhSd5IxfcAd0Oe8ZUvtcgbF5UjZmauiZwe95U1gE7Gp6iRY9LB',
            function(environment) {
                var currentTemperature = environment.thermostats.kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7.target_temperature_f;
                var targetTemperature = currentTemperature - 2;

                setTemperature(
                    'https://developer-api.nest.com',
                    '/devices/thermostats/kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7?auth=c.dIcXQLCJsrZcXKBdYpvWvHsutiX0FADKw7YLGrZNGrwln0ezizQLxdvx3HoG0zpGiysKb614YCjqBWKCeCc4QvS2tKZwAKZhSd5IxfcAd0Oe8ZUvtcgbF5UjZmauiZwe95U1gE7Gp6iRY9LB',
                    targetTemperature,
                    function(statusCode) {
                        var responseText = "";
                        if (statusCode === 200) {
                            responseText = "I've asked Nest to turn the temperature up a couple of degrees to " + targetTemperature + ".";
                        }
                        else
                        {
                            responseText = "I couldn't ask Nest to change the temperature. Try again later.";
                        }

                        response
                            .say(responseText)
                            .card("Turning Down", responseText)
                            .shouldEndSession(true)
                            .send();
                    }
                )
            }
        );

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
        currentStatus(
            'https://developer-api.nest.com',
            '/devices?auth=c.dIcXQLCJsrZcXKBdYpvWvHsutiX0FADKw7YLGrZNGrwln0ezizQLxdvx3HoG0zpGiysKb614YCjqBWKCeCc4QvS2tKZwAKZhSd5IxfcAd0Oe8ZUvtcgbF5UjZmauiZwe95U1gE7Gp6iRY9LB',
            function (environment) {
                var currentTemperature = environment.thermostats.kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7.target_temperature_f;
                var targetTemperature = currentTemperature + 2;

                setTemperature(
                    'https://developer-api.nest.com',
                    '/devices/thermostats/kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7?auth=c.dIcXQLCJsrZcXKBdYpvWvHsutiX0FADKw7YLGrZNGrwln0ezizQLxdvx3HoG0zpGiysKb614YCjqBWKCeCc4QvS2tKZwAKZhSd5IxfcAd0Oe8ZUvtcgbF5UjZmauiZwe95U1gE7Gp6iRY9LB',
                    targetTemperature,
                    function (statusCode) {
                        var responseText = "";
                        if (statusCode === 200) {
                            responseText = "I've asked Nest to turn the temperature up a couple of degrees to " + targetTemperature + ".";
                        }
                        else
                        {
                            responseText = "I couldn't ask Nest to change the temperature. Try again later.";
                        }

                        response
                            .say(responseText)
                            .card("Turning Down", responseText)
                            .shouldEndSession(true)
                            .send();
                    }
                )
            }
        );

        return false;
    }
);

function getNestInfo(request, callback) {
    AWS.config.loadFromPath('./apps/nest/credentials.json');
    var documentClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName : "AlexaNestUser",
        KeyConditionExpression: "#id = :user",
        ExpressionAttributeNames:{
            "#id": "AmazonUserId"
        },
        ExpressionAttributeValues: {
            ":user": request.userId
        }
    };

    documentClient.query(params, function(error, data) {
        if (error) {
            callback(error, null);
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
    for (thermostat in environment.thermostats)
    {
        responseText = responseText + "In the hallway it is currently  ";
        switch (environment.thermostats[thermostat].temperature_scale)
        {
            case "F":
                responseText = responseText + environment.thermostats[thermostat].ambient_temperature_f + " degrees fahrenheit, and ";
                break;
            case "C":
                responseText = responseText + environment.thermostats[thermostat].ambient_temperature_c + " degrees celsius, and ";
        }

        responseText = responseText + environment.thermostats[thermostat].humidity + " percent humidity.";
    }

    callback(null, responseText);
}

function setTemperature(host, path, requestedTemperature, callback)
{

    var postData =
    {
        "target_temperature_f": requestedTemperature
    };

    var url = host + path;
    var options = {
        method: 'put',
        body: postData,
        json: true,
        url: url
    };

    request(
        options,
        function (error, response, body) {
            console.log("Nest Response Status: " + response.statusCode);
            callback(response.statusCode);
        });
}

function setThermostatTemperature(nestInfo, request, callback) {
    var requestedTemperature = parseInt(request.data.request.intent.slots.number.value);
    var nestApiDeviceUrl = 'https://developer-api.nest.com/devices?auth=';
    var url = nestApiDeviceUrl + nestInfo.NestAuthorizationCode;

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
            console.log("Nest response status: " + response.statusCode);
            callback(response.statusCode);
        });
}

module.exports = app;
exports.handler = app.lambda();