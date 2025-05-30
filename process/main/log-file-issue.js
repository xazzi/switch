runMissingFiles = function(s, job, codebase){
    function missingFiles(s, job, codebase){
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/write-to-email-db.js"));
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
                sku: handoffDataDS.evalToString("//base/sku"),
                contentFile: handoffDataDS.evalToString("//product/contentFile"),
                itemNumber: handoffDataDS.evalToString("//product/itemNumber")
            }

            emailDatabase_write(s, db, "parsed_data", "File Check", handoffData, [[handoffData.itemNumber, privateData.type, privateData.message]])
            
            job.sendToSingle(job.getPath());
                    
        }catch(e){
            s.log(2, "Critical Error: Missing Files: " + e)
            job.sendToNull(job.getPath())
        }
    }
    missingFiles(s, job, codebase)
}