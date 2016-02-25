var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var bodyParser = require('body-parser');
var H = require('../helpers/helpers.js');
var PORT = 3000;

var sqs = new AWS.SQS();

/* GET home page. */
router.get('/', function(req, res, next) {
    var s3Credentials = H.generateS3Credentials();
    var fileNameKey = H.s3Prefix + "${filename}";
    res.render('index', { 
        title: 'AWS Project',
        key: fileNameKey,
        awsAccessKeyId: s3Credentials.s3Key,
        successActionRedirect: s3Credentials.s3Redirect,
        port: PORT,
        policy: s3Credentials.s3PolicyBase64,
        signature: s3Credentials.s3Signature
    });
});

router.get('/logEvent', function(req, res, next) {   
    var beforeLogging = new Date().toISOString();
    console.log("[" + beforeLogging + "] Logging to SimpleDB: successful upload of user image to S3.");
    H.logUpload();
    var afterLogging = new Date().toISOString();
    console.log("[" + afterLogging + "] Logging to SimpleDB: successfully re-uploaded sepia image to S3. Checking...");
    H.getPar();
    res.redirect('/');
});

router.get('/pictureGallery', function(req, res, next) {
    var s3 = new AWS.S3();
    var s3root = H.s3URL;
    var listImagesParams = {
        Bucket: H.s3Bucket, /* required */
        Delimiter: ';',
        EncodingType: 'url',
        Marker: 'AA',
        MaxKeys: 1000,
        Prefix: H.s3Prefix
    };
    
    var imagesList = [];
       
    s3.listObjects(listImagesParams, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            for (var i = 1; i < data.Contents.length; i++) {
                imagesList.push(s3root + data.Contents[i].Key);
            }
            
            res.render('pictureGallery', {
                imagesList: imagesList,
                title: 'Picture Gallery'
            });
        }    
    });
});

router.post('/sendToSQS', function(req, res) {
    console.log("POST request received!");
    console.log("POST request body: ");
    console.log(req.body);
    console.log("POST request params: ");
    console.log(req.params);
    
    H.sendSqsMessage("applySepia", JSON.parse(req.body.selectedImages));
    res.redirect('/sendToSQSSuccess');
});

router.get('/sendToSQSSuccess', function(req, res) {
    res.render('sqsSuccess', {
        title: 'Redirecting...'
    });
});

module.exports = router;