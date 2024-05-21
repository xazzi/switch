runFinalize = function(s, job){
    function finalize(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));

            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                dateID: handoffDataDS.evalToString("//base/dateID"),
                facility: handoffDataDS.evalToString("//misc/facility"),
                dueDate: handoffDataDS.evalToString("//base/dueDate"),
                sku: handoffDataDS.evalToString("//base/sku"),
                type: handoffDataDS.evalToString("//base/type"),
                paper: handoffDataDS.evalToString("//base/paper"),
                process: handoffDataDS.evalToString("//base/process"),
                subprocess: handoffDataDS.evalToString("//base/subprocess"),
                prodMatFileName: handoffDataDS.evalToString("//base/prodMatFileName"),
                printer: handoffDataDS.evalToString("//settings/printer"),
                mount: handoffDataDS.evalToString("//settings/mount") == "true" ? "-Mount" : "",
                surface: handoffDataDS.evalToString("//settings/secondsurf") == "true" ? "-2ndSurf" : "",
                rush: handoffDataDS.evalToString("//base/rush") == "true" ? "-RUSH" : "",
                whiteink: handoffDataDS.evalToString("//settings/whiteink") == "true" ? "-W" : "",
                labelmaster: handoffDataDS.evalToString("//misc/labelmaster") == "true" ? true : false,
                laminate: {
                    active: handoffDataDS.evalToString("//laminate/active") == "true",
                    method: handoffDataDS.evalToString("//laminate/method"),
                    value: handoffDataDS.evalToString("//laminate/value")
                },
                coating: {
                    active: handoffDataDS.evalToString("//coating/active") == "true",
                    method: handoffDataDS.evalToString("//coating/method"),
                    value: handoffDataDS.evalToString("//coating/value")
                }
            }
            
            var phoenixPlanDS = loadDataset_db("Phoenix Plan");
            var phoenixPlan = {
                index: phoenixPlanDS.evalToString("//layouts/layout/index"),
                qty: phoenixPlanDS.evalToString("//layouts/layout/run-length")
            }
            
            var name = {
                process: handoffData.prodMatFileName,
                subprocess: "",
                laminate: null
            }
            
            var fileStat = new FileStatistics(job.getPath());
            var numberOfPages = 1;
            if(job.getExtension() == "pdf"){
                numberOfPages = fileStat.getNumber("NumberOfPages");
            }
            
            var date = new Date();
            var data = {
                processType: job.getPrivateData("Type"),
                filename: job.getVariableAsString("[Job.NameProper]", s)
            }
                
            var savename = job.getName();
            
            // Salt Lake City ------------------------------------------------------------------------------------------------
            if(handoffData.facility == "Salt Lake City"){
                
                // Subprocess name changes.             
                // Buttcuts
                if(handoffData.subprocess == "ButtCut"){
                    phoenixPlan.itemNumber = phoenixPlanDS.evalToString("//products/product/properties/property[6]/value");
                    name.subprocess = "-ButtCut-" + phoenixPlan.itemNumber;
                }
                
                // Backdrops
                if(handoffData.subprocess == "Backdrop"){
                    if(handoffData.process == "13ozBanner"){
                        name.process = "13oz";
                        name.subprocess = "Backdrop";
                    }
                    if(handoffData.process == "18ozBanner"){
                        name.process = "18oz";
                        name.subprocess = "Backdrop";
                    }
                }

                // Laminate
                name.laminate = (handoffData.laminate.active || handoffData.coating.active) ? "-Lam" : "";

                // FloorDecal
                if(handoffData.process == "FloorDecal"){
                    name.laminate = ""
                }
            
                // Date and side information
                data.dateID = date.getMonth() + "-" + date.getDate();
                data.dateProper = handoffData.dateID + "-" + handoffData.sku + "-" + phoenixPlan.index;
                data.side = data.filename.match(new RegExp("S1","g")) ? "_F" : data.filename.match(new RegExp("S2","g")) ? "_B" : '';
                
                // Hierarchy
                if(data.processType == "Print"){
                    savename = data.dateProper + "_" + name.process + name.subprocess + handoffData.surface + name.laminate + handoffData.mount + handoffData.whiteink + handoffData.rush + "_Q" + phoenixPlan.qty + data.side + "_" + handoffData.projectID + phoenixPlan.index + ".pdf";
                }
                
                if(data.processType == "Cut"){
                    savename = data.dateProper + "_" + name.process + name.subprocess + "_CUT" + "_Q" + phoenixPlan.qty + "_" + handoffData.projectID + phoenixPlan.index + ".pdf";
                }
                
                if(data.processType == "Summary"){				
                    savename = data.dateProper + "_" + name.process + name.subprocess + "-Report_" + handoffData.projectID + ".pdf";
                }

                job.sendToSingle(job.getPath(), savename.toString());
            }
            
            // Brighton ------------------------------------------------------------------------------------------------
            if(handoffData.facility == "Wixom"){
                data.dateID = handoffData.dueDate.split('-')[1] + handoffData.dueDate.split('-')[2];
                data.side = numberOfPages == 1 ? "_SS" : "_DS";
                
                if(data.processType == "Print"){
                    savename = handoffData.projectID + "-" + phoenixPlan.index + "_" + name.process + "_" + phoenixPlan.qty + "qty_" + data.dateID + data.side + ".pdf";
                }
                
                if(data.processType == "Cut"){
                    savename = handoffData.projectID + "-" + phoenixPlan.index + "_" + name.process + "_" + phoenixPlan.qty + "qty_" + data.dateID + "_Cut" + ".pdf";
                }
                
                if(data.processType == "Summary"){				
                    savename = handoffData.projectID + "_Report" + ".pdf";
                }
                
                job.sendToSingle(job.getPath(), savename.toString());
            }
            
            // Solon ------------------------------------------------------------------------------------------------
            if(handoffData.facility == "Solon"){
                data.dateID = handoffData.dueDate.split('-')[1] + handoffData.dueDate.split('-')[2];
                if(handoffData.laminate.method == "null"){
                    name.laminate = ""
                }else{
                    name.laminate = "_" + handoffData.laminate.method
                }
                
                if(data.processType == "Print"){
                    savename = handoffData.projectID + "-" + phoenixPlan.index + "_" + name.process + name.laminate + "_" + phoenixPlan.qty + "Frames_" + data.dateID + ".pdf";
                }

                if(data.processType == "CSV"){
                    savename = handoffData.projectID + "-" + phoenixPlan.index + "-Header" + ".pdf";
                }
                
                if(data.processType == "Cut"){
                    savename = handoffData.projectID + "-" + phoenixPlan.index + "-CUT" + ".pdf";
                }
                
                if(data.processType == "Summary"){				
                    savename = handoffData.projectID + "_Report" + ".pdf";
                }
                
                job.sendToSingle(job.getPath(), savename.toString());
            }
            
            // Arlington ------------------------------------------------------------------------------------------------
            if(handoffData.facility == "Arlington"){
                data.dateID = handoffData.dueDate.split('-')[1] + handoffData.dueDate.split('-')[2];

                if(data.filename.match(new RegExp("S1","g"))){
                    data.side = "_F";
                }else if(data.filename.match(new RegExp("S2","g"))){
                    data.side = "_B";
                }else{
                    data.side = numberOfPages == 1 ? "_SS" : "_DS";
                }
                
                if(data.processType == "Print"){
                    savename = handoffData.projectID + "-" + phoenixPlan.index + "_" + name.process + "_" + phoenixPlan.qty + "qty_" + data.dateID + data.side + ".pdf";
                }
                
                if(data.processType == "Cut"){
                    savename = handoffData.projectID + phoenixPlan.index + "_" + name.process + "_" + phoenixPlan.qty + "qty_" + data.dateID + "_Cut" + ".pdf";
                }
                
                if(data.processType == "Summary"){				
                    savename = handoffData.projectID + "_Report" + ".pdf";
                }
                
                job.sendToSingle(job.getPath(), savename.toString());
            }

            // Van Nuys ------------------------------------------------------------------------------------------------
            if(handoffData.facility == "Van Nuys"){
                data.dateID = handoffData.dueDate.split('-')[1] + handoffData.dueDate.split('-')[2];
                data.side = numberOfPages == 1 ? "_SS" : "_DS";
                handoffData.surface = handoffDataDS.evalToString("//settings/secondsurf") == "true" ? "-MIRROR" : "";
                
                if(data.processType == "Print"){
                    if(handoffData.process == "RollLabel"){
                        savename = handoffData.projectID + " Layout " + phoenixPlan.index + " " + handoffData.paper + " " + phoenixPlan.qty + " Frames" + ".pdf";
                    }else{
                        savename = handoffData.projectID + "-" + phoenixPlan.index + "_" + name.process + "_" + phoenixPlan.qty + "qty_" + data.dateID + handoffData.surface + ".pdf";
                    }
                }
                
                if(data.processType == "Cut"){
                    if(handoffData.process == "RollLabel"){
                        savename = handoffData.projectID + "-" + phoenixPlan.index + ".pdf";
                    }else{
                        savename = handoffData.projectID + "-" + phoenixPlan.index + "_" + name.process + "_" + phoenixPlan.qty + "qty_" + data.dateID + "_Cut" + ".pdf";
                    }
                }
                
                if(data.processType == "Summary"){				
                    savename = handoffData.projectID + "_Report" + ".pdf";
                }
                
                job.sendToSingle(job.getPath(), savename.toString());
            }
            
        }catch(e){
            s.log(2, "Critical Error: Finalize")
            job.sendToNull(job.getPath())
        }
    }
    finalize(s, job)
}