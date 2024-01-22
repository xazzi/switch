runPost = function(s, job){
    function post(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

            // We might be deliberately NOT passing in the environment to this token function, so it always pulls a prod token.
            var bearerToken = getNewToken(s);
            if(!bearerToken){
                job.sendTo(findConnectionByName(s, "Error"), job.getPath());
                return;
            }
            
            var server = "https://manufacturing.digitalroom.com/phoenixJob/";
            if(module.prismEndpoint == "qa"){
                server = "https://qa-manufacturing.digitalroom.com/phoenixJob/"
            }
        
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffObj = {
                dateID: handoffDataDS.evalToString("//base/dateID"),
                sku: handoffDataDS.evalToString("//base/sku"),
                jobNumber: handoffDataDS.evalToString("//base/saveLocation"),
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
            var productNodes = doc.evalToNodes('//job/products/product', map);
            var handoffDataNodes = handoffDataDS.evalToNodes("//products/product");
            
            var filepath = "https://baconbits.signs.com/processed/" + handoffObj.jobNumber + "/Summary/" + handoffObj.dateID + "-" + handoffObj.sku + "-1" + "_" + handoffObj.material + "-Report_" + doc.evalToString('//job/id', map) + ".pdf";
    
            var newJob = s.createNewJob();
            var xmlfile = newJob.createPathWithName(doc.evalToString('//job/id', map) + ".json", false);
            var xmlF = new File(xmlfile);
            //var xmlF = new File("C://Switch//Development//" + doc.evalToString('//job/id', map) + ".json");
                xmlF.open(File.Append);
                xmlF.writeLine('{');
                
                xmlF.writeLine('"JobID": "' + doc.evalToString('//job/id', map) + '",');
                xmlF.writeLine('"JobName": "' + 'House Stock' + '",');
                xmlF.writeLine('"AddedOn": "' + new Date() + '",');
                //xmlF.writeLine('"Contact": "' + doc.evalToString('//job/contact', map) + '",');
                //xmlF.writeLine('"Phone": "' + doc.evalToString('//job/phone', map) + '",');
                //xmlF.writeLine('"Client": "' + doc.evalToString('//job/client', map) + '",');
                //xmlF.writeLine('"Note": "' + doc.evalToString('//job/notes', map) + '",');
                xmlF.writeLine('"DefaultBleed": "' + '0.25' + '",');
                xmlF.writeLine('"Units": "' + doc.evalToString('//job/units', map) + '",');
                xmlF.writeLine('"RunLength": ' + doc.evalToString('//job/run-length', map) + ',');
                xmlF.writeLine('"PressMinutes": ' + doc.evalToString('//job/press-minutes', map) + ',');
                xmlF.writeLine('"PlateCost": ' + doc.evalToString('//job/plate-cost', map) + ',');
                xmlF.writeLine('"StockCost": ' + doc.evalToString('//job/stock-cost', map) + ',');
                xmlF.writeLine('"PressCost": ' + doc.evalToString('//job/press-cost', map) + ',');
                xmlF.writeLine('"DieCost": ' + doc.evalToString('//job/die-cost', map) + ',');
                xmlF.writeLine('"TotalCost": ' + doc.evalToString('//job/total-cost', map) + ',');
                xmlF.writeLine('"Waste": ' + doc.evalToString('//job/waste', map) + ',');
                xmlF.writeLine('"SheetUsage": ' + doc.evalToString('//job/sheet-usage', map) + ',');
                xmlF.writeLine('"Underrun": ' + doc.evalToString('//job/underrun', map) + ',');
                xmlF.writeLine('"Overrun": ' + doc.evalToString('//job/overrun', map) + ',');
                xmlF.writeLine('"LayoutCount": ' + doc.evalToString('//job/layout-count', map) + ',');
                xmlF.writeLine('"NestedStatusRead": ' + true + ',');
                xmlF.writeLine('"FilePath": "' + filepath + '",');
                xmlF.writeLine('"Rush": ' + false + ',');
                xmlF.writeLine('"MaterialProductionID": ' + 1 + ',');
                xmlF.writeLine('"WhiteInk": ' + handoffObj.whiteink + ',');
                xmlF.writeLine('"DoubleSided": ' + handoffObj.doublesided + ',');
                xmlF.writeLine('"PhoenixJobMountID": ' + 1 + ',');
                xmlF.writeLine('"SecondSurface": ' + handoffObj.secondsurface + ',');
                xmlF.writeLine('"Laminate": ' + handoffObj.laminate + ',');
                xmlF.writeLine('"Premask": ' + false + ',');
                xmlF.writeLine('"Technician": "' + 'bcombe' + '",');
                xmlF.writeLine('"Material": "' + handoffObj.material + '",');
                xmlF.writeLine('"PrinterName": "' + handoffObj.printer + '",');
                xmlF.writeLine('"StatusID": ' + 1 + ',');
                xmlF.writeLine('"Layouts": ' + '[' + '');
                    
                //layout loop starts here
                for(var i=0; i<layoutNodes.length; i++){
                    var baseFileName = handoffObj.dateID + "-" + handoffObj.sku + "-" + layoutNodes.at(i).evalToString('index') + "_" + handoffObj.material + "_Q" + layoutNodes.at(i).evalToString('run-length') + "_" + doc.evalToString('//job/id', map) + layoutNodes.at(i).evalToString('index');
                    var filename_front = baseFileName + ".pdf";
                    var filename_back = null;
                    
                    if(handoffObj.doublesided){
                        filename_front = baseFileName + "_F" + ".pdf";
                        filename_back = baseFileName + "_B" + ".pdf";
                    }
            
                    xmlF.writeLine('{');
                    xmlF.writeLine('"LayoutIndex": ' + layoutNodes.at(i).evalToString('index') + ',');
                    xmlF.writeLine('"LayoutName": "' + layoutNodes.at(i).evalToString('name') + '",');
                    xmlF.writeLine('"WorkStyle": "' + layoutNodes.at(i).evalToString('workstyle') + '",');
                    xmlF.writeLine('"RunLength": ' + layoutNodes.at(i).evalToString('run-length') + ',');
                    xmlF.writeLine('"PressMinutes": ' + layoutNodes.at(i).evalToString('press-minutes') + ',');
                    xmlF.writeLine('"Plates": ' + layoutNodes.at(i).evalToString('plates') + ',');
                    xmlF.writeLine('"PlateCost": ' + layoutNodes.at(i).evalToString('plate-cost') + ',');
                    xmlF.writeLine('"StockCost": ' + layoutNodes.at(i).evalToString('stock-cost') + ',');
                    xmlF.writeLine('"PressCost": ' + layoutNodes.at(i).evalToString('press-cost') + ',');
                    xmlF.writeLine('"DieCost": ' + layoutNodes.at(i).evalToString('die-cost') + ',');
                    xmlF.writeLine('"TotalCost": ' + layoutNodes.at(i).evalToString('total-cost') + ',');
                    xmlF.writeLine('"Waste": ' + layoutNodes.at(i).evalToString('waste') + ',');
                    xmlF.writeLine('"SheetUsage": ' + layoutNodes.at(i).evalToString('sheet-usage') + ',');
                    xmlF.writeLine('"Underrun": ' + layoutNodes.at(i).evalToString('underrun') + ',');
                    xmlF.writeLine('"Overrun": ' + layoutNodes.at(i).evalToString('overrun') + ',');
                    xmlF.writeLine('"ProductCount": ' + layoutNodes.at(i).evalToString('product-count') + ',');
                    xmlF.writeLine('"Random": "' + layoutNodes.at(i).evalToString('random') + '",');
                    xmlF.writeLine('"FilePath": "' + filepath + '",');
                    xmlF.writeLine('"PhoenixFileNameFront": "' + filename_front + '",');
                    if(filename_back != null){
                        xmlF.writeLine('"PhoenixFileNameBack": "' + filename_back + '",');
                    }
                    xmlF.writeLine('"LayoutID": ' + doc.evalToString('//job/id', map) + layoutNodes.at(i).evalToString('index') + ',');
                    //xmlF.writeLine('"PrintStatusID": ' + null + ',');
                    //xmlF.writeLine('"Quantity": ' + null + ',');
                    xmlF.writeLine('"NestingStatusID": ' + 1 + ',');
                    xmlF.writeLine('"PrintStatusID": ' + 1 + ',');
                    xmlF.writeLine('"Updated": "' + new Date() + '",');
                    xmlF.writeLine('"GangNo": "' + doc.evalToString('//job/id', map) + "-" + layoutNodes.at(i).evalToString('index') + '",');
                    xmlF.writeLine('"Products": ' + '[' + '');
                    
                    var productArray = [];
                    //product loop starts here
                    for(var l=0; l<productNodes.length; l++){
                        var indexPlacedNodes = productNodes.at(l).evalToNode("layouts").getChildNodes();
                        for(var k=0; k<indexPlacedNodes.length; k++){
                            if(indexPlacedNodes.at(k).getAttributeValue('index') == layoutNodes.at(i).evalToString('index')){
                                productArray.push([productNodes.at(l),indexPlacedNodes.at(k).getAttributeValue('placed')])
                            }
                        }
                    }
                                               
                    for(var j=0; j<productArray.length; j++){
                        xmlF.writeLine('{');
                        xmlF.writeLine('"LineItemID": ' + productArray[j][0].evalToString("name").split("_")[1] + ',');
                        xmlF.writeLine('"ProductIndex": ' + productArray[j][0].evalToString("index") + ',');
                        xmlF.writeLine('"Color": "' + productArray[j][0].evalToString("color") + '",');
                        xmlF.writeLine('"Ordered": ' + productArray[j][0].evalToString("ordered") + ',');
                        xmlF.writeLine('"DieSource": "' + productArray[j][0].evalToString("die-source") + '",');
                        xmlF.writeLine('"DiePath": "' + productArray[j][0].evalToString("die-path").replace(/\\/g,"\\\\") + '",');
                        xmlF.writeLine('"Stock": "' + productArray[j][0].evalToString("stock") + '",');
                        xmlF.writeLine('"Grade": "' + productArray[j][0].evalToString("grade") + '",');
                        xmlF.writeLine('"Grain": "' + productArray[j][0].evalToString("grain") + '",');
                        //xmlF.writeLine('"Width": "' + productArray[j][0].evalToString("width").replace(/\"/g,"&quot;") + '",');
                        //xmlF.writeLine('"Height": "' + productArray[j][0].evalToString("height").replace(/\"/g,"&quot;") + '",');
                        xmlF.writeLine('"Width": "' + productArray[j][0].evalToString("width").replace(/\"/g,"") + '",');
                        xmlF.writeLine('"Height": "' + productArray[j][0].evalToString("height").replace(/\"/g,"") + '",');
                        xmlF.writeLine('"SpacingType": "' + productArray[j][0].evalToString("spacing-type") + '",');
                        xmlF.writeLine('"ProductPriority": ' + productArray[j][0].evalToString("priority") + ',');
                        xmlF.writeLine('"Rotation": "' + productArray[j][0].evalToString("rotation") + '",');
                        xmlF.writeLine('"Placed": ' + productArray[j][1] + ',');
                        xmlF.writeLine('"Total": ' + productArray[j][0].evalToString("total") + ',');
                        xmlF.writeLine('"Overrun": ' + productArray[j][0].evalToString("overrun") + '');
                        
                        if(j != productArray.length-1){
                            xmlF.writeLine('},');
                        }else{
                            xmlF.writeLine('}');
                        }
                    }
                    
                    xmlF.writeLine(']');	
                    if(i != layoutNodes.length-1){
                        xmlF.writeLine('},');
                    }else{
                        xmlF.writeLine('}');
                    }
                }
                //end layout loop
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
                    
            job.sendTo(findConnectionByName(s, "Success"), job.getPath());          
            
        }catch(e){
            s.log(2, "Critical Error: Post-Phoenix")
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