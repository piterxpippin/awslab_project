var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var H = require('../helpers/helpers.js');
var PORT = 3000;

var sqs = new AWS.SQS();
var queueURL = 'https://sqs.us-west-2.amazonaws.com/983680736795/PawlakSQS';

/* GET home page. */
router.get('/', function(req, res, next) {
    var s3Credentials = H.generateS3Credentials();
    res.render('index', { 
        title: 'AWS Project',
        key: 'piotr.pawlak/${filename}',
        awsAccessKeyId: s3Credentials.s3Key,
        successActionRedirect: s3Credentials.s3Redirect,
        port: PORT,
        policy: s3Credentials.s3PolicyBase64,
        signature: s3Credentials.s3Signature,
        sqs: sqs
    });
});

router.get('/logEvent', function(req, res, next) {
    H.logUpload();
    H.sendSqsMessage(sqs, queueURL, "Logging event");
    res.redirect('/');
});

router.get('/pictureGallery', function(req, res, next) {
    H.sendSqsMessage(sqs, queueURL, "Rendered picture gallery");
    var s3 = new AWS.S3();
    var s3root = 'https://s3-us-west-2.amazonaws.com/pawlak-aws-project/';
    var listImagesParams = {
        Bucket: 'pawlak-aws-project', /* required */
        Delimiter: ';',
        EncodingType: 'url',
        Marker: 'AA',
        MaxKeys: 1000,
        Prefix: 'piotr.pawlak/'
    };
    
    var imagesList = [];
    
    s3.listObjects(listImagesParams, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            for (var i = 1; i < data.Contents.length; i++) {
                imagesList.push(s3root + data.Contents[i].Key);
            }
            console.log(imagesList);
            res.render('pictureGallery', {
                imagesList: imagesList, 
                title: 'Picture Gallery'
            });
        }    
    });
    
    /*
    var msgParams = {
        QueueUrl: queueURL,
        AttributeNames: [
        'All'
        ],
        MaxNumberOfMessages: 3,
        MessageAttributeNames: [
        'All'
        ],
        VisibilityTimeout: 0,
        WaitTimeSeconds: 0
    };
    */

});

module.exports = router;