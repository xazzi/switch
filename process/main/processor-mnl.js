runProcessor = function(s, job, codebase){
    function processor(s, job, codebase){
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/email-responses.js"));
			eval(File.read(dir.support + "/connect-to-db.js"));
			eval(File.read(dir.support + "/load-module-settings.js"));
			eval(File.read(dir.support + "/sql-statements.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

			// Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                settings: new Statement(connections.settings),
				history: new Statement(connections.history),
                email: new Statement(connections.email)
            }

            // Force user dev settings.
            if(false){
                job.setUserName("Administrator");
                job.setUserFullName("Bret Combe");
                job.setUserEmail("bret.c@digitalroominc.com");
            }
                
            // Pull the user information.
            db.settings.execute("SELECT * FROM settings.users WHERE email = '" + job.getUserEmail() + "';");
            if(!db.settings.isRowAvailable()){
                //sendEmail_db(s, data, null, getEmailResponse("Undefined User", null, null, data, job.getUserEmail(), null), null);
                job.fail("Undefined user.");
				/*
                db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                    ["project-id", data.projectID]
                ],[
                    ["status","Parse Failed"],
                    ["note","Undefined user."]
                ]))
                return;
				*/
            }
                db.settings.fetchRow();
                
            var userInfo = {
                first: db.settings.getString(1),
                last: db.settings.getString(2),
                email: db.settings.getString(3),
                dir: db.settings.getString(4) == null ? "Unknown User" : db.settings.getString(1) + " " + db.settings.getString(2) + " - " + db.settings.getString(4)
            }

            db.history.execute("SELECT * FROM history.`converter_gang` WHERE `gang-number` = '" + job.getNameProper() + "';");
			if(!db.history.isRowAvailable()){
				job.fail("No gang data available.");
                return
            }

                db.history.fetchRow();
                    
            var data = {
				projectID: db.history.getString(1),
                //gangNumber: dataDS.evalToString("//base/gangNumber"),
                gangNumber: db.history.getString(2),
                //facility: dataDS.evalToString("//misc/facility"),
                facility: "Arlington",
                //status: job.getPrivateData("status"),
                status: "approved",
                exportFolder: null,
                //sku: dataDS.evalToString("//base/sku"), //unused
                //process: dataDS.evalToString("//base/process"), //unused
                projectNotes: "",
                stock: db.history.getString(5),
                notes: db.history.getString(3),
                press: db.history.getString(4)
            }

            /*
			if(data.status != "approved"){
				validation.post.prism = 'n';
			}
            */
            
            //var phoenixOutput = new Dir("C:/Switch/Depository/phoenixOutput/" + module.localEnvironment + "/" + data.projectID);
            
            var newXML = s.createNewJob();
            var xmlPath = newXML.createPathWithName(data.gangNumber + ".xml", false);
            var xmlFile = new File(xmlPath);
			//var xmlFile = new File("C://Switch//Development//test.xml");
            
			var response, status

            // Move the files inside the projectID directory.
            //var files = phoenixOutput.entryList("*" + data.gangNumber + "*", Dir.Files, Dir.Name);
            //for(var i=0; i<files.length; i++){
				//if(data.status == "approved"){
					//status = "Approved"
					//if(validation.post.prism == 'y'){
						//if(files[i].split("_")[2] == data.gangNumber + ".xml"){
							//response = sendToPrismApi(s, phoenixOutput, files[i], xmlFile, data, module.prismEndpoint, validation);
                            response = sendToPrismApi(s, job, xmlFile, data, module.prismEndpoint, db);

							if(response == "Success"){
								// Email the success of the prism post.
								s.log(2, data.gangNumber + " posted to PRISM successfully!");
								newXML.setPrivateData("Status","Pass");
                                newXML.sendTo(findConnectionByName_db(s, "Complete"), xmlPath);

							}else{
								// Email the failure of the prism post.
								s.log(2, data.gangNumber + " failed to post to PRISM.");
								//sendEmail_db(s, data, null, getEmailResponse("Prism Post Fail", null, null, data, userInfo), userInfo);
								newXML.setPrivateData("Status","Fail");
								newXML.setHierarchyPath([userInfo.dir])
								newXML.sendTo(findConnectionByName_db(s, "Xml"), xmlPath);
							}
						//}
					//}

					// Create or get the destination path.
					//var phoenixApproved = getFileType(files[i], module.localEnvironment)

					// Move the file to the toPostProcessing directory.
					//s.move(phoenixOutput.path + "/" + files[i], phoenixApproved.path + "/" + files[i], true);

				//}else{
                /*
					status = "Rejected"
					// Create or get the destination path.
					var phoenixRejected = getDirectory("C:/Switch/Depository/phoenixRejected/" + module.localEnvironment)

					// Move the file to the rejected directory
					s.move(phoenixOutput.path + "/" + files[i], phoenixRejected.path + "/" + files[i], true);
                */
				//}
            //}

            /*
			// Update the database to reflect the status
			db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
				["project-id",data.projectID]
			],[
				["status",status],
				["prism-response",response],
				["post-to-prism",validation.post.prism]
			]))
            */
            
			// Log that it was approved.
            /*
            if(data.status == "approved"){
                s.log(2, data.gangNumber + " approved by " + userInfo.first + " " + userInfo.last + ".");
            }else{
                s.log(2, data.gangNumber + " rejected by " + userInfo.first + " " + userInfo.last + ".")
            }
            */
            
            /*
            // Remove the projectID directory if it's empty.
            var files = phoenixOutput.entryList("*", Dir.Files, Dir.Name);
            if(files.length == 0){
                try{
                    phoenixOutput.rmdir();
                }catch(e){}
            }
            */
            
            job.sendToNull(job.getPath());
            
        }catch(e){
            s.log(3, "Critical Error: Processor -- " + e)
            job.fail("Critical Error: Processor -- " + e)
        }
    }
    processor(s, job, codebase)
}

function getFileType(name, environment){

	if(name.match(/die/) == "die"){
		return getDirectory("C:/Switch/Depository/postProcessing/" + environment + "/Cut")
	}

	if(name.match(/report/) == "report"){
		return getDirectory("C:/Switch/Depository/fileDistribution/" + environment + "/Report")
	}

	if(name.match(/xml/) == "xml"){
		return getDirectory("C:/Switch/Depository/fileDistribution/" + environment + "/Data")
	}

	if(name.match(/phx/) == "phx"){
		return getDirectory("C:/Switch/Depository/fileDistribution/" + environment + "/Phoenix")
	}

	if(name.match(/csv/) == "csv"){
		return getDirectory("C:/Switch/Depository/postProcessing/" + environment + "/CSV")
	}

	return getDirectory("C:/Switch/Depository/postProcessing/" + environment + "/Print")
}

function sendToPrismApi(s, job, xmlFile, data, endPoint, db){

	var workstyle
	
	var bearerToken = getNewToken(s, endPoint);
	//var doc = new Document(phoenixDir.absPath + "/" + phoenixXml);	
    var doc = new Document(job.getPath())
	var map = doc.createDefaultMap();
	var layoutNodes = doc.evalToNodes('//job/layouts/layout', map);
	var productNodes = doc.evalToNodes('//job/products/product', map);
	//var dataNodes = dataDS.evalToNodes("//products/product");

	//var name = dataDS.evalToString("//base/prismStock").replace(/\"/g,"&quot;");

	//if(data.facility == "Solon"){
		//name += "_" + dataDS.evalToString("//settings/printer") + "_" + dataDS.evalToString("//misc/cutMethod")
	//}
	
		xmlFile.open(File.Append);
		xmlFile.writeLine("<?xml version='1.0' encoding='UTF-8'?>");
		xmlString += ("<?xml version='1.0' encoding='UTF-8'?>");
		
		writeXmlNode(xmlFile, "job");
			//writeXmlString(xmlFile, "id", data.gangNumber);
            writeXmlString(xmlFile, "id", data.gangNumber);
			writeXmlString(xmlFile, "name", "House Stock");
			//writeXmlString(xmlFile, "notes", dataDS.evalToString("//base/projectNotes"));
            writeXmlString(xmlFile, "notes", data.notes);
			writeXmlString(xmlFile, "default-bleed", "0.25");
			writeXmlString(xmlFile, "units", doc.evalToString('//job/units', map));
			writeXmlString(xmlFile, "run-length", doc.evalToString('//job/run-length', map));
			writeXmlString(xmlFile, "sheet-usage", doc.evalToString('//job/sheet-usage', map));
			writeXmlString(xmlFile, "overrun", doc.evalToString('//job/overrun', map));
			writeXmlString(xmlFile, "layout-count", doc.evalToString('//job/layout-count', map));
			
			writeXmlNode(xmlFile, "layouts");

			for(var i=0; i<layoutNodes.length; i++){

            	// Check if it's actually DS or SS printing. (2 pages)
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

				workstyle = "OneSided"
                if(sideCheck.front && sideCheck.back){
                    workstyle = "Sheetwise";
                }

				writeXmlNode(xmlFile, "layout");
					writeXmlString(xmlFile, "id", layoutNodes.at(i).evalToString('id'));
					writeXmlString(xmlFile, "index", layoutNodes.at(i).evalToString('index'));
					writeXmlString(xmlFile, "name", layoutNodes.at(i).evalToString('name'));
					writeXmlString(xmlFile, "workstyle", workstyle);
					writeXmlString(xmlFile, "run-length", layoutNodes.at(i).evalToString('run-length'));
					writeXmlString(xmlFile, "waste", layoutNodes.at(i).evalToString('waste'));
					writeXmlString(xmlFile, "plates", layoutNodes.at(i).evalToString('plates'));
					writeXmlString(xmlFile, "sheet-usage", layoutNodes.at(i).evalToString('sheet-usage'));
					writeXmlString(xmlFile, "default-bleed", "0.25");
					writeXmlString(xmlFile, "placed", layoutNodes.at(i).evalToString('placed'));
					writeXmlString(xmlFile, "overrun", layoutNodes.at(i).evalToString('overrun'));
					writeXmlNode(xmlFile, "surfaces");
						writeXmlNode(xmlFile, "surface");
							writeXmlString(xmlFile, "side", layoutNodes.at(i).evalToString('//surfaces/surface/side'));
							writeXmlNode(xmlFile, "press");
								writeXmlString(xmlFile, "id", layoutNodes.at(i).evalToString('//surfaces/surface/press/id'));
								//writeXmlString(xmlFile, "name", dataDS.evalToString("//settings/printer"));
                                writeXmlString(xmlFile, "name", data.press);
							writeXmlNode(xmlFile, "/press");
							writeXmlNode(xmlFile, "stock");
								//writeXmlString(xmlFile, "name", name);
                                writeXmlString(xmlFile, "name", data.stock.replace(/\"/g,"&quot;"));
								writeXmlString(xmlFile, "id", layoutNodes.at(i).evalToString('//surfaces/surface/stock/id'));
							writeXmlNode(xmlFile, "/stock");
							writeXmlNode(xmlFile, "grade");
								writeXmlString(xmlFile, "name", layoutNodes.at(i).evalToString('//surfaces/surface/grade/name').replace(/\"/g,"&quot;"));
								writeXmlString(xmlFile, "weight", layoutNodes.at(i).evalToString('//surfaces/surface/grade/weight'));
							writeXmlNode(xmlFile, "/grade");
							writeXmlNode(xmlFile, "sheet");
								writeXmlString(xmlFile, "name", layoutNodes.at(i).evalToString('surfaces/surface/sheet/name').replace(/\"/g,"&quot;"));
								writeXmlString(xmlFile, "id", layoutNodes.at(i).evalToString('surfaces/surface/sheet/id'));
								writeXmlString(xmlFile, "width", layoutNodes.at(i).evalToString('surfaces/surface/sheet/width').replace(/\"/g,"&quot;"));
								writeXmlString(xmlFile, "height", layoutNodes.at(i).evalToString('surfaces/surface/sheet/height').replace(/\"/g,"&quot;"));
							writeXmlNode(xmlFile, "/sheet");
						writeXmlNode(xmlFile, "/surface");
					writeXmlNode(xmlFile, "/surfaces");
				writeXmlNode(xmlFile, "/layout");
			}
			writeXmlNode(xmlFile, "/layouts");
			writeXmlNode(xmlFile, "products");
			for(var j=0; j<productNodes.length; j++){
				//for(var n=0; n<dataNodes.length; n++){
					//if(productNodes.at(j).evalToString('name').split('_')[1] == dataNodes.at(n).evalToString('contentFile').split('_')[1]){
						//if(validation.removals.items.toString().match(new RegExp(dataNodes.at(n).evalToString('itemNumber'),"g"))){
							//break;
						//}

                        db.history.execute("SELECT * FROM history.`converter_item` WHERE `gang-number` = '" + job.getNameProper() + "' AND `item-number` = '" + productNodes.at(j).evalToString('name').split('_')[0] + "';");
                        if(!db.history.isRowAvailable()){
                            return
                        }

                        db.history.fetchRow();

						writeXmlNode(xmlFile, "product");
							writeXmlString(xmlFile, "index", productNodes.at(j).evalToString('index'));
							writeXmlString(xmlFile, "name", productNodes.at(j).evalToString('name'));
							writeXmlString(xmlFile, "color", productNodes.at(j).evalToString('color'));
							writeXmlString(xmlFile, "ordered", productNodes.at(j).evalToString('ordered'));
							writeXmlString(xmlFile, "description", db.history.getString(4));
							//writeXmlString(xmlFile, "notes", dataNodes.at(n).evalToString('notes'));
                            writeXmlString(xmlFile, "notes", db.history.getString(5));
							writeXmlString(xmlFile, "width", productNodes.at(j).evalToString('width').replace(/\"/g,"&quot;"));
							writeXmlString(xmlFile, "height", productNodes.at(j).evalToString('height').replace(/\"/g,"&quot;"));
							writeXmlString(xmlFile, "placed", productNodes.at(j).evalToString('placed'));
							writeXmlString(xmlFile, "total", productNodes.at(j).evalToString('total'));
							writeXmlString(xmlFile, "overrun", productNodes.at(j).evalToString('overrun'));
							//writeXmlString(xmlFile, "stock", name);
							writeXmlNode(xmlFile, "properties");
								writeXmlNode(xmlFile, "property");
									//writeXmlString(xmlFile, "value", dataNodes.at(n).evalToString('orderNumber'));
                                    writeXmlString(xmlFile, "value", db.history.getString(3));
								writeXmlNode(xmlFile, "/property");
							writeXmlNode(xmlFile, "/properties");
							writeXmlNode(xmlFile, "layouts");
							var indexPlacedNodes = productNodes.at(j).evalToNode("layouts").getChildNodes();
							for(var k=0; k<indexPlacedNodes.length; k++){
								xmlFile.writeLine("<layout index='" + indexPlacedNodes.at(k).getAttributeValue('index') + "' placed='" + indexPlacedNodes.at(k).getAttributeValue('placed') + "'/>");
								xmlString += ("<layout index='" + indexPlacedNodes.at(k).getAttributeValue('index') + "' placed='" + indexPlacedNodes.at(k).getAttributeValue('placed') + "'/>");
							}
							writeXmlNode(xmlFile, "/layouts");
						writeXmlNode(xmlFile, "/product");
						//break;
					//}
				//}
			}
			writeXmlNode(xmlFile, "/products");
		writeXmlNode(xmlFile, "/job")
		xmlFile.close();
		
		// Create the json file for uploading to the endpoints.
		var newJSON = s.createNewJob();
		var jsonPath = newJSON.createPathWithName(data.gangNumber + ".json", false);
		var jsonFile = new File(jsonPath);
		//var jsonFile = new File("C://Switch//Development//" + data.gangNumber + ".json");
			jsonFile.open(File.Append);
			jsonFile.writeLine('{');
			
			jsonFile.writeLine('"xml_id": ' + data.gangNumber + ',');
			jsonFile.writeLine('"xml": "' + xmlString + '"');
		
			jsonFile.write('}');
			jsonFile.close();
			
		var url = "https://create-gang-api.digitalroom.com/xml-receiver";
		if(endPoint == "qa"){
			url = "https://qa-create-gang-api.digitalroom.com/xml-receiver";
		}
					
		var theHTTP = new HTTP(HTTP.SSL);
			theHTTP.url = url;
			theHTTP.authScheme = HTTP.OauthAuth;
			theHTTP.addHeader("Authorization", "Bearer " + bearerToken);
			theHTTP.addHeader("Content-Type", "application/json");
			theHTTP.setAttachedFile(jsonPath);
			theHTTP.timeOut = 300;
			theHTTP.post();
			
		while(!theHTTP.waitForFinished(10)){
			s.log(5, "Posting...", theHTTP.progress());
		}
		
			File.remove(jsonPath);
		
		if(theHTTP.finishedStatus == HTTP.Failed || theHTTP.statusCode !== 200){
			s.log(3, "POST: Failed: " + theHTTP.lastError);
			return "Fail";
		}else{
			s.log(1, "POST: Success!");
			return "Success";
		}
}

function writeXmlString(xmlFile, xmlLabel, xmlVariable){
	xmlFile.write("<" + xmlLabel + ">");
	xmlFile.write(xmlVariable);
	xmlFile.writeLine("</" + xmlLabel + ">");
	xmlString += "<" + xmlLabel + ">" + xmlVariable + "</" + xmlLabel + ">"
}

function writeXmlNode(xmlFile, node){
	xmlFile.writeLine("<" + node + ">");
	xmlString += "<" + node + ">"
}