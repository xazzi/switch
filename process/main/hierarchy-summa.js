runHierarchy = function(s, job){
    function hierarchy(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            eval(File.read(dir.support + "/get-next-shipdate.js"));
	
            var newPath = [];
            var nextShipDate = getNextShipDate();
            var saveDir = nextShipDate.month + "-" + nextShipDate.date;
            
                newPath.push("Processed" + "/" + saveDir + "/");
                    
                job.addTopHierarchySegment([newPath]);	
                job.sendToSingle(job.getPath());
            
        }catch(e){
            s.log(2, "Critical Error: Hierarchy-Summa")
            job.sendToNull(job.getPath())
        }
    }
    hierarchy(s, job)
}