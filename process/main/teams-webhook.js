runPost = function(s, job){
    function post(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));

            var handoffDataDS = loadDatasetNoFail_db("Handoff Data");
            var handoffObj = {}
            
            if(handoffDataDS == "Dataset Missing"){
                handoffObj.projectID = job.getNameProper()
                handoffObj.gangNumber = "Unknown"
                handoffObj.process = "Unknown"
                handoffObj.subprocess = "Unknown"
            }else{
                handoffObj.projectID = handoffDataDS.evalToString("//base/projectID")
                handoffObj.gangNumber = handoffDataDS.evalToString("//base/gangNumber")
                handoffObj.process = handoffDataDS.evalToString("//base/process")
                handoffObj.subprocess = handoffDataDS.evalToString("//base/subprocess")
            }

            var newJob = s.createNewJob();
            var xmlfile = newJob.createPathWithName("Submit" + ".json", false);
            var xmlF = new File(xmlfile);

            var messageCard = {};
            var sections = [];
                messageCard.type = "MessageCard"
                messageCard.summary = s.getServerName();
                messageCard.sections = sections;

            var structure = {
                facts: [
                    {
                        "name": "Element: ",
                        "value": s.getPropertyValue("element")
                    },
                    {
                        "name": "Server: ",
                        "value": s.getServerName()
                    },
                    {
                        "name": "Flow: ",
                        "value": s.getPropertyValue("flow")
                    },
                    {
                        "name": "Gang: ",
                        "value": handoffObj.gangNumber
                    },
                    {
                        "name": "Process: ",
                        "value": handoffObj.process
                    },
                    {
                        "name": "Subprocess: ",
                        "value": handoffObj.subprocess
                    },
                    {
                        "name": "File: ",
                        "value": job.getName()
                    },
                    {
                        "name": "User: ",
                        "value": job.getUserFullName()
                    }
                ],
                activityTitle: s.getPropertyValue("message")
            }
                    
                messageCard.sections.push(structure);

                xmlF.open(File.Append);
                xmlF.writeLine(JSON.stringify(messageCard));
                xmlF.close();
                
            // Post the above json to the API.
            var theHTTP = new HTTP(HTTP.SSL);
                theHTTP.url = s.getPropertyValue("url");
                theHTTP.enableMime = false;
                theHTTP.setAttachedFile(xmlfile);
                theHTTP.timeOut = 300;
                theHTTP.post();
                
            while(!theHTTP.waitForFinished(10)){
                s.log(5, "Posting to Teams...", theHTTP.progress());
            }
            
            if(theHTTP.finishedStatus == HTTP.Failed || theHTTP.statusCode !== 200){
                s.log(3, "Teams post failed: " + theHTTP.lastError);
                job.fail(e);
                return;
            }
                    
            job.sendToSingle(job.getPath()) 
            
        }catch(e){
            s.log(3, "Critical Error: Teams Message:" + e)
            job.fail(e);
        }
    }
    post(s, job)
}