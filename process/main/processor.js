runProcessor = function(s, job){
    function processor(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/email-responses.js"));
            
            var environment = s.getPropertyValue("environment");
            var prismPost = s.getPropertyValue("prismPost");
            var endPoint = s.getPropertyValue("prismEndpoint");
            
            var handoffDataDS = loadDataset_db("Handoff Data");
            
            var validationDataDS = loadDataset_db("Validation");
            var validation = {
                nodes: validationDataDS.evalToNodes("//field-list/field"),
                post: true,
                removals: {
                    items: "",
                    layouts: ""
                }
            }
                
            for(var i=0; i<validation.nodes.length; i++){
                if(validation.nodes.getItem(i).evalToString('tag') == "Items to Remove"){
                    validation.removals.items = validation.nodes.getItem(i).evalToString('value').split(',');
                }
                if(validation.nodes.getItem(i).evalToString('tag') == "Post to Prism"){
                    validation.post = validation.nodes.getItem(i).evalToString('value') == "No" ? false : true;
                }
            }
            
            var data = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                facility: handoffDataDS.evalToString("//misc/facility"),
                jobState: job.getJobState().split('_')[0],
                exportFolder: null,
                sku: handoffDataDS.evalToString("//base/sku"),
                process: handoffDataDS.evalToString("//base/process"),
                user: handoffDataDS.evalToString("//user/folder"),
                projectNotes: "",
                notes: "",
                press: ""
            }
            
            if(data.facility == "Louisville"){
                var dbConn = connectToDatabase_db(s.getPropertyValue("database"));
                var db = new Statement(dbConn);
                    db.execute("SELECT * FROM digital_room.settings WHERE variable = 'lou-press';");
                if(!db.isRowAvailable()){
                    data.press = "A";
                }else{
                    db.fetchRow();
                    data.press = db.getString(2);
                }
                
                var nextPress
                    if(data.press == "A"){nextPress = "B"}
                    if(data.press == "B"){nextPress = "A"}
                    
                    db.execute("UPDATE digital_room.settings SET parameter = '" + nextPress + "' WHERE variable = 'lou-press';");
                    db.execute("UPDATE digital_room.history_gang SET press = '" + data.press + "' WHERE `gang-number` = '" + data.projectID + "';");
            }
                                
            var userInfo = {
                first: handoffDataDS.evalToString("//user/first"),
                last:	handoffDataDS.evalToString("//user/last"),
                email: handoffDataDS.evalToString("//user/email"),
                dir: handoffDataDS.evalToString("//user/folder")
            }
            
            var phoenixOutput = new Dir("C:/Switch/Depository/phoenixOutput/" + environment + "/" + data.sku);
            var phoenixApproved = new Dir("C:/Switch/Depository/phoenixApproved/" + environment);
            var phoenixRejected = new Dir("C:/Switch/Depository/phoenixRejected/" + environment);
            
            var newXML = s.createNewJob();
            var xmlPath = newXML.createPathWithName(data.projectID + ".xml", false);
            var xmlFile = new File(xmlPath);
            
            // Move the files inside the SKU directory.
            var files = phoenixOutput.entryList("*" + data.projectID + "*", Dir.Files, Dir.Name);
            for(var i=0; i<files.length; i++){
                if(data.jobState == "Pass" || data.jobState == "Approve"){
                    if(files[i].split("_")[2] == data.projectID + ".xml"){
                        if(prismPost == "Yes" && validation.post){
                            var response = sendToPrismApi(s, phoenixOutput, files[i], handoffDataDS, xmlFile, data, endPoint, validation);
                            if(response == "Success"){
                                // Email the success of the prism post.
                                s.log(2, data.projectID + " posted to PRISM successfully!");
                                sendEmail_db(s, data, null, getEmailResponse("Prism Post Success", null, null, data, userInfo), userInfo);
                                newXML.setPrivateData("Status","Pass");
                            }else{
                                // Email the failure of the prism post.
                                s.log(2, data.projectID + " failed to post to PRISM.");
                                sendEmail_db(s, data, null, getEmailResponse("Prism Post Fail", null, null, data, userInfo), userInfo);
                                newXML.setPrivateData("Status","Fail");
                            }
                        }else{
                            s.log(3, data.projectID + ": PRISM post disabled!")
                        }
                        newXML.setHierarchyPath([userInfo.dir])
                        newXML.sendTo(findConnectionByName_db(s, "Xml"), xmlPath);
                    }
                    s.move(phoenixOutput.path + "/" + files[i], phoenixApproved.path + "/" + files[i], true);
                }else{
                    s.move(phoenixOutput.path + "/" + files[i], phoenixRejected.path + "/" + files[i], true);
                }
            }
            
            if(data.jobState == "Pass" || data.jobState == "Approve"){
                s.log(2, data.projectID + " approved by " + userInfo.first + " " + userInfo.last + ".");
            }else{
                s.log(2, data.projectID + " rejected by " + userInfo.first + " " + userInfo.last + ".")
                sendEmail_db(s, data, null, getEmailResponse("Usage Rejection", null, null, data, userInfo), userInfo);
            }
            
            // Remove the SKU directory if it's empty.
            var files = phoenixOutput.entryList("*", Dir.Files, Dir.Name);
            if(files.length == 0){
                try{
                    phoenixOutput.rmdir();
                }catch(e){}
            }
            
            job.sendToNull(job.getPath());
            
        }catch(e){
            s.log(2, "Critical Error: Processor")
            job.sendToNull(job.getPath())
        }
    }
    processor(s, job)
}

function sendToPrismApi(s, phoenixDir, phoenixXml, handoffDataDS, xmlFile, data, endPoint, validation){
	
	var bearerToken = getNewToken(s, endPoint);
	var doc = new Document(phoenixDir.absPath + "/" + phoenixXml);	
	var map = doc.createDefaultMap();
	var layoutNodes = doc.evalToNodes('//job/layouts/layout', map);
	var productNodes = doc.evalToNodes('//job/products/product', map);
	var handoffDataNodes = handoffDataDS.evalToNodes("//products/product");
	
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
					writeXmlString(xmlFile, "workstyle", layoutNodes.at(i).evalToString('workstyle'));
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
								writeXmlString(xmlFile, "name", handoffDataDS.evalToString("//settings/printer"));
							writeXmlNode(xmlFile, "/press");
							writeXmlNode(xmlFile, "stock");
								writeXmlString(xmlFile, "name", handoffDataDS.evalToString("//base/paper").replace(/\"/g,"&quot;"));
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
					if(productNodes.at(j).evalToString('name').split('.pdf')[0] == handoffDataNodes.at(n).evalToString('contentFile').split('.pdf')[0]){
						if(validation.removals.items.toString().match(new RegExp(handoffDataNodes.at(n).evalToString('itemNumber'),"g"))) {
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
		if(endPoint == "QA"){
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