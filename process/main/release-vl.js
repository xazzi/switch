runRelease = function(s){
    function release(s){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

            // Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                general: new Statement(connections.general),
                email: new Statement(connections.email),
                history: new Statement(connections.history)
            }

            // Collect the handoff data.
            var handoffDataDS = loadDataset_db("Handoff Data");
            var handoffData = {
                sku: handoffDataDS.evalToString("//base/sku")
            }
                    
            var repository = new Dir("//10.21.71.213/Repository_VL");
            
            var oldCSV = {}
                oldCSV.file = new File(job.getPath());
                oldCSV.file.open(File.ReadOnly);

            var replacement = {
                name: null,
                file: null,
                group: null,
                stock: null
            }

            // Create the CSV and the new Job() for the project.
            var newCSV = {}
                newCSV.job = s.createNewJob();
                newCSV.path = newCSV.job.createPathWithName(job.getName(), false);
                newCSV.file = new File(newCSV.path);
                newCSV.file.open(File.Append);

            while(!oldCSV.file.eof){
                var line = oldCSV.file.readLine();
                    line = line.replace(/\"/g,' ');
                    line = line.split(';');
                
                // Find the index of the columns we need to splice.
                if(line[0] == "Name"){
                    for(var j in line){
                        if(line[j] == "Name"){
                            replacement.name = j
                        }
                        if(line[j] == "Artwork File"){
                            replacement.file = j
                        }
                        if(line[j] == "Group"){
                            replacement.group = j
                        }
                        if(line[j] == "Stock"){
                            replacement.stock = j
                        }
                    }
                    writeCSV(s, newCSV.file, line);
                    continue;
                }

                // Search the folder for the matching files.
                var filesReady = repository.entryList(line[0].split('.pdf')[0] + "*.pdf", Dir.Files, Dir.Name);
                var color, width, layoutType

                // Splice in the replacement information.
                for(var k in filesReady){

                    color = filesReady[k].split('_')[filesReady[k].split('_').length-1].split('.')[0];
                    filename = filesReady[k].split('_' + color)[0]

                    db.general.execute("SELECT * FROM digital_room.`cut-vinyl_library` where `name` = '" + color + "';");
                    db.general.fetchRow();
                    width = db.general.getString(4);

                    db.history.execute("SELECT * FROM history.`vinyl_lettering` where `sku` = '" + handoffData.sku + "' AND `phoenix-filename` = '" + filename + "' AND `color` = '" + color + "';");
                    db.history.fetchRow();
                    layoutType = db.history.getString(8);

                    line.splice(replacement.name,1,filesReady[k]);
                    line.splice(replacement.file,1,repository.path + "/" + filesReady[k]);
                    line.splice(replacement.group,1,color + "_" + layoutType);
                    line.splice(replacement.stock,1,"Mat_CutVinyl_" + width);
                    writeCSV(s, newCSV.file, line);
                }
            }

            newCSV.file.close();
            oldCSV.file.close();

            newCSV.job.setHierarchyPath([module.localEnvironment, module.phoenixServer]);
            newCSV.job.setDataset("Handoff Data", job.getDataset("Handoff Data"));
            newCSV.job.setDataset("Check", job.getDataset("Check"));
            newCSV.job.setUserEmail(job.getUserEmail());
            newCSV.job.setUserName(job.getUserName());
            newCSV.job.setUserFullName(job.getUserFullName());
            newCSV.job.sendToSingle(newCSV.path, newCSV.path);

            job.sendToNull(job.getPath())

        }catch(e){
            s.log(2, "Critical Error!: " + e);
        }
    }
    release(s)
}

function writeCSV(s, file, array){
	for(var n=0; n<array.length; n++){
		file.write(array[n]);
		if(n != array.length-1){
			file.write(";");
		}
	}
	file.writeLine("")
}