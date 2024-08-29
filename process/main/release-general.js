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
            eval(File.read(dir.support + "/get-column-index.js"));
            eval(File.read(dir.support + "/sql-statements.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

            var statuses = [
                "Ready to Gang",
                "Already Exists",
                "Error",
                "Missing File",
                "Missing Cut Path",
                "Removed from Gang"
            ]

            // Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                general: new Statement(connections.general),
                history: new Statement(connections.history),
                email: new Statement(connections.email)
            }
            
            var secondInterval = 5;
                s.setTimerInterval(secondInterval);
            
            // Set the threshold that the system waits
            var threshold = 15 * 60000;
            var now = new Date();
            
            // Set some directories.
            var csvDepository = new Dir("C:/Switch/Depository/csvHold/" + module.localEnvironment);
            var toPhoenix = getDirectory("C:/Switch/Depository/toPhoenix/" + module.localEnvironment + "/" + module.phoenixServer);

            // Find the CSV's
            var csvFiles = csvDepository.entryList("*.csv", Dir.Files, Dir.Name);
            
            for(var i=0; i<csvFiles.length; i++){

                // Open the csv files, sequentially, 1 at a time.
                var csvFile = new File(csvDepository.absPath + "/" + csvFiles[i]);
                    
                // Check the CSV to see if we can send the gang to Phoenix
                if(checkCSV(s, db, statuses, csvFile)){
                    s.move(csvDepository.absPath + "/" + csvFiles[i], toPhoenix.dir.absPath + "/" + csvFiles[i], true);
                    s.log(2, csvFiles[i] + ": Sent to Phoenix.")
                    continue;
                }
                
                var modified = new Date(csvFile.lastModified);
        
                if(now.getTime() - modified.getTime() > threshold){
                    s.move(csvDepository.absPath + "/" + csvFiles[i], toPhoenix.dir.absPath + "/" + csvFiles[i], true);
                    s.log(2, csvFiles[i] + ": Time limit reached, sent to Phoenix.");
                    continue;
                }
            }
                
        }catch(e){
            s.log(2, "Critical Error!: " + e);
        }
    }
    release(s)
}

function checkCSV(s, db, statuses, csvFile){

    // Open the file for the script to read.
    csvFile.open(File.ReadOnly);

    // Read the headers of the csv files and associate them to an index for reference later.
    var index = getColumnIndex(s, csvFile)

    // Assign some variables.
    var skipFirst = true

    // Scan through the CSV to see if it's ready to send to Phoenix.
    while(!csvFile.eof){

        // Skip the header row.
        if(skipFirst){
            skipFirst = false;
            continue;
        }

        // Read the line in.
        var line = csvFile.readLine();
            line = line.replace(/\"/g,' ');
            line = line.split(';');

        // Check if the file exists in the repository already.
        var repoFile = new File(line[index.artworkFile]);

        // If the file exists, continue through the csv.
        if(repoFile.exists){
            continue;
        }

        // If it doesn't exist, check the database to see if we can skip it.
        if(!repoFile.exists){
            db.history.execute("SELECT * FROM history.details_item WHERE `item-number` = '" + line[index.itemNumber] + "' AND `project-id` = '" + line[index.projectID] + "';");
            if(db.history.isRowAvailable()){
                db.history.fetchRow();
                if(!contains(statuses, db.history.getString(7))){
                    // If the file isn't skippable, end the while loop.
                    csvFile.close();
                    return false
                }
            }else{
                // Add some exceptions here to send an alert to teams.
                s.log(2, "Row not available, notify Bret.")
                return false
            }
        }
    }

    // Close the CSV
    csvFile.close();

    // If it makes it this far, assume the files are ready.
    return true
}