var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var H = require('../helpers/helpers.js');
var consumer = require('sqs-consumer');

var PORT = 5000;
var s3Credentials = H.generateS3Credentials();
var sqs = new AWS.SQS();
var queueURL = 'https://sqs.us-west-2.amazonaws.com/983680736795/PawlakSQS';

var messages = [];

var app = consumer.create({
    queueUrl: queueURL,
    batchSize: 10,
    handleMessage: function (message, done) {

        var msgBody = JSON.parse(message.Body);
        messages.push(msgBody);
        console.log(msgBody);
        console.log("\n");
        router.get('/', function(req, res, next) {
            res.render('worker-index', { 
                title: 'AWS Project - SQS worker logs',
                awsAccessKeyId: s3Credentials.s3Key,
                successActionRedirect: s3Credentials.s3Redirect,
                port: PORT,
                policy: s3Credentials.s3PolicyBase64,
                signature: s3Credentials.s3Signature,
                messages: messages
            });
        });
        return done();

    }
});

app.on('error', function (err) {
    console.log(err);
});

app.start();


/* GET home page. */
router.get('/', function(req, res, next) {
    var socketio = req.app.get('socketio');
    var socket = socketio.connect(); 

    socket.on('message', function (data) {
        $("#results").text(data);
    });

    socket.on('finish', function (data) {
        $("#results").text(data);
    });
    
    res.render('worker-index', { 
        title: 'AWS Project - SQS worker logs',
        awsAccessKeyId: s3Credentials.s3Key,
        successActionRedirect: s3Credentials.s3Redirect,
        port: PORT,
        policy: s3Credentials.s3PolicyBase64,
        signature: s3Credentials.s3Signature,
    });
});



module.exports = router;

