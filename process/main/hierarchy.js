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
                projectID: handoffDataDS.evalToString("//base/projectID"),
                gangNumber: handoffDataDS.evalToString("//base/gangNumber"),
                dateID: handoffDataDS.evalToString("//base/dateID"),
                saveDir: handoffDataDS.evalToString("//base/saveLocation"),
                facility: handoffDataDS.evalToString("//misc/facility"),
                dueDate: handoffDataDS.evalToString("//base/dueDate"),
                sku: handoffDataDS.evalToString("//base/sku"),
                paper: handoffDataDS.evalToString("//base/paper"),
                process: handoffDataDS.evalToString("//base/process"),
                subprocess: handoffDataDS.evalToString("//base/subprocess"),
                prodMatFileName: handoffDataDS.evalToString("//base/prodMatFileName"),
                printer: handoffDataDS.evalToString("//settings/printer")
            }
            
            var data = {
                processType: job.getPrivateData("Type")
            }
        
                newPath.push("Processed" + "/" + handoffData.saveDir);
            
            // Salt Lake City ------------------------------------------------------------------------------------------------
            if(handoffData.facility == "Salt Lake City"){
                
                // Hierarchy
                if(data.processType == "Print"){
                    newPath.push("/To Rip/" + handoffData.process + "/");
                }
                
                if(data.processType == "Cut"){
                    newPath.push("/To Cut/" + handoffData.process + "/");
                }
                
                if(data.processType == "Summary"){				
                    newPath.push("/Summary/" + handoffData.gangNumber + "/");
                }
                
                if(data.processType == "Rejected"){				
                    newPath.push("/Summary/" + handoffData.gangNumber + "/Rejected/" + handoffData.projectID + "/");
                }
                
                if(data.processType == "Failed"){				
                    newPath.push("/Summary/" + handoffData.gangNumber + "/Failed/" + handoffData.projectID + "/");
                }
                
                if(data.processType == "XML"){				
                    newPath.push("/Summary/" + handoffData.gangNumber + "/");
                }
                
                if(data.processType == "PHX"){
                    newPath.push("/Summary/" + handoffData.gangNumber + "/");
                }
                
                job.setHierarchyPath(newPath);
                job.sendToSingle(job.getPath(), job.getName());
            }
            
        }catch(e){
            s.log(2, "Critical Error: Hierarchy")
            job.sendToNull(job.getPath())
        }
    }
    hierarchy(s, job)
}