//chelsea was here
runParser = function(s, job, codebase){
    function parser(s, job, codebase){
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/",
                subprocess: new Dir("C:/Scripts/" + codebase + "/switch/process/subprocess/"),
                phoenixMarks: new Dir("C:/Scripts/" + codebase + "/switch/process/phoenix marks/"),
                phoenixScripts: new Dir("C:/Scripts/" + codebase + "/switch/process/phoenix scripts/")
            }
            
            // Load in all of the supporting libraries and functions
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/get-itemdata.js"));
            eval(File.read(dir.support + "/get-next-shipdate.js"));
            eval(File.read(dir.support + "/get-ship-type.js"));
            eval(File.read(dir.support + "/info-material.js"));
            eval(File.read(dir.support + "/sku-generator.js"));
            eval(File.read(dir.support + "/email-responses.js"));
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/get-subprocess.js"));
            eval(File.read(dir.support + "/set-phoenix-marks.js"));
            eval(File.read(dir.support + "/set-phoenix-scripts.js"));
            eval(File.read(dir.support + "/add-to-table.js"));
            eval(File.read(dir.support + "/compile-csv-converter.js"));
            eval(File.read(dir.support + "/set-hem-labels.js"));
            eval(File.read(dir.support + "/set-product-labels.js"));
            eval(File.read(dir.support + "/write-to-email-db.js"));
            eval(File.read(dir.support + "/get-edge-finishing.js"));
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
                
            var localTime = new Date();
            var hourOffset = module.timezone == "AWS" ? 7 : 0;
            var hourAdjustment = localTime.getTime() - (3600000*hourOffset);
            var adjustedTime = new Date(hourAdjustment).toString();
                
            var now = {
                date: adjustedTime.split("T")[0],
                time: adjustedTime.split("T")[1],
                day: adjustedTime.split("T")[0].split("-")[2],
                month: adjustedTime.split("T")[0].split("-")[1],
                year: adjustedTime.split("T")[0].split("-")[0]
            }
            
            var orderArray = [];
            var matInfo = null;
            
            var doc = new Document(job.getPath());	
            var map = doc.createDefaultMap();

            var data = {
                projectID: skuGenerator_projectID(db),
                gangNumber: doc.evalToString('//*[local-name()="Project"]/@ProjectID', map),
                projectNotes: doc.evalToString('//*[local-name()="Project"]/@Notes', map),
                environment: module.localEnvironment,
                fileSource: module.fileSource,
                repository: "//10.21.71.213/File Repository/"
            }

            var layout = {
                stock: null
            }

            // Add the gang info to the table
            db.history.execute(generateSqlStatement_Insert(s, "history.converter_gang", [
                ["project-id",data.projectID],
                ["gang-number",data.gangNumber]
            ]));

            // Add the gang info to the table
            s.log(2, generateSqlStatement_Insert(s, "history.converter_gang", [
                ["project-id",data.projectID],
                ["gang-number",data.gangNumber]
            ]));
            
            var theNewToken = getNewToken(s, data.environment);
            
            var watermarkDrive = "T://watermarked-files";
            if(data.environment == "QA"){
                watermarkDrive = "Q://watermarked-files";
            }

            var userInfo = {
                first: db.settings.getString(1),
                last: db.settings.getString(2),
                email: db.settings.getString(3),
                dir: db.settings.getString(4) == null ? "Unknown User" : db.settings.getString(1) + " " + db.settings.getString(2) + " - " + db.settings.getString(4),
                fileSource: getFileSource(db.settings.getString(9))
            }
                
            // Loop through the items, pull the data from the API, then post it to the array.
            var productList = doc.evalToNodes('//*[local-name()="Product"]', map);
            for(var i=0; i<productList.length; i++){
                
                var node = productList.getItem(i);

                var orderSpecsAPI = pullApiInformation(s, node.getAttributeValue('ID'), theNewToken, data.environment, db, data, userInfo);

                var orderSpecs = {
                    orderNumber: node.getAttributeValue('Name'),
                    itemNumber: node.getAttributeValue('ID'),
                    name: node.getAttributeValue('ContentFile').split('\\'),
                    artworkFile: node.getAttributeValue('ContentFile'),
                    width: node.getAttributeValue('FinishedTrimWidth'),
                    height: node.getAttributeValue('FinishedTrimHeight'),
                    quantity: node.getAttributeValue('RequiredQuantity'),
                    notes: node.getAttributeValue('Notes'),
                    stock: orderSpecsAPI.paper.value.replace(/\,/g,'').toString()
                }

                // Once compiled, push to working array.
                orderArray.push(orderSpecs);
            }
                
            // Create the CSV and the new Job() for the project.
            var newCSV = s.createNewJob();
            var csvPath = newCSV.createPathWithName(data.gangNumber + ".csv", false);
            var csvFile = new File(csvPath);
                csvFile.open(File.Append);
                
            var writeHeader = true;
        
            // Loop through the approved files in the array.
            for(var i=0; i<orderArray.length; i++){
             
                // Product level data.
                var product = {
                    name: orderArray[i].name[orderArray[i].name.length-1],
                    artworkFile: orderArray[i].artworkFile,
                    orderNumber: orderArray[i].orderNumber,
                    itemNumber: orderArray[i].itemNumber,
                    quantity: orderArray[i].quantity,
                    width: orderArray[i].width,
                    height: orderArray[i].height,
                    stock: orderArray[i].stock,
                    bleed:{
                        type:"Margins",
                        base:".0625"
                    }
                }

                // This is a temporary fix, this needs to happen at a layout level.
                if(layout.stock == null){
                    layout.stock = orderArray[i].stock;
                }
                
                /*
                // Gather the source file options
                var file = {
                    source: new File(watermarkDrive + "/" + product.contentFile),
                    //depository: new File("//10.21.71.213/pdfDepository/" + product.contentFile),
                    depository: new File("//10.21.71.213/File Repository/" + product.contentFile),
                    usableData: false
                }
                    
                // Do we need to transfer the file from the depository?
                if(file.depository.exists){
                    if(submit.override.redownload.bool){
                        try{
                            file.depository.remove();
                            s.log(2, product.contentFile + " removed successfully, redownloading.")
                        }catch(e){
                            s.log(2, product.contentFile + " failed to delete.")
                        }
                        product.transfer = true;
                    }
                }else{
                    if(data.fileSource == "S3 Bucket"){
                        product.transfer = true;
                    }else{
                        if(file.source.exists){
                            product.transfer = true;
                        }else{
                            data.notes.push([product.itemNumber,"Notes","File missing: " + product.contentFile]);
                            continue;
                        }
                    }
                }
                */
                
                // Compile the data into an array.
                var infoArray = compileCSV(product, matInfo, orderArray[i], data);

                // Write the compiled data into the CSV.
                if(writeHeader){
                    writeCSV(s, csvFile, infoArray, 0);
                    writeHeader = false;
                }
                    writeCSV(s, csvFile, infoArray, 1);
                    
                /*
                // Create the xml to inject the file into the flow.
                if(product.transfer){
                    var injectXML = s.createNewJob();
                    var injectPath = injectXML.createPathWithName(product.contentFile.split('.pdf')[0] + ".xml", false);
                    var injectFile = new File(injectPath);
                    
                    injectXML.setUserEmail(userInfo.email);
                    
                    createDataset(s, injectXML, data, matInfo, true, product, orderArray[i], userInfo, false, now);
                    
                    writeInjectJSON(injectFile, orderArray[i], product);
                    
                    injectXML.setHierarchyPath([data.environment,userInfo.dir]);
                    injectXML.setPriority(submit.override.priority)
                    injectXML.sendTo(findConnectionByName_db(s, "Inject XML"), injectPath);
                }
                */

                db.history.execute(generateSqlStatement_Insert(s, "history.converter_item", [
                    ["project-id", data.projectID],
                    ["gang-number", data.gangNumber],
                    ["order-number", product.orderNumber],
                    ["item-number", product.itemNumber],
                    ["notes", orderArray[i].notes],
                    ["status", "Initiated"]
                ]));

                if(s.getServerName() == 'Switch-Dev'){
                    if(i>=49){
                        break;
                    }
                }
            }
            
            csvFile.close();
        
            //newCSV.setHierarchyPath([data.environment,data.sku]);
            newCSV.setUserEmail(job.getUserEmail());
            newCSV.setUserName(job.getUserName());
            newCSV.setUserFullName(job.getUserFullName());
            //newCSV.setPriority(submit.override.priority);
            newCSV.sendTo(findConnectionByName_db(s, "CSV"), csvPath);

            job.sendToNull(job.getPath())

            db.history.execute(generateSqlStatement_Update(s, "history.converter_gang", [
                ["project-id", data.projectID]
            ],[
                ["notes",data.projectNotes],
                ["press","PressName"],
                ["prism-stock",layout.stock],
                ["status","Parse Complete"]
            ]))
                        
        }catch(e){
            s.log(3, "Critical Error!: " + e);
            job.setPrivateData("error",e);
            job.sendTo(findConnectionByName_db(s, "Critical Error"), job.getPath());
        }
    }
    parser(s, job, codebase)
}

// -------------------------------------------------------

function compareToFile(s, expected, actual, product, scale, axis, type){
    var scales = [1,2,4,10]
    for(var k in scales){
        if(expected == round(actual*scales[k])){
            scale.check[axis][type] = scales[k]
            product.orientation[axis][type] = true
            return
        }
    }
    return false
}

// -------------------------------------------------------

function writeCSV(s, file, array, index){
	for(var n=0; n<array.length; n++){
		file.write(array[n][index]);
		if(n != array.length-1){
			file.write(";");
		}
	}
	file.writeLine("")
}

// -------------------------------------------------------

function writeInjectXML(file, product){
	file.open(File.Append);
	file.writeLine('<?xml version="1.0" encoding="UTF-8"?>');
	file.writeLine("<inject>");
		
	writeXmlLine(file, "inject", product.contentFile);
		
	file.writeLine ("</inject>");
	file.close();
}

function round(x){
    return Math.round((x) * 100) / 100;
}

// -------------------------------------------------------

function writeInjectJSON(file, orderArray, product){
	file.open(File.Append);
	file.writeLine("{");
		
	file.writeLine('"file_id" : "' +  orderArray.fileID + '",');
	file.writeLine('"filename" : "' +  product.contentFile + '"');
		
	file.writeLine ("}");
	file.close();
}

// -------------------------------------------------------

function writeXmlLine(xmlFile, xmlLabel, xmlVariable){
    xmlFile.write("<" + xmlLabel + ">");
    xmlFile.write(xmlVariable);
    xmlFile.writeLine("</" + xmlLabel + ">");
}