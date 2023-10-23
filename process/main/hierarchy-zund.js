runHierarchy = function(s, job){
    function hierarchy(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            var enabled = s.getPropertyValue("enabled") == "Yes"

            if(enabled){
                // Read in any support directories
                eval(File.read(dir.support + "/general-functions.js"));

                var handoffDataDS = loadDataset_db("Handoff Data");
                var handoffData = {
                    products: handoffDataDS.evalToNodes("//products/product")
                }

                var phoenixPlanDS = loadDataset_db("Phoenix Plan");
                var phoenixPlan = {
                    products: phoenixPlanDS.evalToNodes("//products/product")
                }

                checkHierarchy(s, job, handoffData, phoenixPlan)
            }

	        job.sendToSingle(job.getPath(), job.getName());
            
        }catch(e){
            s.log(2, "Critical Error: Hierarchy: Zund")
            job.sendToNull(job.getPath())
        }
    }
    hierarchy(s, job)
}

function checkHierarchy(s, job, handoffData, phoenixPlan){
    for(var k=0; k<phoenixPlan.products.length; k++){
        for(var i=0; i<handoffData.products.length; i++){
            if(handoffData.products.getItem(i).evalToString("contentFile") == phoenixPlan.products.getItem(k).evalToString("name")){
                if(handoffData.products.getItem(i).evalToString("corner-method") == "Rounded" || handoffData.products.getItem(i).evalToString("shape-method") == "Custom"){
                    var path = job.getHierarchyPath()
                    var folder = path.splice(path.length-1,1) + "_Reversed";
                    job.setHierarchyPath([path,folder]);
                    return;
                }
            }
        }
    }
}