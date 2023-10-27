compileEmail = function(s, job){
    function email(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));

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
                }
            }
            
            // Collect the phoenix plan data.
            var phoenixPlanDS = loadDataset_db("Phoenix Plan");
            var phoenixPlan = {
                id: phoenixPlanDS.evalToString("//job/id"),
                averageUsage: Math.round(phoenixPlanDS.evalToString("//job/sheet-usage",null) * 100)
            }

            // Create the email object and set some of the known parameters.
            var email = {
                subject: "Gang Summary: " + handoffData.projectID,
                header: "",
                body: "",
                to: handoffData.user.email,
                cc: "",
                bcc: "bret.c@digitalroominc.com"
            }

            // Assign the header proerties.
            email.header += "Process: " + handoffData.process + "\n";
            email.header += "Subprocess: " + handoffData.subprocess + "\n";
            email.header += "Due Date: " + handoffData.dueDate + "\n";
            email.header += "Facility: " + handoffData.facility + "\n";

            // Pull any notes from the email table.
            db.email.execute("SELECT * FROM emails.`parsed_data` WHERE sku = '" + handoffData.sku + "' and `gang-number` = '" + handoffData.projectID + "';");
            if(!db.email.isRowAvailable()){
                s.log(2, "Unavailable")
            }

            // Loop through those notes and add them to the body string.
            while(db.email.isRowAvailable()){
                db.email.fetchRow();
                var result = {
                    itemNumber: db.email.getString(3),
                    source: db.email.getString(5),
                    message: db.email.getString(6)
                }
                email.body += result.itemNumber + ": " + result.message + "\n"
            }

            // Send the compiled email.
            sendEmail(s, email)

            // Send the job to be approved.
            job.sendToNull(job.getPath())
            
        }catch(e){
            s.log(2, "Critical Error: Compile Email")
            job.sendToNull(job.getPath())
        }
    }
    email(s, job)
}

sendEmail = function(s,  email){
	var emailXml = s.createNewJob();
	var emailXmlPath = emailXml.createPathWithName("Email.txt", false);
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
		addNode_db(theXML, messageNode, "body", email.body);
		addNode_db(theXML, messageNode, "to", email.to);
		addNode_db(theXML, messageNode, "cc", email.cc);
        addNode_db(theXML, messageNode, "bcc", email.bcc);
		
        /*
	if(userInfo != null){
		var userNode = theXML.createElement("user", null);
			baseNode.appendChild(userNode);
			
			addNode_db(theXML, userNode, "first", userInfo.first);
			addNode_db(theXML, userNode, "last", userInfo.last);
			addNode_db(theXML, userNode, "email", userInfo.email);
			addNode_db(theXML, userNode, "folder", userInfo.dir);
	}
    */
	
	var theDataset = newXML.createDataset("XML");
	
	var theXMLFilename = theDataset.getPath();
		theXML.save(theXMLFilename);
	
		newXML.setDataset("Email", theDataset);
}