runRelease = function(s){
    function release(s){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }
        
            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            
            var secondInterval = 5;
                s.setTimerInterval(secondInterval);
                
            var environment = s.getPropertyValue("environment");
            var server = s.getPropertyValue("phoenixServer");
            
            var dbConn = connectToDatabase_db(s.getPropertyValue("database"));
                    
            var pdfDepository = new Dir("//10.21.71.213/Storage/pdfDepository");
            var csvDepository = new Dir("C:/Switch/Depository/csvHold/" + environment);

            var toPhoenix = getDirectory("C:/Switch/Depository/toPhoenix/" + environment + "/" + server);
            
            var threshold = 5 * 60000; //5 mins
            var now = new Date();
                        
            var csvFiles = csvDepository.entryList("*.csv", Dir.Files, Dir.Name);
            
            for(var i=0; i<csvFiles.length; i++){		
                var pdfReady
                    
                var csvFile = new File(csvDepository.absPath + "/" + csvFiles[i]);
                    csvFile.open(File.ReadOnly);

                while(!csvFile.eof){
                    var line = csvFile.readLine();
                    line = line.replace(/\"/g,' ');
                    line = line.split(';');
                    
                    if(line[0] == "Name"){
                        continue;
                    }
                    
                        pdfReady = false;
                    
                    var existCheck = new File(pdfDepository.absPath + "/" + line[1]);
                    if(existCheck.exists){
                        pdfReady = true;
                        continue;
                    }
                    
                    if(!pdfReady){
                        var dbQuery = new Statement(dbConn);
                            dbQuery.execute("SELECT * FROM digital_room.missing_file WHERE file_name = '" + line[0] + "';");
                        if(dbQuery.isRowAvailable()){
                            pdfReady = true;
                            break;
                        }
                    }
                    
                    if(!pdfReady){
                        // If the file is not ready and has not been logged as failed, break out of the loop and continue with !pdfReady
                        break;
                    }
                }

                    csvFile.close();
                
                if(pdfReady == true){
                    s.move(csvDepository.absPath + "/" + csvFiles[i], toPhoenix.dir.absPath + "/" + csvFiles[i], true);
                    break;
                }
                
                var modified = new Date(csvFile.lastModified);
        
                if(now.getTime() - modified.getTime() > threshold){
                    s.move(csvDepository.absPath + "/" + csvFiles[i], toPhoenix.dir.absPath + "/" + csvFiles[i], true);
                    s.log(2, "Time limit reached, sent to Phoenix.");
                    break;
                }
            }
                
        }catch(e){
            s.log(2, "Critical Error!: " + e);
        }
    }
    release(s)
}