// This is unused code as of the 10/23/2023 sprint.

runReporting = function(s, job){
    function reporting(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
	
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                facility: handoffDataDS.evalToString("//misc/facility"),
                printer: handoffDataDS.evalToString("//settings/printer"),
                whiteInk: handoffDataDS.evalToString("//settings/whiteink"),
                side: null
            }
            
            var doc = new Document(job.getPath());	
            var map = doc.createDefaultMap();
            var layoutNodes = doc.evalToNodes('//job/layouts/layout', map);
            var productNodes = doc.evalToNodes('//job/products/product', map);
            
            // Gangs --------------------------
            createJob(s, handoffData, "Gang");
            
            // Layouts --------------------------
            for(var j=0; j<layoutNodes.length; j++){
                if(layoutNodes.at(j).evalToString('//surfaces/surface[2]/side') == "Back"){
                    handoffData.side = "Back";
                    createJob(s, handoffData, "Layout");
                }
                handoffData.side = "Front";
                createJob(s, handoffData, "Layout");
            }
            
            // Items --------------------------
            for(var j=0; j<productNodes.length; j++){
                createJob(s, handoffData, "Item");
            }
            
            // Null the original job
            job.sendToNull(job.getPath())
            
                    
        }catch(e){
            s.log(2, "Critical Error: Reporting")
            job.sendToNull(job.getPath())
        }
    }
    reporting(s, job)
}

function createJob(s, handoffData, type){
	var newJSON = s.createNewJob();
		newJSON.setPrivateData("Facility", handoffData.facility);
		newJSON.setPrivateData("Type", type);
		newJSON.setPrivateData("Printer", handoffData.printer);
		newJSON.setPrivateData("WhiteInk", handoffData.whiteInk);
		newJSON.setPrivateData("Side", handoffData.side);
		
	var jsonPath = newJSON.createPathWithName(type + ".json", false);
	var jsonFile = new File(jsonPath);
		jsonFile.open(File.Append);
		jsonFile.writeLine('{');	
		jsonFile.writeLine('null');
		jsonFile.write('}');
		jsonFile.close();

		newJSON.sendToSingle(jsonPath)
}