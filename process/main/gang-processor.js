gangProcessor = function(s, codebase){
    function run(s, codebase){
		var db
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
			eval(File.read(dir.support + "/connect-to-db.js"));
			eval(File.read(dir.support + "/load-module-settings.js"));
			eval(File.read(dir.support + "/sql-statements.js"));
			eval(File.read(dir.support + "/webhook-post.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

			// Establist connection to the databases
            var connections = establishDatabases(s, module)
            db = {
                settings: new Statement(connections.settings),
				history: new Statement(connections.history),
                email: new Statement(connections.email)
            }

			var secondInterval = 30;
                s.setTimerInterval(secondInterval);

			var processorQueue = new Dir("C:/Switch/Depository/processorQueue/" + module.localEnvironment);
			var processorQueueFiles = processorQueue.entryList("*.xml", Dir.Files, Dir.Name);

			// Loop through the XML files found in the Processor Queue
			for (var k = 0; k < processorQueueFiles.length; k++) {
				var projectId = processorQueueFiles[k].split('.')[0]
				var sourceFile = new File(processorQueue.absPath + "/" + processorQueueFiles[k]);

				// Establish the data for the XML to read in.
				var doc = new Document(processorQueue.absPath + "/" + processorQueueFiles[k]);	
				var map = doc.createDefaultMap();
				var phoenixPlan = {
					gangNumber: doc.evalToString('//job/id'),
					layoutNodes: doc.evalToNodes('//job/layouts/layout', map),
					productNodes: doc.evalToNodes('//job/products/product', map)
				}

				// Query the details_gang table for relevant info.
				db.history.execute("SELECT * FROM history.`details_gang` WHERE `project-id` = '" + projectId + "';");
				if (!db.history.isRowAvailable()) {
					// Post to the webhook that we have an anomaly.
					postWebhook(s, null, db, "Critical Error", "Data missing from details_gang.", [
						["Error", "Gang data missing."]
					]);
					continue
				}

				// Pull the data down.
				db.history.fetchRow()

				// Establish some data from the details_gang table.
				var tableData = {
					process: db.history.getString(4),
					user: db.history.getString(15),
					status: db.history.getString(16),
					file: phoenixPlan.gangNumber + " (" + projectId + ")"
				}

				// Establish the location of the Phoenix output folder.
				var phoenixOutput = new Dir("C:/Switch/Depository/phoenixOutput/" + module.localEnvironment + "/" + projectId);

				// Setup the different possible file types.
				var pdfFiles = phoenixOutput.entryList("*.pdf", Dir.Files, Dir.Name);
				var jdfFiles = phoenixOutput.entryList("*.jdf", Dir.Files, Dir.Name);
				var xmlFiles = phoenixOutput.entryList("*.xml", Dir.Files, Dir.Name);
				var csvFiles = phoenixOutput.entryList("*.csv", Dir.Files, Dir.Name);
				
				// Collect expected layout file names from XML
				var expectedFiles = [];
				for (var i = 0; i < phoenixPlan.layoutNodes.length; i++) {
					var name = phoenixPlan.layoutNodes.at(i).evalToString("name");
					expectedFiles.push(name + ".pdf"); // Assuming layout name matches file name
				}

				// Get list of files in the directory
				var actualFiles = {
					print: [],
					die: [],
					report: [],
					xml: [],
					csv: []
				}

				// Loop through the PDF files.
				for (var i = 0; i < pdfFiles.length; i++) {
					var file = pdfFiles[i];

					// Add any die cut pdf files.
					if (file.match(/die/)) {
						actualFiles.die.push(pdfFiles[i]);

					// Add the report file.
					}else if (file.match(/report/)) {
						actualFiles.report.push(pdfFiles[i]);

					// Add the print file (assume print based on everyting else accounted for)
					}else if (!file.match(/die|report/i)) {
						actualFiles.print.push(pdfFiles[i]);
					}
				}

				// Add any jdf files.
				for (var i = 0; i < jdfFiles.length; i++) {
					actualFiles.die.push(jdfFiles[i]);
				}

				// Add the xml file
				for (var i = 0; i < xmlFiles.length; i++) {
					actualFiles.xml.push(xmlFiles[i]);
				}

				// Add the CSV file (if applicable)
				for (var i = 0; i < csvFiles.length; i++) {
					actualFiles.csv.push(csvFiles[i]);
				}

				var allFilesReady = false;

				// Set the threshold that the system waits
				var threshold = 60 * 60000;
				var now = new Date();
				var modified = new Date(sourceFile.lastModified);

				// Check if all die and print files are accounted for, and the XML and Report files are ready.
				if (
					expectedFiles.length === actualFiles.print.length &&
					actualFiles.print.length === actualFiles.die.length &&
					actualFiles.report.length === 1 &&
					actualFiles.xml.length === 1 &&
					allFilesReady == false
				) {
					s.log(1, "All required files are present, proceeding with transfer.");
					allFilesReady = true
				}
        
				// Check if the time threshold has been met.
                if(
					now.getTime() - modified.getTime() > threshold &&
					allFilesReady == false
				) {
					s.log(2, "Time threshold met, proceeding with transfer.")
					allFilesReady = true

					// Post to the webhook that we have an anomaly.
					postWebhook(s, tableData, db, "Critical Error", "File transfer threshold met.", [
						["Error", "Gang processor timeout."]
					]);
                }

				// For cut vinyl, we don't need the print or cut files.
				if(
					tableData.process == "CutVinyl" &&
					actualFiles.report.length === 1 &&
					actualFiles.xml.length === 1 &&
					allFilesReady == false
				) {
					s.log(1, "All required files are present, proceeding with transfer.");
					allFilesReady = true
				}

				// If all exist, move files to approved/rejected location
				if (allFilesReady) {
					var isApproved = (tableData.status === "Approved");

					// Combine all files for processing
					var allMoveFiles = [].concat(actualFiles.print, actualFiles.die);

					// Move print and die files based on type
					for (var i = 0; i < allMoveFiles.length; i++) {
						var fileName = allMoveFiles[i];
						if (!fileName) continue;

						var destDir = getFileType(fileName, module.localEnvironment, isApproved);
						s.move(phoenixOutput.path + "/" + fileName, destDir.path + "/" + fileName, true);
					}

					// Handle report file (array of names)
					if (actualFiles.report && actualFiles.report.length > 0) {
						var reportName = actualFiles.report[0];
						var destDir = getFileType(reportName, module.localEnvironment, isApproved);
						s.move(phoenixOutput.path + "/" + reportName, destDir.path + "/" + reportName, true);
					}

					// Handle xml file (array of names)
					if (actualFiles.xml && actualFiles.xml.length > 0) {
						var xmlName = actualFiles.xml[0];
						var destDir = getFileType(xmlName, module.localEnvironment, isApproved);
						s.move(phoenixOutput.path + "/" + xmlName, destDir.path + "/" + xmlName, true);
					}

					// Handle CSV file (array of names)
					if (actualFiles.csv && actualFiles.csv.length > 0) {
						var csvName = actualFiles.csv[0];
						var destDir = getFileType(csvName, module.localEnvironment, isApproved);
						s.move(phoenixOutput.path + "/" + csvName, destDir.path + "/" + csvName, true);
					}

					// Clean up the file that triggered the script
					if (sourceFile.exists) {
						sourceFile.remove(); // Safely remove the trigger file
					}

					// Remove the projectID directory if empty
					var remainingFiles = phoenixOutput.entryList("*", Dir.Files, Dir.Name);
					if (remainingFiles.length === 0) {
						try {
							phoenixOutput.rmdir(); // Safe cleanup
						} catch (e) {
							s.log(2, "Failed to remove directory: " + e);
						}
					}
				} else {
					s.log(2, "Files not ready yet, skipping transfer.");
				}
			}
            
        }catch(e){
            s.log(2, "Critical Error: Gang Processor -- " + e)
			return
        }
    }
    run(s, codebase)
}

function getFileType(name, environment, isApproved){

	if(!isApproved){
		return getDirectory("C:/Switch/Depository/phoenixRejected/" + environment)
	}

	if(name.match(/die/) == "die" || name.match(/jdf/) == "jdf"){
		return getDirectory("C:/Switch/Depository/postProcessing/" + environment + "/Cut")
	}

	if(name.match(/report/) == "report"){
		return getDirectory("C:/Switch/Depository/fileDistribution/" + environment + "/Report")
	}

	if(name.match(/xml/) == "xml"){
		return getDirectory("C:/Switch/Depository/fileDistribution/" + environment + "/Data")
	}

	if(name.match(/csv/) == "csv"){
		return getDirectory("C:/Switch/Depository/postProcessing/" + environment + "/CSV")
	}

	return getDirectory("C:/Switch/Depository/postProcessing/" + environment + "/Print")
}