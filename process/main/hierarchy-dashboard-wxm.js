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
                hotfolder: handoffDataDS.evalToString("//rip/hotfolder"),
                resolution: handoffDataDS.evalToString("//rip/resolution")
            }

            var inputDS = loadDataset_db("Input");
            if(inputDS == "Dataset Missing"){
                job.sendTo(findConnectionByName_db(s, "Critical Error"), job.getPath());
                return
            }
            
            var input = {
                nodes: inputDS.evalToNodes("//field-list/field"),
                device:{
                    enabled: false,
                    value: null
                },
                hotfolder:{
                    enabled: false,
                    value: null
                }
            }
                
            // Parse through the input data.
            for(var i=0; i<input.nodes.length; i++){

                // Let the user override the press.
                if(input.nodes.getItem(i).evalToString('tag') == "Press"){
                    input.device.enabled = true;
                    handoffData.device = input.nodes.getItem(i).evalToString('value')
                }
            }

            // If a press that requires a resolution is required, change the hotfolder to the resolution.
            // Doing it this way allows the override to work.
            if(handoffData.device == "GSR2" || handoffData.device == "GS" || handoffData.device == "H5" || handoffData.device == "HS" || handoffData.device == "HS100"){
                handoffData.hotfolder = handoffData.resolution;
            }

            // If a press has a standard structure, assign accordingly.
            if(handoffData.device == "5R1" || handoffData.device == "5R2" || handoffData.device == "P5350HS"){
                if(handoffData.hotfolder != "First Surface" && handoffData.hotfolder != "Second Surface"){
                    handoffData.hotfolder = "Standard"
                }
            }

            job.setHierarchyPath([handoffData.device,handoffData.hotfolder]);
	        job.sendToSingle(job.getPath(), job.getName());
            
        }catch(e){
            s.log(2, "Critical Error: Hierarchy-Dashboard-WXM: " + e)
            job.sendToNull(job.getPath())
        }
    }
    hierarchy(s, job)
}