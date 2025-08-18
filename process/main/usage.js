runUsage = function(s, job, codebase){
    function usage(s, job, codebase){
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));
            eval(File.read(dir.support + "/sql-statements.js"));
            eval(File.read(dir.support + "/set-date-object.js"));
            eval(File.read(dir.support + "/get-timezone.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

            // Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                settings: new Statement(connections.settings),
                history: new Statement(connections.history),
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
            
            // Collect the phoenix plan data.
            var phoenixPlanDS = loadDataset_db("Phoenix Plan");
            var phoenixPlan = {
                id: phoenixPlanDS.evalToString("//job/id"),
                averageUsage: Math.round(phoenixPlanDS.evalToString("//job/sheet-usage",null) * 100),
                layoutNode: phoenixPlanDS.evalToNodes("//job/layouts/layout", null),
                products: phoenixPlanDS.evalToNodes("//job/products/product", null)
            }

            // Get the timezone info and set the now time per UTC for completion time.
            var times = getTimezoneInfo()
            var now = parseDateParts(times.UTC)

            // Update the details_gang table
            // ------------------------------------------------------------------
            db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                ["project-id", handoffData.projectID]
            ],[
                ["average-usage",phoenixPlan.averageUsage],
                ["ganging_completed_at_utc",now.iso],
                ["status","Ganged"]
            ]))   
                
            // Insert into the details_layout table
            // ------------------------------------------------------------------
            for(var j=0; j<phoenixPlan.layoutNode.length; j++){
                db.history.execute(generateSqlStatement_Insert(s, "history.details_layout", [
                    ["project-id", handoffData.projectID],
                    ["gang-number", handoffData.gangNumber],
                    ["layout-id", phoenixPlan.layoutNode.at(j).evalToString("index")],
                    ["usage", Math.round(phoenixPlan.layoutNode.at(j).evalToString("sheet-usage") * 100)],
                    ["status", "Created"]
                ]));
            }

            // Create a Set of product names from Phoenix
            // ------------------------------------------------------------------
            var phoenixProductNames = {};
            for (var j = 0; j < phoenixPlan.products.length; j++) {
                var name = phoenixPlan.products.getItem(j).evalToString('name');
                phoenixProductNames[name] = true;
            }

            // Loop through handoff products and find missing items
            var unmatchedProducts = [];

            for (var i = 0; i < handoffData.products.length; i++) {
                var product = handoffData.products.getItem(i);
                var contentFile = product.evalToString('contentFile');

                if (!(contentFile in phoenixProductNames)) {
                    unmatchedProducts.push([
                        product.evalToString('itemNumber'),
                        "Removed",
                        "This file was not ganged by Phoenix."
                    ]);
                }
            }

            // Save messages to email DB
            updateEmailHistory(s, db, "Phoenix", handoffData, unmatchedProducts);

            // Assemble the data for the email 
            // ------------------------------------------------------------------
            var messageData = {
                process: handoffData.process,
                subprocess: handoffData.subprocess,
                dueDate: handoffData.dueDate,
                facility: handoffData.facility
            };

            notificationQueue_Gangs(
                s,
                db,
                "Gang Success",
                "Gang Summary: " + handoffData.gangNumber + ".",
                null,
                handoffData.projectID,
                handoffData.gangNumber,
                "success",
                "",
                job.getUserEmail(),
                messageData
            );

            // Send the job to be approved.
            job.sendToNull(job.getPath())
            
        }catch(e){
            s.log(2, "Critical Error: Usage: " + e)
            job.sendToNull(job.getPath())
        }
    }
    usage(s, job, codebase)
}

function escapeSQLString(str) {
    return str
        .replace(/\\/g, '\\\\')  // escape backslashes
        .replace(/'/g, "\\'")    // escape single quotes
        .replace(/\n/g, '\\n');  // escape newlines explicitly
}
