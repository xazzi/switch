runPost = function(s, job, codebase){
    function post(s, job, codebase){
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));
            eval(File.read(dir.support + "/sql-statements.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)
            
            var bearerToken = getNewToken_phoenixProject(s, module.prismEndpoint);
            if(!bearerToken){
                job.sendTo(findConnectionByName(s, "Error"), job.getPath());
                return;
            }

            // Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                settings: new Statement(connections.settings),
                history: new Statement(connections.history),
                email: new Statement(connections.email)
            }

            var server

            switch(module.prismEndpoint){
                case "qa":
                    server = "https://gang.digitalroomapi-qa.io/v1/project/";
                break;
                case "stage":
                    server = "https://gang.digitalroomapi-stage.io/v1/project/";
                break;
                case "prod":
                    server = "https://gang.digitalroomapi.io/v1/project/";
                break;
                default:
                    return false
            }
        
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffObj = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                gangNumber: handoffDataDS.evalToString("//base/gangNumber"),
                material: handoffDataDS.evalToString("//base/process"),
                type: handoffDataDS.evalToString("//base/type"),
                doublesided: false, //handoffDataDS.evalToString("//settings/doublesided") == "true",
                whiteink: handoffDataDS.evalToString("//settings/whiteink") == "true",
                secondsurface: handoffDataDS.evalToString("//settings/secondsurf") == "true",
                printer: handoffDataDS.evalToString("//settings/printer"),
                laminate: {
                    front:{
                        cover:{
                            enabled: handoffDataDS.evalToString("//laminate/front/cover/enabled") == "true",
                            label: handoffDataDS.evalToString("//laminate/front/cover/label"),
                            value: handoffDataDS.evalToString("//laminate/front/cover/value")
                        },
                        substrate:{
                            enabled: handoffDataDS.evalToString("//laminate/front/substrate/enabled") == "true",
                            label: handoffDataDS.evalToString("//laminate/front/substrate/label"),
                            value: handoffDataDS.evalToString("//laminate/front/substrate/value")
                        }
                    },
                    back:{
                        cover:{
                            enabled: handoffDataDS.evalToString("//laminate/back/cover/enabled") == "true",
                            label: handoffDataDS.evalToString("//laminate/back/cover/label"),
                            value: handoffDataDS.evalToString("//laminate/back/cover/value")
                        },
                        substrate:{
                            enabled: handoffDataDS.evalToString("//laminate/back/substrate/enabled") == "true",
                            label: handoffDataDS.evalToString("//laminate/back/substrate/label"),
                            value: handoffDataDS.evalToString("//laminate/back/substrate/value")
                        }
                    }
                },
                coating: {
                    front:{
                        cover:{
                            enabled: handoffDataDS.evalToString("//coating/front/cover/enabled") == "true",
                            label: handoffDataDS.evalToString("//coating/front/cover/label"),
                            value: handoffDataDS.evalToString("//coating/front/cover/value")
                        },
                        substrate:{
                            enabled: handoffDataDS.evalToString("//coating/front/substrate/enabled") == "true",
                            label: handoffDataDS.evalToString("//coating/front/substrate/label"),
                            value: handoffDataDS.evalToString("//coating/front/substrate/value")
                        }
                    },
                    back:{
                        cover:{
                            enabled: handoffDataDS.evalToString("//coating/back/cover/enabled") == "true",
                            label: handoffDataDS.evalToString("//coating/back/cover/label"),
                            value: handoffDataDS.evalToString("//coating/back/cover/value")
                        },
                        substrate:{
                            enabled: handoffDataDS.evalToString("//coating/back/substrate/enabled") == "true",
                            label: handoffDataDS.evalToString("//coating/back/substrate/label"),
                            value: handoffDataDS.evalToString("//coating/back/substrate/value")
                        }
                    }
                }
            }

            // Create a data object to anchor overrides to.
            var data = {
                laminate: false
            }

            if (
                handoffObj.laminate.front.substrate.enabled ||
                handoffObj.laminate.back.substrate.enabled ||
                handoffObj.coating.front.substrate.enabled ||
                handoffObj.coating.back.substrate.enabled
            ) {
                data.laminate = true
            }
            
            var doc = new Document(job.getPath());	
            var map = doc.createDefaultMap();
            var layoutNodes = doc.evalToNodes('//job/layouts/layout', map);

            // Check if it's actually DS or SS printing. (2 pages)
            for(var i=0; i<layoutNodes.length; i++){
                
                var sideCheck = {
                    front: false,
                    back: false
                }

                var surfaceNodes = layoutNodes.at(i).evalToNodes('surfaces/surface');
                for(var k=0; k<surfaceNodes.length; k++){
                    if(surfaceNodes.at(k).evalToString('side') == "Front"){
                        sideCheck.front = true
                    }
                    if(surfaceNodes.at(k).evalToString('side') == "Back"){
                        sideCheck.back = true
                    }
                }

                if(sideCheck.front && sideCheck.back){
                    handoffObj.doublesided = true;
                    break;
                }
            }
            
            var newJob = s.createNewJob();
            var xmlfile = newJob.createPathWithName(doc.evalToString('//job/id', map) + ".json", false);
            var xmlF = new File(xmlfile);
            //var xmlF = new File("C://Switch//Development//" + doc.evalToString('//job/id', map) + ".json");
                xmlF.open(File.Append);
                xmlF.writeLine('{');
                
                xmlF.writeLine('"Description": "' + handoffObj.gangNumber + '",');
                xmlF.writeLine('"Workspace": "' + handoffObj.printer + '",');
                xmlF.writeLine('"Material": "' + handoffObj.material + '",');
                xmlF.writeLine('"Status": ' + '1' + ',');
                xmlF.writeLine('"CodeType": ' + '1' + ',');
                xmlF.writeLine('"Rush": ' + false + ',');
                xmlF.writeLine('"WhiteInk": ' + handoffObj.whiteink + ',');
                xmlF.writeLine('"DoubleSided": ' + handoffObj.doublesided + ',');
                xmlF.writeLine('"SecondSurface": ' + handoffObj.secondsurface + ',');
                xmlF.writeLine('"Laminate": ' + data.laminate + ',');
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
                db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                    ["project-id", handoffObj.projectID]
                ],[
                    ["ppq-response","Fail"]
                ])) 
                newJob.sendToNull(job.getPath())
                s.log(3, "Phoenix API post failed: " + theHTTP.lastError);
                job.sendTo(findConnectionByName(s, "Error"), job.getPath());
                return;
            }

            // Log the status of the prism post.
            db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                ["project-id", handoffObj.projectID]
            ],[
                ["ppq-response","Success"]
            ])) 
                
            newJob.sendToNull(job.getPath())
            job.sendTo(findConnectionByName(s, "Success"), job.getPath());       
            
        }catch(e){
            db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                ["project-id", handoffObj.projectID]
            ],[
                ["ppq-response","Error"]
            ])) 
            try{
                newJob.sendToNull(job.getPath())
            }catch(e){}
            s.log(2, "Critical Error: Post-Project")
            job.sendTo(findConnectionByName(s, "Error"), job.getPath());
        }
    }
    post(s, job, codebase)
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