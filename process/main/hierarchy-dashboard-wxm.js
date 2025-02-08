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
                hotfolder: handoffDataDS.evalToString("//rip/hotfolder")
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
                    if(input.nodes.getItem(i).evalToString('value') != "Default"){
                        input.device.enabled = true;
                        handoffData.device = input.nodes.getItem(i).evalToString('value')
                    }
                }

                // Set the resolution where applicable.
                if(input.nodes.getItem(i).evalToString('tag') == "Resolution"){
                    if(input.nodes.getItem(i).evalToString('value') != "Default"){
                        input.hotfolder.enabled = true;
                        handoffData.hotfolder = input.nodes.getItem(i).evalToString('value')
                    }
                }
            }

            if(input.device.enabled){
                if(!input.hotfolder.enabled){
                    if(handoffData.hotfolder != "First Surface" && handoffData.hotfolder != "Second Surface"){
                        handoffData.hotfolder = "Standard"
                    }
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