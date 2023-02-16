runUsage = function(s, job){
    function usage(s, job){
        try{
            var dir = {
                support: s.getPropertyValue("support")
            }
            
            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));

            // Establish connection to the database.
            var dbConn = connectToDatabase_db(s.getPropertyValue("database"));
                dbQuery = new Statement(dbConn);

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

            // Update the history_gang table with the average usage.
            dbQuery.execute("UPDATE digital_room.history_gang SET `average-usage` = '" + phoenixPlan.averageUsage + "' WHERE `gang-number` = '" + phoenixPlan.id + "' AND `SKU` = '" + handoffData.sku + "';");
                
            // Send the job to be approved.
            job.sendToNull(job.getPath())
            
        }catch(e){
            s.log(2, "Critical Error: Usage")
            job.sendToNull(job.getPath())
        }
    }
    usage(s, job)
}