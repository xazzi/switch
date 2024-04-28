runHierarchy = function(s, job){
    function hierarchy(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));

            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                device: handoffDataDS.evalToString("//rip/device"),
                hotfolder: handoffDataDS.evalToString("//rip/hotfolder")            }

            var side = job.getName().match(new RegExp("_B.pdf","g")) ? "Back" : job.getName().match(new RegExp("_F.pdf","g")) ? "Front" : "Front"
            var newPath = handoffData.device + "/" + handoffData.hotfolder
            
            // Adjust Coroplast for separate F and B files.
            if(handoffData.hotfolder == "Coroplast"){
                newPath = handoffData.device + "/COR-" + side
            }

            // Adjust 3mm-PVC for separate F and B files.
            if(handoffData.hotfolder == "PVC"){
                newPath = handoffData.device + "/PVC-" + side
            }

            job.setHierarchyPath([newPath]);
	        job.sendToSingle(job.getPath(), job.getName());
            
        }catch(e){
            s.log(2, "Critical Error: Hierarchy-Agfa: " + e)
            job.sendToNull(job.getPath())
        }
    }
    hierarchy(s, job)
}