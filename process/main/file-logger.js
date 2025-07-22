fileLogger = function(s, job, codebase){
    function run(s, job, codebase){
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
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
                settings: new Statement(connections.settings),
                email: new Statement(connections.email),
                history: new Statement(connections.history)
            }

            var privateData = {
                type: job.getPrivateData("type"),
                message: job.getPrivateData("message")
            }
            
            // Load in the Handoff Data dataset
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                gangNumber: handoffDataDS.evalToString("//base/gangNumber"),
                itemNumber: handoffDataDS.evalToString("//product/itemNumber")
            }

            updateEmailHistory(s, db, "Logger", handoffData, [[handoffData.itemNumber, privateData.type, privateData.message]]);
            
            job.sendToNull(job.getPath());
                    
        }catch(e){
            s.log(2, "Critical Error: File Logger: " + e)
            job.sendToNull(job.getPath())
        }
    }
    run(s, job, codebase)
}