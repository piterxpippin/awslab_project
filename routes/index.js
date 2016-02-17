var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var H = require('../helpers/helpers.js');
var PORT = 3000;

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
        signature: s3Credentials.s3Signature
    });
});

router.get('/logEvent', function(req, res, next) {
    H.logUpload();
    res.redirect('/');
});

router.get('/pictureGallery', function(req, res, next) {
    var s3 = new AWS.S3();
    var params = {
        Bucket: 'pawlak-aws-project', /* required */
        Delimiter: ';',
        EncodingType: 'url',
        Marker: 'AA',
        MaxKeys: 1000,
        Prefix: 'piotr.pawlak/'
    };

    var contents = Array();
    var root = 'https://s3-us-west-2.amazonaws.com/pawlak-aws-project/';

    s3.listObjects(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            for (var i = 1; i < data.Contents.length; i++) {
                contents.push(root + data.Contents[i].Key);
            }

            res.render('pictureGallery', {
                imageContent: contents, 
                title: 'Picture Gallery'
            });
        }    
    });
});

module.exports = router;