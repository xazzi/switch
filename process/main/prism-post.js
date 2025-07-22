prismPost = function(s, job, codebase){
    function run(s, job, codebase){
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

            // Specific support modules
            eval(File.read(dir.support + "/prism-post/writeXml.js"));
            eval(File.read(dir.support + "/prism-post/postUtils.js"));
            eval(File.read(dir.support + "/prism-post/fileUtils.js"));

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

			var phoenixPlanDS = loadDataset_db("Phoenix Plan");
                                
            var userInfo = {
                first: handoffDataDS.evalToString("//user/first"),
                last: handoffDataDS.evalToString("//user/last"),
                email: handoffDataDS.evalToString("//user/email"),
                dir: handoffDataDS.evalToString("//user/folder")
            }

			if(handoffData.status != "approved"){
				validation.post.prism = 'n';
			}
            
            var newXML = s.createNewJob();
            var xmlPath = newXML.createPathWithName(handoffData.gangNumber + ".xml", false);
            var xmlFile = new File(xmlPath);
			//var xmlFile = new File("C://Switch//Development//test.xml");
            
			var response, status

            if(handoffData.status == "approved"){
                status = "Approved"
                if(validation.post.prism == 'y'){
                    // Build the XML file
                    buildXml(s, xmlFile, phoenixPlanDS, handoffDataDS, handoffData, validation);

                    s.log(2, "Build XML Done");

                    // Create JSON wrapper
                    var jsonPath = createJsonPayload(s, xmlString, data.projectID);

                    s.log(2, "Create JSON Done");

                    // Post to API
                    var response = postToPrismApi(s, config, jsonPath);

                    s.log(2, "Post to Prism Done");

                    if(response == "Success"){
                        // Email the success of the prism post.
                        s.log(2, handoffData.gangNumber + " posted to PRISM successfully!");
                        newXML.setPrivateData("Status","Pass"); // Clean this up.

                    }else{
                        // Email the failure of the prism post.
                        s.log(2, handoffData.gangNumber + " failed to post to PRISM.");
                        // TODO - Add this to the new email system.
                        //sendEmail_db(s, handoffData, null, getEmailResponse("Prism Post Fail", null, null, handoffData, userInfo), userInfo);
                        newXML.setPrivateData("Status","Fail"); // Clean this up.
                        newXML.setHierarchyPath([userInfo.dir])
                        newXML.sendTo(findConnectionByName_db(s, "Xml"), xmlPath);
                    }
                }

            }else{
                status = "Rejected"
            }

			// Update the history details gang with the status and prism response.
			db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
				["project-id",handoffData.projectID]
			],[
				["status",status],
				["prism-response",response],
				["post-to-prism",validation.post.prism]
			]))

            // Update the history details layout with the status.
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
            
            job.sendToSingle(job.getPath());
            
        }catch(e){

            s.log(2, "Critical Error: Processor -- " + e)
            job.sendToSingle(job.getPath())
        }
    }
    run(s, job, codebase)
}

function sendToPrismApi(s, phoenixDir, phoenixPlanDS, handoffDataDS, xmlFile, handoffData, endPoint, validation){
	
	var bearerToken = getNewToken(s, endPoint);
	var layoutNodes = phoenixPlanDS.evalToNodes('//job/layouts/layout', map);
	var productNodes = phoenixPlanDS.evalToNodes('//job/products/product', map);
	var handoffDataNodes = handoffDataDS.evalToNodes("//products/product");

	var name = handoffDataDS.evalToString("//base/prismStock").replace(/\"/g,"&quot;");
	
		xmlFile.open(File.Append);
		xmlFile.writeLine("<?xml version='1.0' encoding='UTF-8'?>");
		xmlString += ("<?xml version='1.0' encoding='UTF-8'?>");
		
		writeXmlNode(xmlFile, "job");
			writeXmlString(xmlFile, "id", phoenixPlanDS.evalToString('//job/id', map));
			writeXmlString(xmlFile, "name", "House Stock");
			writeXmlString(xmlFile, "notes", handoffDataDS.evalToString("//base/projectNotes"));
			writeXmlString(xmlFile, "default-bleed", "0.25");
			writeXmlString(xmlFile, "units", phoenixPlanDS.evalToString('//job/units', map));
			writeXmlString(xmlFile, "run-length", phoenixPlanDS.evalToString('//job/run-length', map));
			writeXmlString(xmlFile, "sheet-usage", phoenixPlanDS.evalToString('//job/sheet-usage', map));
			writeXmlString(xmlFile, "overrun", phoenixPlanDS.evalToString('//job/overrun', map));
			writeXmlString(xmlFile, "layout-count", phoenixPlanDS.evalToString('//job/layout-count', map));
			
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
					/*
					writeXmlNode(xmlFile, "templates");
						writeXmlNode(xmlFile, "template");
							writeXmlString(xmlFile, "name", layoutNodes.at(i).evalToString('//templates/template/name'));
							writeXmlString(xmlFile, "source", layoutNodes.at(i).evalToString('//templates/template/source'));
							writeXmlString(xmlFile, "items", layoutNodes.at(i).evalToString('//templates/template/items'));
							writeXmlString(xmlFile, "placed", layoutNodes.at(i).evalToString('//templates/template/placed'));
						writeXmlNode(xmlFile, "/template");
					writeXmlNode(xmlFile, "/templates");
					*/
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
		var jsonPath = newJSON.createPathWithName(phoenixPlanDS.evalToString('//job/id', map) + ".json", false);
		var jsonFile = new File(jsonPath);
		//var jsonFile = new File("C://Switch//Development//" + phoenixPlanDS.evalToString('//job/id', map) + ".json");
			jsonFile.open(File.Append);
			jsonFile.writeLine('{');
			
			jsonFile.writeLine('"xml_id": ' + phoenixPlanDS.evalToString('//job/id', map) + ',');
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