runUsage = function(s, job){
    function usage(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));
            eval(File.read(dir.support + "/sql-statements.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

            // Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                general: new Statement(connections.general),
                history: new Statement(connections.history),
                email: new Statement(connections.email)
            }

            // Collect the handoff data.
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                gangNumber: handoffDataDS.evalToString("//base/gangNumber")
            }
            
            // Collect the phoenix plan data.
            var phoenixPlanDS = loadDataset_db("Phoenix Plan");
            var phoenixPlan = {
                id: phoenixPlanDS.evalToString("//job/id"),
                averageUsage: Math.round(phoenixPlanDS.evalToString("//job/sheet-usage",null) * 100),
                layoutNode: phoenixPlanDS.evalToNodes("//job/layouts/layout", null)
            }

            // Update the details_gang table with the average usage.
            db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                ["project-id", handoffData.projectID]
            ],[
                ["average-usage",phoenixPlan.averageUsage],
                ["status","Ganged"]
            ]))   
                
            // Insert the layout level days into the details_layout table.
            for(var j=0; j<phoenixPlan.layoutNode.length; j++){
                db.history.execute(generateSqlStatement_Insert(s, "history.details_layout", [
                    ["project-id", handoffData.projectID],
                    ["gang-number", handoffData.gangNumber],
                    ["layout-id", phoenixPlan.layoutNode.at(j).evalToString("index")],
                    ["usage", Math.round(phoenixPlan.layoutNode.at(j).evalToString("sheet-usage") * 100)],
                    ["status", "Created"]
                ]));
            }

            // Send the job to be approved.
            job.sendToNull(job.getPath())
            
        }catch(e){
            s.log(2, "Critical Error: Usage: " + e)
            job.sendToNull(job.getPath())
        }
    }
    usage(s, job)
}