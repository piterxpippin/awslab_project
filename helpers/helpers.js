var fs = require('fs');
var crypto = require('crypto');
var path = require('path');

function getS3Policy() {
    var pathToFile = path.join(__dirname, 'policy.json');
    var policy = JSON.parse(fs.readFileSync(pathToFile, 'utf8'));

    var date = new Date();
    date.setDate(date.getDate() + 1);
    policy.expiration = date.toISOString();
    
    return policy;
}

function getPolicyBase64(policy) {
    var strPolicy = JSON.stringify(policy);
    return new Buffer(new Buffer(strPolicy).toString('base64'));
}

function extractAwsCredentials() {
    var pathToFile = path.join(__dirname, '../config.json');
    return JSON.parse(fs.readFileSync(pathToFile, 'utf8'));
};

function getSignature(credentials, policyBase) {
    var hmac = crypto.createHmac("sha1", credentials.secretAccessKey);
    var updatedHmac = hmac.update(policyBase);
    return updatedHmac.digest('base64');
}

function generateS3Credentials() {
    var policy = getS3Policy();
    var credentials = extractAwsCredentials();

    var s3PolicyBase = getPolicyBase64(policy);
    var signature = getSignature(credentials, s3PolicyBase);

    return {
        s3PolicyBase64: s3PolicyBase,
        s3Signature: signature,
        s3Key: credentials.accessKeyId,
        s3Redirect: "http://localhost:3000/",
        s3Policy: policy
    }
};

exports.generateS3Credentials = generateS3Credentials;