import * as fs from 'fs';
import * as tmp from 'tmp';
const switchScripts = require('enfocus-switch-scripts');

async function timerFired(s: Switch, flowElement: FlowElement) {
    var sqsUrl = await flowElement.getPropertyStringValue("sqsUrl");
    var sqsRegion = await flowElement.getPropertyStringValue('sqsRegion');
    var intervalSeconds = parseInt((await flowElement.getPropertyStringValue("intervalSeconds")).toString());
    var visibilityTimeoutMinutes = parseInt((await flowElement.getPropertyStringValue("visibilityTimeout")).toString());
    const visibilityTimeoutSeconds = visibilityTimeoutMinutes * 60;
    const debug = await flowElement.getPropertyStringValue("debug");

    // Set the timerInterval
    await flowElement.setTimerInterval(intervalSeconds);

    const _debug = async (message, logLevel = LogLevel.Info) => {
        if(debug === 'Yes'){
            await flowElement.log(logLevel, message);
        }
    }

    const sqs = new switchScripts.SQS();
    const messages = await sqs.receiveMessage(sqsUrl, sqsRegion, visibilityTimeoutSeconds);
    if (messages && messages?.length > 0) {
        await Promise.all(messages.map(async message => {
            try {
                const content = message.Body;
                _debug(`Receive message from SQS: ${content}`);
                const receiptHandle = message.ReceiptHandle;
                const saveToFile = tmp.fileSync().name;

                // Check if it's from S3 event notification
                if (isS3Event(content)) {
                    const action = "Download";
                    const s3Key = content.Records[0].s3?.object?.key;
                    const s3Bucket = content.Records[0].s3?.bucket?.name;
                    const s3Region = content.Records[0].awsRegion;
                    await switchScripts.S3Factory.processFile(action, saveToFile, s3Key, s3Bucket, s3Region);
                } else {
                    fs.writeFileSync(saveToFile, content);
                }
                let newJob = await flowElement.createJob(saveToFile);
                await newJob.sendToSingle();
                fs.unlinkSync(saveToFile);
                await sqs.deleteMessage(sqsUrl, receiptHandle);
            } catch (error) {
                _debug(error.message || error, LogLevel.Error);
            }
        }));
    }
}

async function jobArrived(s: Switch, flowElement: FlowElement, job: Job) {
    // Get flow element properties
    var sqsUrl = await flowElement.getPropertyStringValue("sqsUrl");
    var sqsRegion = await flowElement.getPropertyStringValue('sqsRegion');
    const debug = await flowElement.getPropertyStringValue("debug");

    const _debug = async (message) => {
        if(debug === 'Yes'){
            await flowElement.log(LogLevel.Info, message);
        }
    }

    // Log some stuff
    const sqs = new switchScripts.SQS();
    try {
        const jobFilePath = await job.get(AccessLevel.ReadOnly);
        const content = fs.readFileSync(jobFilePath).toString();
        await sqs.send(content, sqsUrl, sqsRegion);
        if (flowElement.getOutConnections().length > 0) {
            await job.sendToSingle();
            return;
        }
        await job.sendToNull();
    } catch (error) {
        const message = `Unable to send message to SQS: ${error.message || error}`;
        _debug(message);
        job.fail(message);
    }
}

function isS3Event(content:any) {
    /* -- Sample content of S3 event notification to SQS
    {
        "Records": [{
            "eventVersion": "2.1",
            "eventSource": "aws:s3",
            "awsRegion": "us-west-1",
            "eventTime": "2022-06-08T16:51:34.830Z",
            "eventName": "ObjectCreated:Copy",
            "userIdentity": {
                "principalId": "AWS:AROAUH3TSCYQUAMNNFCRJ:oscar.b@digitalroominc.com"
            },
            "requestParameters": {
                "sourceIPAddress": "76.184.8.126"
            },
            "responseElements": {
                "x-amz-request-id": "FNGS0Z4ZEBWMZHXM",
                "x-amz-id-2": "UQ0RsgqEYYQH9N97fUA/Z8yegk6ife28JpEh5JVYyKRsWr1mG+TMtF1YED9z3p6z7ZO7HGB0xF7GTZclkr1zLVIg54MxS3xV"
            },
            "s3": {
                "s3SchemaVersion": "1.0",
                "configurationId": "sendMessageToSQS",
                "bucket": {
                    "name": "qa-prism-imposition-created-xml",
                    "ownerIdentity": {
                        "principalId": "A2RHPHNPJI472Y"
                    },
                    "arn": "arn:aws:s3:::qa-prism-imposition-created-xml"
                },
                "object": {
                    "key": "Kevin+Mims+-+2488/1840279.mxml",
                    "size": 3022,
                    "eTag": "d850bb6a8713c7d17c355a1dd6fd8ad6",
                    "sequencer": "0062A0D396BA6D3610"
                }
            }
        }]
    }
     */
    return content.Records && content.Records.length > 0
        && content.Records[0].eventSource === 'aws:s3'
        && content.Records[0].awsRegion
        && content.Records[0].s3?.bucket?.name
        && content.Records[0].s3?.object?.key
        ;
}
