prismPost = function(s, job, codebase){
    function run(s, job, codebase){
        var db
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/email-responses.js"));
			eval(File.read(dir.support + "/connect-to-db.js"));
			eval(File.read(dir.support + "/load-module-settings.js"));
			eval(File.read(dir.support + "/sql-statements.js"));
            eval(File.read(dir.support + "/webhook-post.js"));

            // Specific support modules
            eval(File.read(dir.support + "/prism-post/writeXml.js"));
            eval(File.read(dir.support + "/prism-post/postUtils.js"));
            eval(File.read(dir.support + "/prism-post/fileUtils.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

			// Establist connection to the databases
            var connections = establishDatabases(s, module)
            db = {
                settings: new Statement(connections.settings),
				history: new Statement(connections.history),
                email: new Statement(connections.email)
            }
            
            var validationDataDS = loadDataset_db("Validation");
            var validation = {
                nodes: validationDataDS.evalToNodes("//field-list/field"),
                post: {
					prism: null,
					processing: true,
					facility: true
				},
                removals: {
                    items: "",
                    layouts: ""
                }
            }
                
            for(var i=0; i<validation.nodes.length; i++){
                // Check if we are removing specific items.
                if(validation.nodes.getItem(i).evalToString('tag') == "Items to Remove"){
                    validation.removals.items = validation.nodes.getItem(i).evalToString('value').split(',');
                }

				// Check if the user wants to post to prism.
                if(validation.nodes.getItem(i).evalToString('tag') == "Post to Prism?"){
                    validation.post.prism = validation.nodes.getItem(i).evalToString('value') == "true";
                }
            }
            
			var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
				projectID: handoffDataDS.evalToString("//base/projectID"),
                gangNumber: handoffDataDS.evalToString("//base/gangNumber"),
                dueDate: handoffDataDS.evalToString("//base/dueDate"),
                facility: handoffDataDS.evalToString("//misc/facility"),
				workstyle: handoffDataDS.evalToString("//misc/workstyle"),
                status: job.getPrivateData("status"),
                process: handoffDataDS.evalToString("//base/process"),
                subprocess: handoffDataDS.evalToString("//base/subprocess"),
                user: handoffDataDS.evalToString("//user/folder")
            }

			var phoenixPlanDS = loadDataset_db("Phoenix Plan");
                                
            var userInfo = {
                first: handoffDataDS.evalToString("//user/first"),
                last: handoffDataDS.evalToString("//user/last"),
                email: handoffDataDS.evalToString("//user/email"),
                dir: handoffDataDS.evalToString("//user/folder")
            }
            
			var response

            if(handoffData.status == "Approved"){
                s.log(2, handoffData.gangNumber + " approved by " + userInfo.first + " " + userInfo.last + ".");
                if(validation.post.prism){
                    // Create the new job to work with.
                    var newXML = s.createNewJob();
                    var xmlPath = newXML.createPathWithName(handoffData.gangNumber + ".xml", false);
                    var xmlFile = new File(xmlPath);
                    //var xmlFile = new File("C://Switch//Development//test.xml");

                    // Build the XML file
                    buildXml(s, xmlFile, phoenixPlanDS, handoffDataDS, validation, handoffData);

                    // Create JSON wrapper
                    var jsonPath = createJsonPayload(s, handoffData.gangNumber, xmlPath);

                    // Post to API
                    response = postToPrismApi(s, module, jsonPath);

                    if(response == "Success"){
                        // Email the success of the prism post.
                        s.log(2, handoffData.gangNumber + " posted to PRISM successfully!");

                        // Clean up the job after success
                        newXML.sendToNull(newXML.getPath());

                    }else{
                        // Email the failure of the prism post.
                        s.log(2, handoffData.gangNumber + " failed to post to PRISM.");
                        
                        // Assemble the data for the email 
                        var messageData = {
                            process: handoffData.process,
                            subprocess: handoffData.subprocess,
                            dueDate: handoffData.dueDate,
                            facility: handoffData.facility
                        };

                        // Send the email.
                        notificationQueue_Gangs(
                            s,
                            db,
                            "Prism POST Fail",
                            "Prism POST for job " + handoffData.gangNumber + " failed.",
                            "Please attempt on the dashboard manually",
                            handoffData.projectID,
                            handoffData.gangNumber,
                            "error",
                            null,
                            userInfo.email,
                            messageData //message_data in the table
                        );

                        // Send the webhook post.
                        postWebhook(s, null, db, "Critical Error", "Prism POST fail!", [
                            ["Error", "Failed while posting to prism."],
                            ["Reason", "Timeout or duplicate gang."]
                        ]);

                        newXML.setHierarchyPath([userInfo.dir])
                        newXML.sendTo(findConnectionByName_db(s, "Xml"), xmlPath);
                    }
                }
            }else{
                s.log(2, handoffData.gangNumber + " rejected by " + userInfo.first + " " + userInfo.last + ".")
            }

			// Update the history details gang with the status and prism response.
			db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
				["project-id",handoffData.projectID]
			],[
				["status",handoffData.status],
                ["post_to_prism",(validation.post.prism === 'true') ? 1 : 0],
				["prism-response",response]
			]))

            // Update the history details layout with the status.
			db.history.execute(generateSqlStatement_Update(s, "history.details_layout", [
                ["project-id", handoffData.projectID]
            ],[
                ["status",handoffData.status]
            ])) 
            
            job.sendTo(findConnectionByName_db(s, "Process"), job.getPath());
            
        }catch(e){

            s.log(2, "Critical Error: Prism POST -- " + e)
            job.fail(e)
        }
    }
    run(s, job, codebase)
}