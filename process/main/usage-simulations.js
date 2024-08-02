runUsage = function(s, job){
    function runUsage(s, job){
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
                email: new Statement(connections.email),
                history: new Statement(connections.history)
            }
            
            // Collect the handoff data
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                sku: handoffDataDS.evalToString("//settings/sku"),
                substrate: handoffDataDS.evalToString("//settings/substrate"),
                type: handoffDataDS.evalToString("//settings/type"),
                facility: handoffDataDS.evalToString("//settings/facility"),
                month: handoffDataDS.evalToString("//settings/month"),
                date: handoffDataDS.evalToString("//settings/date"),
                coating: handoffDataDS.evalToString("//settings/coating"),
                cutter: handoffDataDS.evalToString("//settings/cutter")
            }
            
            // Collect the phoenix plan data
            var phoenixPlanDS = loadDataset_db("Phoenix Plan");
            var phoenixPlan = {
                id: phoenixPlanDS.evalToString("//job/id"),
                averageUsage: phoenixPlanDS.evalToString("//job/sheet-usage"),
                layoutCount: phoenixPlanDS.evalToString("//job/layout-count"),
                totalRunLength: phoenixPlanDS.evalToString("//job/run-length"),
                overRun: phoenixPlanDS.evalToString("//job/overrun"),
                layoutNode: phoenixPlanDS.evalToNodes("//job/layouts/layout", null)         
            }
            
            var gangArray = [
                ["sku",handoffData.sku],
                ["substrate",handoffData.substrate],
                ["facility",handoffData.facility],
                ["type",handoffData.type],
                ["month",handoffData.month],
                ["date",handoffData.date],
                ["average-usage",Math.round(phoenixPlan.averageUsage*100) + "\%"],
                ["layouts",phoenixPlan.layoutCount],
                ["total-run-length",phoenixPlan.totalRunLength],
                ["average-overrun",Math.round(phoenixPlan.overRun*100) + "\%"],
                ["cutter",handoffData.cutter],
                ["coating",handoffData.coating]
            ]

            db.history.execute(generateSqlStatement(s, "history.simulation_gang", gangArray));	
            
            // Insert the layout level days into the details_layout table.
            for(var j=0; j<phoenixPlan.layoutNode.length; j++){

                var layoutArray = [
                    ["sku",handoffData.sku],
                    ["substrate",handoffData.substrate],
                    ["facility",handoffData.facility],
                    ["type",handoffData.type],
                    ["month",handoffData.month],
                    ["date",handoffData.date],
                    ["layout-usage",Math.round(phoenixPlan.layoutNode.at(j).evalToString("sheet-usage")*100) + "\%"],
                    ["layout-index",phoenixPlan.layoutNode.at(j).evalToString("index")],
                    ["run-length",phoenixPlan.layoutNode.at(j).evalToString("run-length")],
                    ["overRun",Math.round(phoenixPlan.layoutNode.at(j).evalToString("overrun")*100) + "\%"],
                    ["cutter",handoffData.cutter],
                    ["coating",handoffData.coating]
                ]

                db.history.execute(generateSqlStatement(s, "history.simulation_layout", layoutArray));	
            }
                
            // Null the original job
            job.sendToNull(job.getPath())
                    
        }catch(e){
            s.log(2, "Critical Error: Table Update Simulation: " + e)
            job.sendToNull(job.getPath())
        }
    }
    runUsage(s, job)
}

function generateSqlStatement(s, table, gangArray){

    var headerArray = []
    var valueArray = []

    for(var i in gangArray){
        headerArray.push("`" + gangArray[i][0] + "`");
        valueArray.push("'" + gangArray[i][1] + "'");
    }

    headerArray.join(',').toString()
    valueArray.join(',').toString()

    return "INSERT INTO " + table + "(" + headerArray + ") VALUE (" + valueArray + ");";
}