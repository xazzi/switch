runParser = function(s, job){
    function parser(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/",
                subprocess: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/subprocess/"),
                phoenixMarks: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/phoenix marks/"),
                phoenixScripts: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/phoenix scripts/")
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
            eval(File.read(dir.support + "/compile-csv.js"));
            eval(File.read(dir.support + "/set-hem-labels.js"));
            eval(File.read(dir.support + "/set-product-labels.js"));
            eval(File.read(dir.support + "/write-to-email-db.js"));
            eval(File.read(dir.support + "/get-edge-finishing.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

            // Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                general: new Statement(connections.general),
                history: new Statement(connections.history),
                email: new Statement(connections.email)
            }

            var submitDS
                submitDS = loadDataset_db("Submit");
                if(submitDS == "Dataset Missing"){
                    job.sendTo(findConnectionByName_db(s, "Critical Error"), job.getPath());
                    return
                }
            
            var submit = {
                nodes: submitDS.evalToNodes("//field-list/field"),
                type: null,
                facility: null,
                coating: null,
                cutter: null
            }
                
            for(var i=0; i<submit.nodes.length; i++){
                if(submit.nodes.getItem(i).evalToString('tag') == "Type"){
                    submit.type = submit.nodes.getItem(i).evalToString('value');
                }
                if(submit.nodes.getItem(i).evalToString('tag') == "Facility"){
                    submit.facility = submit.nodes.getItem(i).evalToString('value');
                }
                if(submit.nodes.getItem(i).evalToString('tag') == "Cutter"){
                    submit.cutter = submit.nodes.getItem(i).evalToString('value');
                }
                if(submit.nodes.getItem(i).evalToString('tag') == "Coating"){
                    submit.coating = submit.nodes.getItem(i).evalToString('value');
                }
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

            var inputCSV = {}
                inputCSV.file = new File(job.getPath());
                inputCSV.file.open(File.ReadOnly);

            var index = getColumnIndex(s, inputCSV)

            var masterObject = {}
            var substrate
            var type = submit.type
            var cutter = "Generic"
            var coating = "Merged"
            var regex = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/

            while(!inputCSV.file.eof){
                var line = inputCSV.file.readLine();
                    line = line.toString().split(regex);
                    
                if(line[index.gangByDate] == ""){
                    break;
                }

                // Type logic
                if(submit.type == "Auto"){
                    if(line[index.type] == "OFF"){
                        type = "Offset"
                    }
                    if(line[index.type] == "DIGI"){
                        type = "Digital"
                    }
                }

                // Cutter logic
                if(submit.cutter == "Duplo/Highcon Logic"){
                    if(line[index.qty] >= 251){
                        cutter = "Highcon"
                    }
                    if(line[index.qty] < 250){
                        cutter = "Duplo"
                    }
                }

                // Coating logic
                if(submit.coating == "Auto"){
                    coating = line[index.coating]
                }

                var facility = line[index.facility].replace(/\ /g,'').toLowerCase()
                    if(facility == "vannuys"){facility = "VN"}
                    if(facility == "saddlebrook"){facility = "SB"}
                    if(facility == "arlington"){facility = "ARL"}
                    if(facility == "cleveland"){facility = "CLE"}

                    if(submit.facility == "Merge"){
                        facility = "All"
                    }

                var month = line[index.gangByDate].split('/')[0]
                var date = line[index.gangByDate].split('/')[1]
                substrate = line[index.substrate].replace(/[ .]/g, '')

                // Check if the facility object exists
                if(!(facility in masterObject)){
                    masterObject[facility] = {};
                }

                // Check if the facility object exists
                if(!(type in masterObject[facility])){
                    masterObject[facility][type] = {};
                }

                // Check if the month object exists
                if(!(cutter in masterObject[facility][type])){
                    masterObject[facility][type][cutter] = {};
                }

                // Check if the month object exists
                if(!(coating in masterObject[facility][type][cutter])){
                    masterObject[facility][type][cutter][coating] = {};
                }

                // Check if the month object exists
                if(!(month in masterObject[facility][type][cutter][coating])){
                    masterObject[facility][type][cutter][coating][month] = {};
                }

                // Check if the date array exists.
                if((typeof masterObject[facility][type][cutter][coating][month][date] === "undefined")){
                    masterObject[facility][type][cutter][coating][month][date] = [];
                }

                masterObject[facility][type][cutter][coating][month][date].push(line)

            }

            //s.log(2, JSON.parse(masterObject))

            for(var facility in masterObject){
                for(var type in masterObject[facility]){
                    for(var cutter in masterObject[facility][type]){
                        for(var coating in masterObject[facility][type][cutter]){
                            for(var month in masterObject[facility][type][cutter][coating]){
                                for(var date in masterObject[facility][type][cutter][coating][month]){

                                    // Create the CSV and the new Job() for the project.
                                    var outputCSV = {}
                                        outputCSV.job = s.createNewJob();
                                        outputCSV.path = outputCSV.job.createPathWithName(substrate + "_" + facility + "-" + type + "_" + month + "-" + date + ".csv", false);
                                        outputCSV.file = new File(outputCSV.path);
                                        outputCSV.file.open(File.Append);

                                    var sku = skuGeneratorSim(8, null);

                                    var writeHeader = true;

                                    for(var item in masterObject[facility][type][cutter][coating][month][date]){
                                        var entry = masterObject[facility][type][cutter][coating][month][date][item]
                                        
                                        if(entry[index.size] == "Custom"){
                                            continue;
                                        }

                                        var size = {
                                            width: entry[index.size] == "Size" ? null : entry[index.size].replace(/\"/g,'').match(/(?:#?\d+\s*)?\(([\d.]+)\s*x\s*([\d.]+)\)|([\d.]+)\s*x\s*([\d.]+)/).replace(/\ /g,'').split('x')[0],
                                            height: entry[index.size] == "Size" ? null : entry[index.size].replace(/\"/g,'').match(/(?:#?\d+\s*)?\(([\d.]+)\s*x\s*([\d.]+)\)|([\d.]+)\s*x\s*([\d.]+)/).replace(/\ /g,'').split('x')[1]
                                        }

                                        /*
                                        var size = {
                                            width: entry[index.size] == "Size" ? null : entry[index.size].replace(/\ /g,'').split('(')[0].split('x')[0],
                                            height: entry[index.size] == "Size" ? null : entry[index.size].replace(/\ /g,'').split('(')[0].split('x')[1]
                                        }
                                            */
                                        
                                        var newLine = [
                                            ["Name",entry[index.jobItemId]],
                                            ["Ordered",entry[index.qty].replace(/[",]/g,'').split('.')[0]],
                                            ["Stock","Simulation_" + type],
                                            ["Spacing Type","Margins"],
                                            ["Spacing",".125"],
                                            ["Bleed Type","Contour"],
                                            ["Bleed",".125"],
                                            ["Rotation","Orthogonal"],
                                            ["Width",size.width.replace(/"/g,'')],
                                            ["Height",size.height.replace(/"/g,'')],
                                            ["Shape Search","Largest"],
                                            ["Page Handling","OnePerTwoPages"],
                                            ["Min Overruns","0"],
                                            ["Max Overruns","100"]
                                        ];

                                        if(writeHeader){
                                            writeCSV(s, outputCSV.file, newLine, 0);
                                            writeHeader = false;
                                        }

                                        writeCSV(s, outputCSV.file, newLine, 1);
                                    }

                                    outputCSV.file.close()
                                    outputCSV.job.setJobState(cutter)
                                    createDataset(s, outputCSV, type, now, facility, month, date, substrate, cutter, coating, sku);
                                    outputCSV.job.sendTo(findConnectionByName_db(s, "Ready"), outputCSV.path);
                                }
                            }
                        }
                    }
                }
            }

            inputCSV.file.close()
            job.sendToNull(job.getPath())

        }catch(e){
            s.log(3, "Critical Error!: " + e);
            job.setPrivateData("error",e);
            job.sendTo(findConnectionByName_db(s, "Critical Error"), job.getPath());
        }
    }
    parser(s, job)
}

// -------------------------------------------------------

function getColumnIndex(s, inputCSV){

    var index = {}

    var line = inputCSV.file.readLine();
        line = line.replace(/\"/g,' ');
        line = line.split(',');

    // Find the index of the columns
    for(var j in line){
        if(line[j] == "Website"){
            index.website = j
        }
        if(line[j] == "Job Order ID"){
            index.jobOrderId = j
        }
        if(line[j] == "Job Item ID"){
            index.jobItemId = j
        }
        if(line[j] == "Account Type"){
            index.type = j
        }
        if(line[j] == "Product ID"){
            index.productId = j
        }
        if(line[j] == "Product Name"){
            index.productName = j
        }
        if(line[j] == "product Item"){
            index.productItem = j
        }
        if(line[j] == "Facility"){
            index.facility = j
        }
        if(line[j] == "Due Date"){
            index.dueDate = j
        }
        if(line[j] == "Approved Date"){
            index.approvedDate = j
        }
        if(line[j] == "Gang By Date"){
            index.gangByDate = j
        }
        if(line[j] == "Fulfilled Date"){
            index.fulfilledDate = j
        }
        if(line[j] == "Price"){
            index.price = j
        }
        if(line[j] == "Item Discount"){
            index.itemDiscount = j
        }
        if(line[j] == "Shipping"){
            index.shipping = j
        }
        if(line[j] == "Item Sale"){
            index.itemSale = j
        }
        if(line[j] == "Qty"){
            index.qty = j
        }
        if(line[j] == "Size"){
            index.size = j
        }
        if(line[j] == "Diecut"){
            index.diecut = j
        }
        if(line[j] == "Fold"){
            index.fold = j
        }
        if(line[j] == "Bind"){
            index.bind = j
        }
        if(line[j] == "Substrate"){
            index.substrate = j
        }
        if(line[j] == "Coating"){
            index.coating = j
        }
        if(line[j] == "Lamination"){
            index.lamination = j
        }
        if(line[j] == "Shape"){
            index.shape = j
        }
        if(line[j] == "Side"){
            index.side = j
        }
        if(line[j] == "Standard Flag"){
            index.standardFlag = j
        }
    }
    return index
}

function createDataset(s, outputCSV, type, now, facility, month, date, substrate, cutter, coating, sku){
	
	var theXML = new Document();

	var handoffNode = theXML.createElement("handoff", null);
		theXML.appendChild(handoffNode);
	
	var baseNode = theXML.createElement("settings", null);
		handoffNode.appendChild(baseNode);
		
        addNode_db(theXML, baseNode, "sku", sku);
        addNode_db(theXML, baseNode, "substrate", substrate);
		addNode_db(theXML, baseNode, "type", type);
        addNode_db(theXML, baseNode, "cutter", cutter);
        addNode_db(theXML, baseNode, "coating", coating);
        addNode_db(theXML, baseNode, "facility", facility);
        addNode_db(theXML, baseNode, "month", month);
        addNode_db(theXML, baseNode, "date", date);
	
	var theDataset = outputCSV.job.createDataset("XML");
	var theXMLFilename = theDataset.getPath();
		theXML.save(theXMLFilename);
	
		outputCSV.job.setDataset("Handoff Data", theDataset);
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