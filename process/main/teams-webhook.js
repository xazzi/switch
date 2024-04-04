runPost = function(s, job){
    function post(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));

            var server = s.getPropertyValue("url")

            /*
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffObj = {
                projectID: handoffDataDS.evalToString("//base/projectID"),
                material: handoffDataDS.evalToString("//base/process"),
                doublesided: false, //handoffDataDS.evalToString("//settings/doublesided") == "true",
                whiteink: handoffDataDS.evalToString("//settings/whiteink") == "true",
                laminate: handoffDataDS.evalToString("//settings/laminate") == "true",
                secondsurface: handoffDataDS.evalToString("//settings/secondsurf") == "true",
                printer: handoffDataDS.evalToString("//settings/printer")
            }
            */
            
            /*
            var doc = new Document(job.getPath());	
            var map = doc.createDefaultMap();
            var layoutNodes = doc.evalToNodes('//job/layouts/layout', map);

            // Check if it's actually DS or SS printing. (2 pages)
            for(var i=0; i<layoutNodes.length; i++){
                
                var sideCheck = {
                    front: false,
                    back: false
                }

                var surfaceNodes = layoutNodes.at(i).evalToNodes('surfaces/surface');
                for(var k=0; k<surfaceNodes.length; k++){
                    if(surfaceNodes.at(k).evalToString('side') == "Front"){
                        sideCheck.front = true
                    }
                    if(surfaceNodes.at(k).evalToString('side') == "Back"){
                        sideCheck.back = true
                    }
                }

                if(sideCheck.front && sideCheck.back){
                    handoffObj.doublesided = true;
                    break;
                }
            }
            
            var newJob = s.createNewJob();
            var xmlfile = newJob.createPathWithName(doc.evalToString('//job/id', map) + ".json", false);
            var xmlF = new File(xmlfile);
            //var xmlF = new File("C://Switch//Development//" + doc.evalToString('//job/id', map) + ".json");
                xmlF.open(File.Append);
                xmlF.writeLine('{');
                
                xmlF.writeLine('"Description": "' + handoffObj.projectID + '",');
                xmlF.writeLine('"Workspace": "' + handoffObj.printer + '",');
                xmlF.writeLine('"Material": "' + handoffObj.material + '",');
                xmlF.writeLine('"Status": ' + '1' + ',');
                xmlF.writeLine('"CodeType": ' + '1' + ',');
                xmlF.writeLine('"Rush": ' + false + ',');
                xmlF.writeLine('"WhiteInk": ' + handoffObj.whiteink + ',');
                xmlF.writeLine('"DoubleSided": ' + handoffObj.doublesided + ',');
                xmlF.writeLine('"SecondSurface": ' + handoffObj.secondsurface + ',');
                xmlF.writeLine('"Laminate": ' + handoffObj.laminate + ',');
                xmlF.writeLine('"Premask": ' + false + ',');
                
                //layout loop starts here
                xmlF.writeLine('"Layouts": ' + '[' + '');	
                for(var i=0; i<layoutNodes.length; i++){
                    xmlF.writeLine('{');
                    
                    xmlF.writeLine('"GangNo": "' + doc.evalToString('//job/id', map) + "-" + layoutNodes.at(i).evalToString('index') + '"');
                    
                    if(i != layoutNodes.length-1){
                        xmlF.writeLine('},');
                    }else{
                        xmlF.writeLine('}');
                    }
                }
    
                xmlF.writeLine(']');	
                xmlF.writeLine('}');
                xmlF.close();

                */
                
            // Post the above json to the API.
            var theHTTP = new HTTP(HTTP.SSL);
                theHTTP.url = server;
                theHTTP.enableMime = false;
                theHTTP.setAttachedFile(job.getPath());
                theHTTP.timeOut = 300;
                theHTTP.post();
                
            while(!theHTTP.waitForFinished(10)){
                s.log(5, "Posting to Teams...", theHTTP.progress());
            }
            
            if(theHTTP.finishedStatus == HTTP.Failed || theHTTP.statusCode !== 200){
                s.log(3, "Teams post failed: " + theHTTP.lastError);
                job.fail(e);
                return;
            }
                    
            job.sendToSingle(job.getPath()) 
            
        }catch(e){
            s.log(2, "Critical Error: Teams Message")
            job.fail(e);
        }
    }
    post(s, job)
}