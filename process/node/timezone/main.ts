async function jobArrived(s: Switch, flowElement: FlowElement, job: Job) {
    const nDate = new Date().toLocaleString('en-US', {
        timeZone: 'America/Denver',
        hour: '2-digit',
    });

    await job.setPrivateData('hour', nDate);
    await job.sendToSingle()
}