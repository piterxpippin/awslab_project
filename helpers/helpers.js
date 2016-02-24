var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var AWS = require('aws-sdk');
var fileSystem = require('fs');

var credentials = extractAwsCredentials();

AWS.config.accessKeyId = credentials.accessKeyId;
AWS.config.secretAccessKey = credentials.secretAccessKey;
AWS.config.region = credentials.region;
AWS.config.logger = process.stdout;

var sqsURL = 'https://sqs.us-west-2.amazonaws.com/983680736795/PawlakSQS';
var s3URL = 'https://s3-us-west-2.amazonaws.com/pawlak-aws-project/';
var s3Bucket = 'pawlak-aws-project';

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
        }],
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

function listS3Images(params) {
    var s3 = new AWS.S3();
    
    var contents = [];
    
    s3.listObjects(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            for (var i = 1; i < data.Contents.length; i++) {
                console.log("IMAGE: " + data.Contents[i]);
                contents[i] = (s3URL + data.Contents[i].Key);
                console.log("ImageURL: " + contents[i]);
            }
            
            console.log(contents);
            return contents;
        }    
    });

}

function downloadS3Image(imageKey) {
    var s3 = new AWS.S3();
    var params = {
        Bucket: s3Bucket,
        Key: imageKey
    };
    var imageName = imageKey.split("/")[1];
    var fileName = "E:\\aws_temp\\" + imageName;
    var file = fileSystem.createWriteStream(fileName);
    
    console.log("\n");
    console.log("Downloading: " + imageName);
    console.log("Image will be saved to: " + fileName);
    s3.getObject(params).createReadStream().pipe(file);
    console.log("Image saved!");
    
    return fileName;
}

function sendSqsMessage(msgType, msgContent) {
    var sqs = new AWS.SQS();
    var msgParams = {
        type: msgType,
        content: JSON.stringify(msgContent)
    };

    var sqsParams = {
        MessageBody: JSON.stringify(msgParams),
        QueueUrl: sqsURL
    };

    sqs.sendMessage(sqsParams, function(err, data) {
        if (err) {
            console.log('ERR', err);
        }

        console.log(data);
    });
}

function receiveSqsMessage(params) {
    var sqs = new AWS.SQS();
    var messageList = [];
    sqs.receiveMessage(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
            console.log(data);           // successful response
            var messages = data.Messages;
            
            messageList = messages.map(function(content){
                console.log(content.Body);
                return content.Body
            });
            
            for (var i = 1; i < messages.length; i++) {
                sqs.deleteMessage({
                    "QueueUrl" : sqsURL,
                    "ReceiptHandle" : messages[i].ReceiptHandle
                }, function(err, data) {
                      if (err) console.log(err, err.stack); // an error occurred
                      else     console.log("Deleted: " + data); // successful response
                });
            }
        }
        console.log(messageList);
    });
    
    return messageList;
}

exports.s3URL = s3URL;
exports.s3Bucket = s3Bucket;
exports.sqsURL = sqsURL;
exports.extractAwsCredentials = extractAwsCredentials;
exports.generateS3Credentials = generateS3Credentials;
exports.logUpload = logUpload;
exports.getPar = getPar;
exports.listS3Images = listS3Images;
exports.downloadS3Image = downloadS3Image;
exports.sendSqsMessage = sendSqsMessage;
exports.receiveSqsMessage = receiveSqsMessage;