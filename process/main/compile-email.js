compileEmail = function(s, job){
    function email(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));
            eval(File.read(dir.support + "/write-to-email-db.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));
            eval(File.read(dir.support + "/sql-statements.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

            // Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                general: new Statement(connections.general),
                email: new Statement(connections.email)
            }

            // Collect the handoff data.
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                gangNumber: handoffDataDS.evalToString("//base/gangNumber"),
                process: handoffDataDS.evalToString("//base/process"),
                subprocess: handoffDataDS.evalToString("//base/subprocess"),
                dueDate: handoffDataDS.evalToString("//base/dueDate"),
                facility: handoffDataDS.evalToString("//misc/facility"),
                user: {
                    first: handoffDataDS.evalToString("//user/first"),
                    email: handoffDataDS.evalToString("//user/email")
                },
                products: handoffDataDS.evalToNodes("//handoff/products/product")
            }

            // Create the email object and set some of the known parameters.
            var email = {
                subject: "Gang Summary: " + handoffData.gangNumber,
                header: "",
                to: handoffData.user.email,
                cc: "",
                bcc: ""
            }

            var body = {
                impInst: "",
                summary: "",
                removed: ""
            }

            // Assign the header proerties.
            email.header += "Process: " + handoffData.process + "\n";
            email.header += "Subprocess: " + handoffData.subprocess + "\n";
            email.header += "Due Date: " + handoffData.dueDate + "\n";
            email.header += "Facility: " + handoffData.facility + "\n";

            // If the job was successfully ganged by Phoenix, collect the data and write it to the database.
            if(job.getJobState() == "Ganged"){
                email.header += "\nStatus: Ganged Successfully!" + "\n";
                // Collect the phoenix plan data.
                var phoenixPlanDS = loadDataset_db("Phoenix Plan");
                var phoenixPlan = {
                    id: phoenixPlanDS.evalToString("//job/id"),
                    averageUsage: Math.round(phoenixPlanDS.evalToString("//job/sheet-usage",null) * 100),
                    products: phoenixPlanDS.evalToNodes("//job/products/product")
                }

                var entry = []

                // Loop through the handoff and planned data, looking for what Phoenix didn't gang.
                for(var i=0; i<handoffData.products.length; i++){
                    var match = false;
                    for(var j=0; j<phoenixPlan.products.length; j++){
                        if(handoffData.products.getItem(i).evalToString('contentFile') == phoenixPlan.products.getItem(j).evalToString('name')){
                            match = true;
                            break;
                        }
                    }
                    if(!match){
                        entry.push([handoffData.products.getItem(i).evalToString('itemNumber'),"Removed","This file was not ganged by Phoenix."])
                    }
                }

                // Write the array to the table.
                emailDatabase_write(s, db, "parsed_data", "Phoenix", handoffData, entry)
            }else{
                email.header += "\nStatus: Failed in Phoenix!" + "\n";
            }

            // Pull any notes from the email table, including what was just posted.
            db.email.execute("SELECT * FROM emails.`parsed_data` WHERE `project-id` = '" + handoffData.projectID + "';");

            var entries = {};
            var raw = [];

            // Loop through those notes and add them to the body string.
            while(db.email.isRowAvailable()){
                db.email.fetchRow();
                var result = {
                    itemNumber: db.email.getString(3),
                    source: db.email.getString(5),
                    message: db.email.getString(6),
                    type: db.email.getString(7).toLowerCase()
                }

                raw.push([result.itemNumber,result.type,result.message])
            }

            // Create the objects and sub-arrays out of the raw data.
            for(var items in raw){
                entries[raw[items][0]] = {
                    removed: false,
                    notes: []
                }
            }

            // Push the data from the raw pull to the objects and sub-arrays.
            for(var results in raw){
                if(raw[results][1] == "removed"){
                    entries[raw[results][0]]["removed"] = true
                }
                entries[raw[results][0]]["notes"].push(raw[results][2]);
            }

            // Sort the data from the sub-arrays into body strings.
            for(var item in entries){
                if(entries[item]["removed"]){
                    body.removed += item + ": " + entries[item]["notes"].join(', ') + "\n"
                }else{
                    body.summary += item + ": " + entries[item]["notes"].join(', ') + "\n"
                }
            }

            //Pull notes for impinst
            db.email.execute("SELECT * FROM emails.`impinst_notes` WHERE `project-id` = '" + handoffData.projectID + "';");

            while(db.email.isRowAvailable()){
                db.email.fetchRow();
                var result = {
                    itemNumber: db.email.getString(3),
                    message: db.email.getString(4)
                }
                body.impInst += result.itemNumber + ": " + result.message + "." + "\n"
            }

            if(body.impInst == ""){body.impInst = "None" + "\n"}
            if(body.summary == ""){body.summary = "None" + "\n"}
            if(body.removed == ""){body.removed = "None" + "\n"}

            // Send the compiled email.
            createEmail(s, email, handoffData, body)

            // Send the job to be approved.
            job.sendToNull(job.getPath())
            
        }catch(e){
            s.log(2, "Critical Error: Compile Email")
            job.sendToNull(job.getPath())
        }
    }
    email(s, job)
}

createEmail = function(s,  email, handoffData, body){
	var emailXml = s.createNewJob();
	var emailXmlPath = emailXml.createPathWithName(handoffData.gangNumber + ".txt", false);
	var emailXmlFile = new File(emailXmlPath);
    //var emailXmlFile = new File("C://Switch//Development//test.txt");
	
		emailXmlFile.open(File.Append);
		emailXmlFile.writeLine(email.subject);
		emailXmlFile.close()
	
	createDataset(emailXml, email, body);
	
	emailXml.sendTo(findConnectionByName_db(s, "Email"), emailXmlPath);
}

createDataset = function(newXML, email, body){
	var theXML = new Document();
	
	var baseNode = theXML.createElement("email", null);
		theXML.appendChild(baseNode);
		
	var messageNode = theXML.createElement("message", null);
		baseNode.appendChild(messageNode);
		
		addNode_db(theXML, messageNode, "subject", email.subject);
        addNode_db(theXML, messageNode, "header", email.header);

        addNode_db(theXML, messageNode, "impInst", body.impInst);
        addNode_db(theXML, messageNode, "summary", body.summary);
        addNode_db(theXML, messageNode, "removed", body.removed);

		addNode_db(theXML, messageNode, "to", email.to);
		addNode_db(theXML, messageNode, "cc", email.cc);
        addNode_db(theXML, messageNode, "bcc", email.bcc);
	
	var theDataset = newXML.createDataset("XML");
	
	var theXMLFilename = theDataset.getPath();
		theXML.save(theXMLFilename);
	
		newXML.setDataset("Email", theDataset);
}