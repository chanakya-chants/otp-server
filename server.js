// server.js
// BASE SETUP
// =============================================================================

// call the packages we need
(function() {

    'use strict';

    const express = require('express'),        // call express
        app = express(),                 // define our app using express
        bodyParser = require('body-parser'),
        redis = require("redis"),
        bluebird = require("bluebird");

    bluebird.promisifyAll(redis.RedisClient.prototype);
    bluebird.promisifyAll(redis.Multi.prototype);

    const client = redis.createClient(process.env.REDIS_URL);

    const sid = 'AC56e7d4529330fa2d5402ea855cc0e1f8';
    const token = '39351f526b8f3d746f33585de3debaa8';
    const sender = '+18706002090';

    let twilio = require('twilio')(sid, token);

    client.on("error", function(err) {
        console.log("Error " + err);
    });

// configure app to use bodyParser()
// this will let us get the data from a POST
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    const port = process.env.PORT || 8000;        // set our port

// ROUTES FOR OUR API
// =============================================================================
    const router = express.Router();              // get an instance of the express Router

    app.param('phone', function(req, res, next, phone) {
        // save name to the request
        req.params.phone = phone;
        next();
    });

    app.param('otp', function(req, res, next, otp) {
        // save name to the request
        req.params.otp = otp;
        next();
    });

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
    router.get('/sendOTP/:phone', function(req, res) {
        let otp = generateOtp(6);
        sendOtp(req.params.phone, otp);
        client.setAsync(req.params.phone, otp).then(function() {
            res.json({ otpset: true });
        });

    });

    router.get('/verifyOTP/:phone/:otp', function(req, res) {
        client.getAsync(req.params.phone).then(function(otp) {
            return (otp === req.params.otp) ? res.json({ valid: true }) : res.json({ valid: false });
        });
    });

// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
    app.use('/api', router);

// START THE SERVER
// =============================================================================
    app.listen(port);
    console.log('Magic happens on port ' + port);

    function generateOtp(digits) {
        //  Create a number between a < n < b
        //  TODO: Best would be to unit test this digit by digit.
        let digit = (a, b) => Math.floor((Math.random() * (b - a))) + a;
        let otp = "" + digit(1, 9);
        for (let i = 1; i < digits; i++) {
            otp += digit(0, 9);
        }
        return otp;
    }

    function sendOtp(to, message) {
        return new Promise((resolve, reject) => {
                twilio.messages.create({
                body: message,
                to: to,
                from: sender
            }, (err, data) => {
                if (err) {
                    console.error('Failed to send message.');
                    console.error(err);
                    return reject(err);
                } else {
                    console.log('Message sent.');
        return resolve();
    }
    });
    });
    };

}());
