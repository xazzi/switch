runPost = function(s, job){
    function post(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/get-token.js"));
            
            var bearerToken = getNewToken_phoenixProject(s);
            if(!bearerToken){
                job.sendTo(findConnectionByName(s, "Error"), job.getPath());
                return;
            }
            
            var server = s.getPropertyValue("environment") == "QA" ? "https://digital-room-gang.digitalroomapi-qa.io/v1/project/" : "https://digital-room-gang.digitalroomapi.io/v1/project/";
        
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffObj = {
                material: handoffDataDS.evalToString("//base/process"),
                doublesided: handoffDataDS.evalToString("//settings/doublesided") == "true",
                whiteink: handoffDataDS.evalToString("//settings/whiteink") == "true",
                laminate: handoffDataDS.evalToString("//settings/laminate") == "true",
                secondsurface: handoffDataDS.evalToString("//settings/secondsurf") == "true",
                printer: handoffDataDS.evalToString("//settings/printer")
            }
            
            var doc = new Document(job.getPath());	
            var map = doc.createDefaultMap();
            var layoutNodes = doc.evalToNodes('//job/layouts/layout', map);
            
            var newJob = s.createNewJob();
            var xmlfile = newJob.createPathWithName(doc.evalToString('//job/id', map) + ".json", false);
            var xmlF = new File(xmlfile);
            //var xmlF = new File("C://Switch//Development//" + doc.evalToString('//job/id', map) + ".json");
                xmlF.open(File.Append);
                xmlF.writeLine('{');
                
                xmlF.writeLine('"Description": "' + 'Description' + '",');
                xmlF.writeLine('"Workspace": "' + handoffObj.printer + '",');
                xmlF.writeLine('"Material": "' + handoffObj.material + '",');
                xmlF.writeLine('"Status": ' + '1' + ',');
                xmlF.writeLine('"CodeType": ' + '1' + ',');
                xmlF.writeLine('"Rush": ' + false + ',');
                xmlF.writeLine('"WhiteInk": ' + handoffObj.whiteink + ',');
                xmlF.writeLine('"DoubleSided": ' + handoffObj.doublesided + ',');
                xmlF.writeLine('"SecondSurface": ' + handoffObj.secondsurface + ',');
                xmlF.writeLine('"Laminate": ' + handoffObj.laminate + ',');
                xmlF.writeLine('"Premask": ' + false + ',');
                
                //layout loop starts here
                xmlF.writeLine('"Layouts": ' + '[' + '');	
                for(var i=0; i<layoutNodes.length; i++){
                    xmlF.writeLine('{');
                    
                    xmlF.writeLine('"GangNo": "' + doc.evalToString('//job/id', map) + "-" + layoutNodes.at(i).evalToString('index') + '"');
                    
                    if(i != layoutNodes.length-1){
                        xmlF.writeLine('},');
                    }else{
                        xmlF.writeLine('}');
                    }
                }
    
                xmlF.writeLine(']');	
                xmlF.writeLine('}');
                xmlF.close();
                
            // Post the above json to the API.
            var theHTTP = new HTTP(HTTP.SSL);
                theHTTP.url = server;
                theHTTP.enableMime = false;
                theHTTP.addHeader("Content-Type", "application/json");
                theHTTP.addHeader("Authorization", "Bearer " + bearerToken);
                theHTTP.setAttachedFile(xmlfile);
                theHTTP.timeOut = 300;
                theHTTP.post();
                
            while(!theHTTP.waitForFinished(10)){
                s.log(5, "Posting Phoenix data...", theHTTP.progress());
            }
            
                File.remove(xmlfile);
            
            if(theHTTP.finishedStatus == HTTP.Failed || theHTTP.statusCode !== 201){
                s.log(3, "Phoenix API post failed: " + theHTTP.lastError);
                job.sendTo(findConnectionByName(s, "Error"), job.getPath());
                return;
            }
                    
            s.log(2, "Phoenix API post complete!")
            job.sendTo(findConnectionByName(s, "Success"), job.getPath());            
            
        }catch(e){
            s.log(2, "Critical Error: Post-Project")
            job.sendTo(findConnectionByName(s, "Error"), job.getPath());
        }
    }
    post(s, job)
}

function findConnectionByName(s, inName){
	var outConnectionList = s.getOutConnections();
	for(var i=0; i<outConnectionList.length; i++){
		var theConnection = outConnectionList.getItem(i);
		var theName = theConnection.getName();
		if(inName == theName){
			return theConnection;
		}
	}
	return null;
}