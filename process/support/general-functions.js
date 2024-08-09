connectToDatabase_db = function(database){
	var dbConn = new DataSource();
		dbConn.connect(database,"bret.c","e4gPM^VJ(3t/K?D/");
	
	if(dbConn.isConnected()){
		return dbConn;
	}else{
		s.log(2, "Connection to " + database + " failed!");
		return;
	}
}

redownloadFrom = function(value, submit){
	if(value == "S3 Bucket"){
		submit.override.redownload.bool = true
		submit.override.redownload.location = "S3 Bucket"
		return submit
	}

	if(value == "Watermark Drive"){
		submit.override.redownload.bool = true
		submit.override.redownload.location = "Watermark Drive"
		return submit
	}

	// If no then return defaults.
	submit.override.redownload.bool = false
	submit.override.redownload.location = null
	return submit
}

getFileSource = function(value){
	if(value == "1"){
		return "Watermark Drive"
	}

	if(value == "2"){
		return "S3 Bucket"
	}

	// If no entry then return watermark drive as default.
	return "Watermark Drive"
}

getDirectory = function(path){
	var directory = {}	
	var sample = path.split("/").reverse()
	var segment = sample.length
	var newPath = []

	while(segment>0){
		newPath.push(sample[segment-1])
		directory.path = newPath.join('/');
		directory.dir = new Dir(directory.path);

		if(!directory.dir.exists){
			directory.dir.mkdir(directory.path)
		}
		segment--
	}

	return directory
}

loadDataset_db = function(dataset){
    var datasetJob = job.getDataset(dataset);
	if (datasetJob === undefined || !datasetJob.hasValidData()) {
		job.fail("Missing " + dataset);
		return "Dataset Missing"
	}
	var datasetDoc = new Document(datasetJob.getPath());
    
    return datasetDoc
}

loadDatasetNoFail_db = function(dataset){
    var datasetJob = job.getDataset(dataset);
	if (datasetJob === undefined || !datasetJob.hasValidData()) {
		//job.fail("Missing " + dataset);
		return "Dataset Missing"
	}
	var datasetDoc = new Document(datasetJob.getPath());
    
    return datasetDoc
}

contains = function(a, object) {
	var i = a.length;
	while (i--) {
	   if (a[i] == object) {
		   return true;
	   }
	}
	return false;
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
		
		addNode_db(theXML, infoNode, "gangNumber", data.gangNumber);
		addNode_db(theXML, infoNode, "projectNotes", data.projectNotes);

	if(matInfo != "Material Data Missing" && matInfo != null){
		addNode_db(theXML, infoNode, "process", data.prodName);
		addNode_db(theXML, infoNode, "subprocess", data.subprocess);
		addNode_db(theXML, infoNode, "paper", data.paper);
	}
		
	var messageNode = theXML.createElement("message", null);
		baseNode.appendChild(messageNode);
		
		addNode_db(theXML, messageNode, "subject", message.subject);
		addNode_db(theXML, messageNode, "body", message.body);
		addNode_db(theXML, messageNode, "to", message.to);
		addNode_db(theXML, messageNode, "cc", message.cc);
		addNode_db(theXML, messageNode, "bcc", message.bcc);
		
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