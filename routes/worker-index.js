var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var H = require('../helpers/helpers.js');
var consumer = require('sqs-consumer');

var PORT = 5000;
var s3Credentials = H.generateS3Credentials();
var sqs = new AWS.SQS();

var messages = [];

var daemon = consumer.create({
    queueUrl: H.sqsURL,
    batchSize: 10,
    handleMessage: function (message, done) {

        var msgBody = JSON.parse(message.Body);
        var msgType = msgBody.type;
        var msgContent = msgBody.content;
        messages.push(JSON.stringify(msgBody));
        console.log("\n");
        console.log("********************************************");
        console.log("Type: " + msgType);
        console.log("Content: " + msgContent);
        console.log("Content length: " + msgContent.length);
        console.log("Content length origin: " + msgBody.content.length);
        console.log("********************************************");
        console.log("\n");
        
        var imagesList = JSON.parse(msgContent);
        
        if (msgType == "applySepia") {
            for (var i=0; i<imagesList.length; i++) {
                /*
                var fullFilePath = H.downloadS3Image(imagesList[i]);
                console.log("Image on disk: " + fullFilePath);
                var lastBackslashIndex = fullFilePath.lastIndexOf("\\") + 1;
                console.log(lastBackslashIndex);
                var directory = fullFilePath.substring(0, lastBackslashIndex);
                var name = fullFilePath.substring(lastBackslashIndex);
                console.log(directory);
                console.log(name);
                */
                var sepiaImagePath = H.imageGetSepiaUpload(imagesList[i]);
            }
        }

        

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

daemon.on('error', function (err) {
    console.log(err);
});

daemon.start();


/* GET home page. */
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


module.exports = router;

