runTableEntry = function(s, job){
    function runTableEntry(s, job){
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
            var handoffDataDS = loadDataset_db("Vinyl Lettering");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//data/projectID"),
                gangNumber: handoffDataDS.evalToString("//data/gangNumber"),
                itemNumber: handoffDataDS.evalToString("//data/itemNumber"),
                filename: {
                    single: handoffDataDS.evalToString("//data/filename/single"),
                    phoenix: handoffDataDS.evalToString("//data/filename/phoenix")
                },
                settings:{
                    facility: handoffDataDS.evalToString("//data/settings/facility"),
                    color: handoffDataDS.evalToString("//data/settings/color"),
                    layout: handoffDataDS.evalToString("//data/settings/layout")
                }
            }
            
            // Update the gang on the details_gang table to complete.
            db.history.execute("INSERT INTO history.vinyl_lettering (`project-id`,`gang-number`,`item-number`,`single-filename`,`phoenix-filename`,`facility`,`color`,`layout-code`,`ready-to-gang`) VALUES ('" + handoffData.projectID + "','" + handoffData.gangNumber + "','" + handoffData.itemNumber + "','" + handoffData.filename.single + "','" + handoffData.filename.phoenix + "','" + handoffData.settings.facility + "','" + handoffData.settings.color + "','" + handoffData.settings.layout + "','" + 'y' + "');");
                
            // Null the original job
            job.sendToNull(job.getPath())
                    
        }catch(e){
            s.log(2, "Critical Error: Table Entry for VL")
            job.sendToNull(job.getPath())
        }
    }
    runTableEntry(s, job)
}