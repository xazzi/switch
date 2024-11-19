runPost = function(s, job){
    function post(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));

            var handoffDataDS = loadDatasetNoFail_db("Handoff Data");

            var newJob = s.createNewJob();
            var xmlfile = newJob.createPathWithName("Submit" + ".json", false);
            var xmlF = new File(xmlfile);

            var messageCard = {};
            var sections = [];
                messageCard.type = "MessageCard"
                messageCard.summary = s.getServerName();
                messageCard.sections = sections;

            // Create the array of items you want to post to the webhook.
            var query = [
                ["Element", s.getPropertyValue("element")],
                ["Server", s.getServerName()],
                ["Flow", s.getPropertyValue("flow")],
                ["File", job.getName()],
                ["User", job.getUserFullName()]
            ]

            var temp

            // Check for gangNumber, in a failsafe try/catch
            try{
                temp = handoffDataDS.evalToString("//base/gangNumber")
            }catch(e){
                temp = "Unknown"
            }
            query.push(["Gang", temp])

            // Check for process, in a failsafe try/catch
            try{
                temp = handoffDataDS.evalToString("//base/process")
            }catch(e){
                temp = "Unknown"
            }
            query.push(["Process", temp])

            // Check for subprocess, in a failsafe try/catch
            try{
                temp = handoffDataDS.evalToString("//base/subprocess")
            }catch(e){
                temp = "Unknown"
            }
            query.push(["Subprocess", temp])

            // Create the structure that we pass into the webhook
            var structure = {
                facts: []
            }

            // Loop through the queries, cleaning up any errors, and push the final answer to the attributes.
            for(var i=0; i<query.length; i++){
                var temp

                try{
                    temp = query[i][1]
                }catch(e){
                    temp = "Unknown"
                }

                var attributes = {
                    name:query[i][0],
                    value:temp
                }
                structure["facts"].push(attributes)
            }

            structure.activityTitle = s.getPropertyValue("message")
                    
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