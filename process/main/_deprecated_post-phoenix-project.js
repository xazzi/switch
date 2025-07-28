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
            
            // We might be deliberately NOT passing in the environment to this token function, so it always pulls a prod token.
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
                    server = "https://gang.digitalroomapi-qa.io/v1/phoenixproject/";
                break;
                case "stage":
                    server = "https://gang.digitalroomapi-stage.io/v1/phoenixproject/";
                break;
                case "prod":
                    server = "https://gang.digitalroomapi.io/v1/phoenixproject/";
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
            var productNodes = doc.evalToNodes('//job/products/product', map);

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

            // Create the main object and assign some base parameters.
            var mainObject = {
                "Description": handoffObj.gangNumber,
                "Workspace": handoffObj.printer,
                "Material": handoffObj.material,
                "Status": '1',
                "CodeType": '1',
                "Rush": false,
                "WhiteInk": handoffObj.whiteink,
                "DoubleSided": handoffObj.doublesided,
                "SecondSurface": handoffObj.secondsurface,
                "Laminate": data.laminate,
                "Premask": false,
                "Layouts":[]
            }

            // Loop through the products and assign each of those.
            for(var i=0; i<productNodes.length; i++){

                var itemNumber

                // Extract the itemNumber from the properties list.
                var propertyNodes = productNodes.at(i).evalToNodes('properties/property')
                for(var ii=0; ii<propertyNodes.length; ii++){
                    if(propertyNodes.at(ii).evalToString('name') == "Item Number"){
                        itemNumber = propertyNodes.at(ii).evalToString('value')
                        break;
                    }
                }
                
                // Loop through all of the index/placed values in the layouts sub nodes
                // Assign the necessary values.
                var indexPlacedNodes = productNodes.at(i).evalToNode("layouts").getChildNodes();
                for(var k=0; k<indexPlacedNodes.length; k++){
                    var temp = {
                        JobItem: itemNumber,
                        GangNo: doc.evalToString('//job/id', map) + "-" + indexPlacedNodes.at(k).getAttributeValue('index'),
                        PhoenixProductIndex: productNodes.at(i).evalToString('index'),
                        NumberUp: indexPlacedNodes.at(k).getAttributeValue('placed')
                    }
                    mainObject.Layouts.push(temp)
                }
            }

                xmlF.open(File.Append);
                xmlF.writeLine(JSON.stringify(mainObject))
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
                // Log the status of the prism post.
                db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                    ["project-id", handoffObj.projectID]
                ],[
                    ["ppq-response","Fail"]
                ])) 
                s.log(3, "Phoenix API post failed: " + theHTTP.lastError);
                newJob.sendToNull(job.getPath())
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
            s.log(2, "Critical Error: API PPQ Post -- " + e)
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