import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
const switchScripts = require('enfocus-switch-scripts');

async function jobArrived(s: Switch, flowElement: FlowElement, job: Job) {
    // Get flow element properties
    var s3Bucket = await flowElement.getPropertyStringValue("s3Bucket");
    var s3Region = await flowElement.getPropertyStringValue("s3Region");
    var numberOfLayouts = await flowElement.getPropertyStringValue("numberOfLayouts");
    var debug = await flowElement.getPropertyStringValue("debug");

    let layouts = Number(numberOfLayouts)+1;

    for(var i=1; i<layouts; i++){
        const _debug = async (message) => {
            if(debug === 'Yes'){
                await flowElement.log(LogLevel.Info, message);
            }
        }

        if (!job.isFile()) {
            job.fail(`Unable to process job ${job.getName()}`);
            return;
        }

        let s3Key;

        try {
            let extension = "-" + i.toString() + ".pdf"
            s3Key = await flowElement.getPropertyStringValue("filename") + extension;
            const jobFilePath = await job.get(AccessLevel.ReadOnly);
            const s3 = new switchScripts.S3();
            await s3.upload(s3Key, s3Bucket, s3Region, jobFilePath);

        } catch (error) {
            job.fail(`Unable to upload file ${s3Key}: ${error.message || error}`);
        }
    }

    if (flowElement.getOutConnections().length > 0) {
        await job.sendToSingle();
        return;
    }
    await job.sendToNull();

}
