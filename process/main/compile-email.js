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

            // Establist connection to the databases
            var connections = establishDatabases(s)
            var db = {
                general: new Statement(connections.general),
                email: new Statement(connections.email)
            }

            // Collect the handoff data.
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                sku: handoffDataDS.evalToString("//base/sku"),
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
                subject: "Gang Summary: " + handoffData.projectID,
                header: "",
                removed: [],
                submit: [],
                notes: [],
                to: handoffData.user.email,
                cc: "",
                bcc: "bret.c@digitalroominc.com"
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
            db.email.execute("SELECT * FROM emails.`parsed_data` WHERE sku = '" + handoffData.sku + "' and `gang-number` = '" + handoffData.projectID + "';");

            // If the database pull fails, send an email to notify.
            if(!db.email.isRowAvailable()){
                email.notes += "Failed to get gang summary info from database.";
                createEmail(s, email, handoffData);
                job.sendToNull(job.getPath())
                return;
            }

            // Loop through those notes and add them to the body string.
            while(db.email.isRowAvailable()){
                db.email.fetchRow();
                var result = {
                    itemNumber: db.email.getString(3),
                    source: db.email.getString(5),
                    message: db.email.getString(6),
                    type: db.email.getString(7).toLowerCase()
                }

                email[result.type].push([result.itemNumber,result.message])
            }

            // Clean the email.notes array of any items that are also removed.
            for(var k in email.removed){
                var h = email.notes.length
                while(h--){
                    if(email.removed[k][0] == email.notes[h][0]){
                        email.notes.splice(h,1);
                        email.removed[k][1] += " " + email.notes[h][1];
                    }
                }
            }

            // Send the compiled email.
            createEmail(s, email, handoffData)

            // Send the job to be approved.
            job.sendToNull(job.getPath())
            
        }catch(e){
            s.log(2, "Critical Error: Compile Email")
            job.sendToNull(job.getPath())
        }
    }
    email(s, job)
}

createEmail = function(s,  email, handoffData){
	var emailXml = s.createNewJob();
	var emailXmlPath = emailXml.createPathWithName(handoffData.projectID + ".txt", false);
	var emailXmlFile = new File(emailXmlPath);
    //var emailXmlFile = new File("C://Switch//Development//test.txt");
	
		emailXmlFile.open(File.Append);
		emailXmlFile.writeLine(email.subject);
		emailXmlFile.close()
	
	createDataset(emailXml, email);
	
	emailXml.sendTo(findConnectionByName_db(s, "Email"), emailXmlPath);
}

createDataset = function(newXML, email){
	var theXML = new Document();
	
	var baseNode = theXML.createElement("email", null);
		theXML.appendChild(baseNode);
		
	var messageNode = theXML.createElement("message", null);
		baseNode.appendChild(messageNode);
		
		addNode_db(theXML, messageNode, "subject", email.subject);
        addNode_db(theXML, messageNode, "header", email.header);

        for(var notes in email.notes){
            addNode_db(theXML, messageNode, "notes", email.notes[notes][0] + ": " + email.notes[notes][1] + "\n");
        }

        for(var removed in email.removed){
            addNode_db(theXML, messageNode, "removed", email.removed[removed][0] + ": " + email.removed[removed][1] + "\n");
        }

        for(var submit in email.submit){
            addNode_db(theXML, messageNode, "submit", email.submit[submit][0] + ": " + email.submit[submit][1] + "\n");
        }
        //addNode_db(theXML, messageNode, "notes", email.notes);
		//addNode_db(theXML, messageNode, "removed", email.removed);
        //addNode_db(theXML, messageNode, "submit", email.submit);
		addNode_db(theXML, messageNode, "to", email.to);
		addNode_db(theXML, messageNode, "cc", email.cc);
        addNode_db(theXML, messageNode, "bcc", email.bcc);
	
	var theDataset = newXML.createDataset("XML");
	
	var theXMLFilename = theDataset.getPath();
		theXML.save(theXMLFilename);
	
		newXML.setDataset("Email", theDataset);
}