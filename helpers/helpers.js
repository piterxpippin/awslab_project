var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var AWS = require('aws-sdk');

var credentials = extractAwsCredentials();

AWS.config.accessKeyId = credentials.accessKeyId;
AWS.config.secretAccessKey = credentials.secretAccessKey;
AWS.config.region = credentials.region;
AWS.config.logger = process.stdout;

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

    var s3PolicyBase = getPolicyBase64(policy);
    var signature = getSignature(credentials, s3PolicyBase);

    return {
        s3PolicyBase64: s3PolicyBase,
        s3Signature: signature,
        s3Key: credentials.accessKeyId,
        s3Redirect: "http://localhost:3000/logEvent",
        s3Policy: policy
    }
};

function createDomain(simpleDb) {
    simpleDb = new AWS.SimpleDB();
    var params = {
        DomainName: 'pawlak-aws-logs'
    };

    simpleDb.createDomain(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });
}

function logUpload() {
    var simpleDb = new AWS.SimpleDB();
    createDomain(simpleDb);
    var putParams = {
        Attributes: [ {
            Name: 'Time and date',
            Value: new Date().toISOString(),
            Replace: false
        }, {
            Name: 'Filename',
            Value: pattern.exec(key),
            Replace: false
        } ],
        DomainName: 'pawlak-aws-logs',
        ItemName: 'uploadEvents'
    };

    simpleDb.putAttributes(putParams, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });
}

function getPar() {
    var simpleDb = new AWS.SimpleDB();
    var getParams = {
        DomainName: 'pawlak-aws-logs',
        ItemName: 'uploadEvents',
        ConsistentRead: true
    };

    simpleDb.getAttributes(getParams, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
    });
}

exports.extractAwsCredentials = extractAwsCredentials;
exports.generateS3Credentials = generateS3Credentials;
exports.logUpload = logUpload;
exports.getPar = getPar;