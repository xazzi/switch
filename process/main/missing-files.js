runMissingFiles = function(s, job){
    function missingFiles(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/write-to-email-db.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));

            // Establist connection to the databases
            var connections = establishDatabases(s)
            var db = {
                general: new Statement(connections.general),
                email: new Statement(connections.email)
            }
            
            // Load in the Handoff Data dataset
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                sku: handoffDataDS.evalToString("//base/sku"),
                contentFile: handoffDataDS.evalToString("//product/contentFile"),
                itemNumber: handoffDataDS.evalToString("//product/itemNumber")
            }

            emailDatabase_write(s, db, "parsed_data", "File Check", handoffData, [product.itemNumber,"Missing file or cutpath."])
            
            // Add to the missing file table.
            db.general.execute("INSERT INTO digital_room.missing_file (gang_number,file_name,date) VALUES ('" + handoffData.projectID + "','" + handoffData.contentFile + "','" + new Date() + "');");
            
            job.sendToSingle(job.getPath());
                    
        }catch(e){
            s.log(2, "Critical Error: Missing Files")
            job.sendToNull(job.getPath())
        }
    }
    missingFiles(s, job)
}