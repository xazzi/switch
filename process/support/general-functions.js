connectToDatabase_db = function(database){
	// This is the property to pass into the function when calling.
	// s.getPropertyValue("database")

	var dbConn = new DataSource();
		dbConn.connect(database,"bret.c","e4gPM^VJ(3t/K?D/");
	
	if(dbConn.isConnected()){
		//s.log(2, "Connected to " + database + ".");
		return dbConn;
	}else{
		s.log(2, "Connection to " + database + " failed!");
		return;
	}
}

loadDataset_db = function(dataset){
    var datasetJob = job.getDataset(dataset);
	if (datasetJob === undefined || !datasetJob.hasValidData()) {
		job.fail("Missing " + dataset);
		return;
	}
	var datasetDoc = new Document(datasetJob.getPath());
    
    return datasetDoc
}

findConnectionByName_db = function(s, inName){
	function findConnection(s, inName){
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
	return contents = findConnection(s, inName)
}

sendEmail_db = function(s, data, matInfo, message, userInfo){
	var emailXml = s.createNewJob();
	var emailXmlPath = emailXml.createPathWithName("Email.txt", false);
	var emailXmlFile = new File(emailXmlPath);
	
		emailXmlFile.open(File.Append);
		emailXmlFile.writeLine("Subject-----\n" + message.subject);
		emailXmlFile.writeLine("Body-----\n" + message.body);
		emailXmlFile.writeLine("To-----\n" + message.to);
		emailXmlFile.close()
	
	createDataset_Email_db(emailXml, data, matInfo, message, userInfo);
	
	emailXml.sendTo(findConnectionByName_db(s, "Email"), emailXmlPath);
}

createDataset_Email_db = function(newXML, data, matInfo, message, userInfo){
	var theXML = new Document();
	
	var baseNode = theXML.createElement("email", null);
		theXML.appendChild(baseNode);
	
	var infoNode = theXML.createElement("info", null);
		baseNode.appendChild(infoNode);
		
		addNode_db(theXML, infoNode, "projectID", data.projectID);
		addNode_db(theXML, infoNode, "projectNotes", data.projectNotes);

	if(matInfo != "Material Data Missing" && matInfo != null){
		addNode_db(theXML, infoNode, "process", matInfo.prodName);
		addNode_db(theXML, infoNode, "subprocess", matInfo.subprocess);
		addNode_db(theXML, infoNode, "paper", data.paper);
	}
		
	var messageNode = theXML.createElement("message", null);
		baseNode.appendChild(messageNode);
		
		addNode_db(theXML, messageNode, "subject", message.subject);
		addNode_db(theXML, messageNode, "body", message.body);
		addNode_db(theXML, messageNode, "to", message.to);
		addNode_db(theXML, messageNode, "cc", message.cc);
		
	if(userInfo != null){
		var userNode = theXML.createElement("user", null);
			baseNode.appendChild(userNode);
			
			addNode_db(theXML, userNode, "first", userInfo.first);
			addNode_db(theXML, userNode, "last", userInfo.last);
			addNode_db(theXML, userNode, "email", userInfo.email);
			addNode_db(theXML, userNode, "folder", userInfo.dir);
	}
	
	var theDataset = newXML.createDataset("XML");
	
	var theXMLFilename = theDataset.getPath();
		theXML.save(theXMLFilename);
	
		newXML.setDataset("Email", theDataset);
}

addNode_db = function(theXML, parent, name, value){
	function createNode(theXML, parent, name, value){
		var theNodeName = theXML.createElement(name, null);
			parent.appendChild(theNodeName);
		
		var theNodeValue = theXML.createText(value);
			theNodeName.appendChild(theNodeValue);
	}
	createNode(theXML, parent, name, value)
}