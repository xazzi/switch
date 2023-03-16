runMissingFiles = function(s, job){
    function missingFiles(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            
            // Load in the Handoff Data dataset
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                contentFile: handoffDataDS.evalToString("//product/contentFile")
            }
            
            // Establist connection to the database
            var dbConn = connectToDatabase_db(s.getPropertyValue("database"));
            var date = new Date();
            
            // Query the database to check/post the missing files.
            var dbQuery = new Statement(dbConn);
                dbQuery.execute("SELECT * FROM digital_room.missing_file WHERE file_name = '" + handoffData.contentFile + "';");
            if(!dbQuery.isRowAvailable()){
                var dbQuery = new Statement(dbConn);
                    dbQuery.execute("INSERT INTO digital_room.missing_file (gang_number,file_name,date) VALUES ('" + handoffData.projectID + "','" + handoffData.contentFile + "','" + date + "');");
            }
            
            job.sendToSingle(job.getPath());
                    
        }catch(e){
            s.log(2, "Critical Error: Missing Files")
            job.sendToNull(job.getPath())
        }
    }
    missingFiles(s, job)
}