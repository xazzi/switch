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
                sku: handoffDataDS.evalToString("//base/sku")
            }
            
            // Collect the phoenix plan data.
            var phoenixPlanDS = loadDataset_db("Phoenix Plan");
            var phoenixPlan = {
                id: phoenixPlanDS.evalToString("//job/id"),
                averageUsage: Math.round(phoenixPlanDS.evalToString("//job/sheet-usage",null) * 100)
            }

            // Update the details_gang table with the average usage.
            db.history.execute("UPDATE history.details_gang SET `average-usage` = '" + phoenixPlan.averageUsage + "' WHERE `gang-number` = '" + phoenixPlan.id + "' AND `SKU` = '" + handoffData.sku + "';");
                
            // Send the job to be approved.
            job.sendToNull(job.getPath())
            
        }catch(e){
            s.log(2, "Critical Error: Usage")
            job.sendToNull(job.getPath())
        }
    }
    usage(s, job)
}