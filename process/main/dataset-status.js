runDatasetStatus = function(s, job, codebase){
    function datasetStatus(s, job, codebase){
        try{
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));

            var exists = checkDataset_db(s.getPropertyValue("dataset"))

            if(exists){
                job.sendTo(findConnectionByName_db(s, "Exists"), job.getPath());
            }else{
                job.sendTo(findConnectionByName_db(s, "Missing Dataset"), job.getPath());
            }
            
        }catch(e){
            s.log(2, "Critical Error: Dataset Status Check")
            job.fail("Critial Error: " + e)
        }
    }
    datasetStatus(s, job, codebase)
}