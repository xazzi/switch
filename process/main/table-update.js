runTableUpdate = function(s, job){
    function tableUpdate(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }
            
            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            
            // Establish the database connection.
            var dbConn = connectToDatabase_db(s.getPropertyValue("database"));
                dbQuery = new Statement(dbConn);
            
            // Collect the handoff data
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                sku: handoffDataDS.evalToString("//base/sku"),
                processedTime: handoffDataDS.evalToString("//base/processed-time"),
                processedDate: handoffDataDS.evalToString("//base/processed-date"),
                productNodes: handoffDataDS.evalToNodes("//products/product")
            }
            
            // Collect the phoenix plan data
            var phoenixPlanDS = loadDataset_db("Phoenix Plan");
            var phoenixPlan = {
                id: phoenixPlanDS.evalToString("//job/id"),
                layoutNode: phoenixPlanDS.evalToNodes("//job/layouts/layout", null)            
            }
            
            // Add all of the item level data into the history_item table.
            for(var j=0; j<handoffData.productNodes.length; j++){
                dbQuery.execute("INSERT INTO digital_room.history_item (`gang-number`,`item-number`,`order-number`,`processed-time`,`processed-date`,`due-date`,`orientation`) VALUES ('" + phoenixPlan.id + "','" + handoffData.productNodes.at(j).evalToString('itemNumber') + "','" + handoffData.productNodes.at(j).evalToString('orderNumber') + "','" + handoffData.processedTime + "','" + handoffData.processedDate + "','" + handoffData.productNodes.at(j).evalToString('due-date') + "','" + handoffData.productNodes.at(j).evalToString('orientation') + "');");
            }
            
            // Update the gang on the history_gang table to complete.
            dbQuery.execute("UPDATE digital_room.`history_gang` SET `completed` = 'y' WHERE (`gang-number` = '" + phoenixPlan.id + "' and `processed-time` = '" + handoffData.processedTime + "');");
            
            // Insert the layout level days into the history_layout table.
            for(var j=0; j<phoenixPlan.layoutNode.length; j++){
                dbQuery.execute("INSERT INTO digital_room.`history_layout` (`gang-number`,`layout-id`,sku,`usage`) VALUES ('" + phoenixPlan.id + "','" + phoenixPlan.layoutNode.at(j).evalToString("index") + "','" + handoffData.sku + "','" + Math.round(phoenixPlan.layoutNode.at(j).evalToString("sheet-usage") * 100) + "');");	
            }
                
            // Null the original job
            job.sendToNull(job.getPath())
                    
        }catch(e){
            s.log(2, "Critical Error: Table Update")
            job.sendToNull(job.getPath())
        }
    }
    tableUpdate(s, job)
}