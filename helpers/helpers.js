var fs = require('fs');
var crypto = require('crypto');
var path = require('path');

function extractAwsCredentials() {
    var pathToFile = path.join(__dirname, '../config.json');
    return JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
};

function getS3Policy() {
    var pathToFile = path.join(__dirname, 'policy.json');
    return JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
}

function generateS3Credentials() {

    var policy = getS3Policy();
    var credentials = extractAwsCredentials();

    var strPolicy = JSON.stringify(policy);
    var strPolicyBase = new Buffer(new Buffer(strPolicy).toString('base64'));
    
    var hmac = crypto.createHmac("sha1", credentials.secretAccessKey);
    var updatedHmac = hmac.update(strPolicyBase);
    var signature = updatedHmac.digest('base64');

    var s3PolicyBase = new Buffer( JSON.stringify( policy ) ).toString( 'base64' );

    s3Credentials = {
        s3PolicyBase64: s3PolicyBase,
        s3Signature: signature,
        s3Key: credentials.accessKeyId,
        s3Redirect: "http://localhost:3000/",
        s3Policy: policy
    }

    return s3Credentials;
};

exports.generateS3Credentials = generateS3Credentials;