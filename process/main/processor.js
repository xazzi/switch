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
            
            var validationDataDS = loadDataset_db("Validation");
            var validation = {
                nodes: validationDataDS.evalToNodes("//field-list/field"),
                post: {
					prism: null,
					processing: true,
					facility: true
				},
                removals: {
                    items: "",
                    layouts: ""
                },
				issue: false
            }
                
            for(var i=0; i<validation.nodes.length; i++){
                if(validation.nodes.getItem(i).evalToString('tag') == "Items to Remove"){
                    validation.removals.items = validation.nodes.getItem(i).evalToString('value').split(',');
                }

				// Check if the user wants to post to prism.
                if(validation.nodes.getItem(i).evalToString('tag') == "Post to Prism?"){
                    validation.post.prism = validation.nodes.getItem(i).evalToString('value') == "No" ? 'n' : 'y';
                }

				// Check if we should notify the teams webhook of an issue.
                if(validation.nodes.getItem(i).evalToString('tag') == "Send Notification?"){
                    validation.issue = validation.nodes.getItem(i).evalToString('value') == "Yes";
                }
            }
            
			var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
				projectID: handoffDataDS.evalToString("//base/projectID"),
                gangNumber: handoffDataDS.evalToString("//base/gangNumber"),
                facility: handoffDataDS.evalToString("//misc/facility"),
				workstyle: handoffDataDS.evalToString("//misc/workstyle"),
                status: job.getPrivateData("status"),
				type: handoffDataDS.evalToString("//base/type"),
				doubleSided: handoffDataDS.evalToString("//settings/doublesided") == "true" ? true : false,
                exportFolder: null,
                sku: handoffDataDS.evalToString("//base/sku"),
                process: handoffDataDS.evalToString("//base/process"),
                user: handoffDataDS.evalToString("//user/folder"),
                projectNotes: "",
                notes: "",
                press: ""
            }
                                
            var userInfo = {
                first: handoffDataDS.evalToString("//user/first"),
                last:	handoffDataDS.evalToString("//user/last"),
                email: handoffDataDS.evalToString("//user/email"),
                dir: handoffDataDS.evalToString("//user/folder")
            }

			if(handoffData.status != "approved"){
				validation.post.prism = 'n';
			}
            
            var phoenixOutput = new Dir("C:/Switch/Depository/phoenixOutput/" + module.localEnvironment + "/" + handoffData.projectID);
            
            var newXML = s.createNewJob();
            var xmlPath = newXML.createPathWithName(handoffData.gangNumber + ".xml", false);
            var xmlFile = new File(xmlPath);
			//var xmlFile = new File("C://Switch//Development//test.xml");
            
			var response, status

            // Move the files inside the projectID directory.
            var files = phoenixOutput.entryList("*" + handoffData.gangNumber + "*", Dir.Files, Dir.Name);
            for(var i=0; i<files.length; i++){
				if(handoffData.status == "approved"){
					status = "Approved"
					if(validation.post.prism == 'y'){
						if(files[i].split("_")[2] == handoffData.gangNumber + ".xml"){
							response = sendToPrismApi(s, phoenixOutput, files[i], handoffDataDS, xmlFile, handoffData, module.prismEndpoint, validation);
							if(response == "Success"){
								// Email the success of the prism post.
								s.log(2, handoffData.gangNumber + " posted to PRISM successfully!");
								newXML.setPrivateData("Status","Pass");
							}else{
								// Email the failure of the prism post.
								s.log(2, handoffData.gangNumber + " failed to post to PRISM.");
								sendEmail_db(s, handoffData, null, getEmailResponse("Prism Post Fail", null, null, handoffData, userInfo), userInfo);
								newXML.setPrivateData("Status","Fail");
								newXML.setHierarchyPath([userInfo.dir])
								newXML.sendTo(findConnectionByName_db(s, "Xml"), xmlPath);
							}
						}
					}

					// Create or get the destination path.
					var phoenixApproved = getFileType(files[i], module.localEnvironment)

					// Move the file to the toPostProcessing directory.
					s.move(phoenixOutput.path + "/" + files[i], phoenixApproved.path + "/" + files[i], true);

				}else{
					status = "Rejected"
					// Create or get the destination path.
					var phoenixRejected = new Dir("C:/Switch/Depository/phoenixRejected/" + module.localEnvironment)

					// Move the file to the rejected directory
					s.move(phoenixOutput.path + "/" + files[i], phoenixRejected.path + "/" + files[i], true);
				}
            }

			if(validation.issue){
				sendEmail_db(s, handoffData, null, getEmailResponse("Phoenix Product Notification", null, null, handoffData, userInfo), userInfo);
			}

			// Update the database to reflect the status
			db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
				["project-id",handoffData.projectID]
			],[
				["status",status],
				["prism-response",response],
				["post-to-prism",validation.post.prism]
			]))

			db.history.execute(generateSqlStatement_Update(s, "history.details_layout", [
                ["project-id", handoffData.projectID]
            ],[
                ["status",status]
            ])) 
            
			// Log that it processed.
            if(handoffData.status == "approved"){
                s.log(2, handoffData.gangNumber + " approved by " + userInfo.first + " " + userInfo.last + ".");
            }else{
                s.log(2, handoffData.gangNumber + " rejected by " + userInfo.first + " " + userInfo.last + ".")
            }
            
            // Remove the projectID directory if it's empty.
            var files = phoenixOutput.entryList("*", Dir.Files, Dir.Name);
            if(files.length == 0){
                try{
                    phoenixOutput.rmdir();
                }catch(e){}
            }
            
            job.sendToNull(job.getPath());
            
        }catch(e){
            s.log(2, "Critical Error: Processor -- " + e)
            job.sendToNull(job.getPath())
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

function sendToPrismApi(s, phoenixDir, phoenixXml, handoffDataDS, xmlFile, handoffData, endPoint, validation){
	
	var bearerToken = getNewToken(s, endPoint);
	var doc = new Document(phoenixDir.absPath + "/" + phoenixXml);	
	var map = doc.createDefaultMap();
	var layoutNodes = doc.evalToNodes('//job/layouts/layout', map);
	var productNodes = doc.evalToNodes('//job/products/product', map);
	var handoffDataNodes = handoffDataDS.evalToNodes("//products/product");

	var name = handoffDataDS.evalToString("//base/prismStock").replace(/\"/g,"&quot;");

	if(handoffData.facility == "Solon"){
		//name += "_" + handoffDataDS.evalToString("//settings/printer") + "_" + handoffDataDS.evalToString("//misc/cutMethod")
	}
	
		xmlFile.open(File.Append);
		xmlFile.writeLine("<?xml version='1.0' encoding='UTF-8'?>");
		xmlString += ("<?xml version='1.0' encoding='UTF-8'?>");
		
		writeXmlNode(xmlFile, "job");
			writeXmlString(xmlFile, "id", doc.evalToString('//job/id', map));
			writeXmlString(xmlFile, "name", "House Stock");
			writeXmlString(xmlFile, "notes", handoffDataDS.evalToString("//base/projectNotes"));
			writeXmlString(xmlFile, "default-bleed", "0.25");
			writeXmlString(xmlFile, "units", doc.evalToString('//job/units', map));
			writeXmlString(xmlFile, "run-length", doc.evalToString('//job/run-length', map));
			writeXmlString(xmlFile, "sheet-usage", doc.evalToString('//job/sheet-usage', map));
			writeXmlString(xmlFile, "overrun", doc.evalToString('//job/overrun', map));
			writeXmlString(xmlFile, "layout-count", doc.evalToString('//job/layout-count', map));
			
			writeXmlNode(xmlFile, "layouts");
			for(var i=0; i<layoutNodes.length; i++){
				writeXmlNode(xmlFile, "layout");
					writeXmlString(xmlFile, "id", layoutNodes.at(i).evalToString('id'));
					writeXmlString(xmlFile, "index", layoutNodes.at(i).evalToString('index'));
					writeXmlString(xmlFile, "name", layoutNodes.at(i).evalToString('name'));
					writeXmlString(xmlFile, "workstyle", handoffData.workstyle);
					writeXmlString(xmlFile, "run-length", layoutNodes.at(i).evalToString('run-length'));
					writeXmlString(xmlFile, "waste", layoutNodes.at(i).evalToString('waste'));
					writeXmlString(xmlFile, "plates", layoutNodes.at(i).evalToString('plates'));
					writeXmlString(xmlFile, "sheet-usage", (layoutNodes.at(i).evalToString('sheet-usage')));
					writeXmlString(xmlFile, "default-bleed", "0.25");
					writeXmlString(xmlFile, "placed", layoutNodes.at(i).evalToString('placed'));
					writeXmlString(xmlFile, "overrun", layoutNodes.at(i).evalToString('overrun'));
					writeXmlNode(xmlFile, "surfaces");
						writeXmlNode(xmlFile, "surface");
							writeXmlString(xmlFile, "side", layoutNodes.at(i).evalToString('//surfaces/surface/side'));
							writeXmlNode(xmlFile, "press");
								writeXmlString(xmlFile, "id", layoutNodes.at(i).evalToString('//surfaces/surface/press/id'));
								writeXmlString(xmlFile, "name", handoffDataDS.evalToString("//settings/printer"));
							writeXmlNode(xmlFile, "/press");
							writeXmlNode(xmlFile, "stock");
								writeXmlString(xmlFile, "name", name);
								writeXmlString(xmlFile, "id", layoutNodes.at(i).evalToString('//surfaces/surface/stock/id'));
							writeXmlNode(xmlFile, "/stock");
							writeXmlNode(xmlFile, "grade");
								writeXmlString(xmlFile, "name", layoutNodes.at(i).evalToString('//surfaces/surface/grade/name'));
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
				for(var n=0; n<handoffDataNodes.length; n++){
					if(productNodes.at(j).evalToString('name').split('_')[1] == handoffDataNodes.at(n).evalToString('contentFile').split('_')[1]){
						if(validation.removals.items.toString().match(new RegExp(handoffDataNodes.at(n).evalToString('itemNumber'),"g"))){
							break;
						}
						writeXmlNode(xmlFile, "product");
							writeXmlString(xmlFile, "index", productNodes.at(j).evalToString('index'));
							writeXmlString(xmlFile, "name", productNodes.at(j).evalToString('name'));
							writeXmlString(xmlFile, "color", productNodes.at(j).evalToString('color'));
							writeXmlString(xmlFile, "ordered", productNodes.at(j).evalToString('ordered'));
							writeXmlString(xmlFile, "description", handoffDataNodes.at(n).evalToString('itemNumber'));
							writeXmlString(xmlFile, "notes", handoffDataNodes.at(n).evalToString('notes'));
							writeXmlString(xmlFile, "width", productNodes.at(j).evalToString('width').replace(/\"/g,"&quot;"));
							writeXmlString(xmlFile, "height", productNodes.at(j).evalToString('height').replace(/\"/g,"&quot;"));
							writeXmlString(xmlFile, "placed", productNodes.at(j).evalToString('placed'));
							writeXmlString(xmlFile, "total", productNodes.at(j).evalToString('total'));
							writeXmlString(xmlFile, "overrun", productNodes.at(j).evalToString('overrun'));
							//writeXmlString(xmlFile, "stock", name);
							writeXmlNode(xmlFile, "properties");
								writeXmlNode(xmlFile, "property");
									writeXmlString(xmlFile, "value", handoffDataNodes.at(n).evalToString('orderNumber'));
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
						break;
					}
				}
			}
			writeXmlNode(xmlFile, "/products");
		writeXmlNode(xmlFile, "/job")
		xmlFile.close();
		
		// Create the json file for uploading to the endpoints.
		var newJSON = s.createNewJob();
		var jsonPath = newJSON.createPathWithName(doc.evalToString('//job/id', map) + ".json", false);
		var jsonFile = new File(jsonPath);
		//var jsonFile = new File("C://Switch//Development//" + doc.evalToString('//job/id', map) + ".json");
			jsonFile.open(File.Append);
			jsonFile.writeLine('{');
			
			jsonFile.writeLine('"xml_id": ' + doc.evalToString('//job/id', map) + ',');
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