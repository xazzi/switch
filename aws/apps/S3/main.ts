import * as fs from 'fs';
import * as tmp from 'tmp';
const switchScripts = require('enfocus-switch-scripts');

async function jobArrived(s: Switch, flowElement: FlowElement, job: Job) {
    var s3Bucket = await flowElement.getPropertyStringValue("s3Bucket");
    var s3Region = await flowElement.getPropertyStringValue("s3Region");
    var debug = await flowElement.getPropertyStringValue("debug");
    var action = await flowElement.getPropertyStringValue("action");

    const _debug = async (message) => {
        if(debug === 'Yes'){
            await flowElement.log(LogLevel.Info, message);
        }
    }

    if (!job.isFile()) {
        job.fail(`Unable to process job ${job.getName()}`);
        return;
    }
    try {
        const s3Key = job.getName();
        const jobFilePath = await job.get(AccessLevel.ReadWrite);
        await switchScripts.S3Factory.processFile(action, jobFilePath, s3Key, s3Bucket, s3Region);
        if (flowElement.getOutConnections().length > 0) {
            await job.sendToSingle();
            return;
        }
        await job.sendToNull();
    } catch (error) {
        const message = `Unable to process file download: ${error.message || error}`;
        _debug(message);
        job.fail(message);
    }
}
