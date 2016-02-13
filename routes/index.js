var express = require('express');
var router = express.Router();
var AWS = require('aws-sdk');
var H = require('../helpers/helpers.js');
var PORT = 3000;

/* GET home page. */
router.get('/', function(req, res, next) {
    var s3Credentials = H.generateS3Credentials();
    res.render('index', { 
        title: 'Express',
        key: 'piotr.pawlak/${filename}',
        awsAccessKeyId: s3Credentials.s3Key,
        port: PORT,
        policy: s3Credentials.s3PolicyBase64,
        signature: s3Credentials.s3Signature
    });
});

module.exports = router;