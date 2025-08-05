runHierarchy = function(s, job, codebase){
    function hierarchy(s, job, codebase){
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));

            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                process: handoffDataDS.evalToString("//rip/hotfolder"),
                subprocess: handoffDataDS.evalToString("//base/subprocess")
            }

            var side = job.getName().match(new RegExp("_B_","g")) ? "B" : "F";
            var newPath = handoffData.process
            
            // Add any prefixes
            if(handoffData.process == "Coroplast"){
                //newPath = "" + newPath
            }
            
            // Add the side
            newPath += " " + side;
            
            // Add any suffixes
            if(handoffData.process == "Coroplast"){
                newPath += "  v1";
            }

            job.setHierarchyPath([newPath]);
	        job.sendToSingle(job.getPath(), job.getName());
            
        }catch(e){
            s.log(2, "Critical Error: Hierarchy-Agfa")
            job.sendToNull(job.getPath())
        }
    }
    hierarchy(s, job, codebase)
}