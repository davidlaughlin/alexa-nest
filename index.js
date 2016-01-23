var https = require('https');
var request = require('request');
var alexa = require('alexa-app');
var AWS = require('aws-sdk');
var app = new alexa.app('nest');

app.launch(function(request, response) {
    console.log('launch requested.');
    var responseText = "What would you like me to ask Nest? I can ask it the current status or to change the temperature.";

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

        currentStatus(
            'https://developer-api.nest.com',
            '/devices?auth=c.dIcXQLCJsrZcXKBdYpvWvHsutiX0FADKw7YLGrZNGrwln0ezizQLxdvx3HoG0zpGiysKb614YCjqBWKCeCc4QvS2tKZwAKZhSd5IxfcAd0Oe8ZUvtcgbF5UjZmauiZwe95U1gE7Gp6iRY9LB',
            function(environment) {

                var responseText = "It is currently ";
                switch (environment.thermostats.kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7.temperature_scale)
                {
                    case "F":
                        responseText = responseText + environment.thermostats.kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7.ambient_temperature_f + " degrees fahrenheit, and ";
                        break;
                    case "C":
                        responseText = responseText + environment.thermostats.kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7.ambient_temperature_c + " degrees celsius, and ";
                }

                responseText = responseText + environment.thermostats.kzruxo9mRefkIhQxiMxAvH_SGCk_1IK7.humidity + " percent humidity.";

                response
                    .say(responseText)
                    .card("Current", responseText)
                    .shouldEndSession(true)
                    .send();
            }
        );

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
        var requestedTemperature = parseInt(request.data.request.intent.slots.number.value);
        console.log('set temperature requested: ' + requestedTemperature);
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

function getNestInfo(documentClient, callback)
{
    //AWS.config.loadFromPath('./apps/nest/credentials.json');
    //var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName : "AlexaNestUser",
        KeyConditionExpression: "#id = :user",
        ExpressionAttributeNames:{
            "#id": "AmazonUserId"
        },
        ExpressionAttributeValues: {
            ":user":request.userId
        }
    };

    documentClient.query(params, function(error, data) {
        if (error) {
            console.log("error querying document: " + error);
        } else {
            return data;
        }
    });
}

function currentStatus(host, path, callback)
{
    // Perform HTTP request
    request(
        host + path,
        function (error, response, body) {
            console.log("Nest response status: " + response.statusCode);
            var environment = JSON.parse(body);
            callback(environment);
        });
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
    }

    request(
        options,
        function (error, response, body) {
            console.log("Nest Response Status: " + response.statusCode);
            callback(response.statusCode);
        });
}

module.exports = app;
exports.handler = app.lambda();