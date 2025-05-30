runFileHandlerVL = function(s, job, codebase){
    function fileHandlerVL(s, job, codebase){
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/",
                transferVL: "C:/Switch/Depository/transferVL"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/email-responses.js"));
			eval(File.read(dir.support + "/connect-to-db.js"));
			eval(File.read(dir.support + "/load-module-settings.js"));
			eval(File.read(dir.support + "/sql-statements.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

			// Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                settings: new Statement(connections.settings),
				history: new Statement(connections.history),
                email: new Statement(connections.email)
            }

            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                facility: handoffDataDS.evalToString("//misc/facility"),
                status: job.getPrivateData("send")
            }

            dir.holdVL = new Dir("//amz-impsw-data/IMPSW_DATA/.Live Services/VL Hold/" + handoffData.facility)

            var doc = new Document(job.getPath());	
            var map = doc.createDefaultMap();

            var productNodes = doc.evalToNodes('//job/products/product', map);
            for(var j=0; j<productNodes.length; j++){

                var file = productNodes.at(j).evalToString('name')
                var itemNumber = file.split('_')[1]

                var files = dir.holdVL.entryList("*" + itemNumber + "*", Dir.Files, Dir.Name);
                for(var i=0; i<files.length; i++){
                    if(handoffData.status == "approved"){
                        s.move(dir.holdVL.path + "/" + files[i], dir.transferVL + "/" + handoffData.facility + "/" + files[i], true);
                    }else{
                        s.log(2, "Removing held file: " + dir.holdVL.path + "/" + files[i])
                        new File(dir.holdVL.path + "/" + files[i]).remove();
                    }
                }
            }
            
            job.sendToNull(job.getPath());
            
        }catch(e){
            s.log(2, "Critical Error: Processor -- " + e)
            job.sendToNull(job.getPath())
        }
    }
    fileHandlerVL(s, job, codebase)
}