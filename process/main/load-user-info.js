//chelsea was here
getUserInfo = function(s, job){
    function run(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/",
                subprocess: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/subprocess/"),
                phoenixMarks: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/phoenix marks/"),
                phoenixScripts: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/phoenix scripts/")
            }
            
            // Load in all of the supporting libraries and functions
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/get-itemdata.js"));
            eval(File.read(dir.support + "/get-next-shipdate.js"));
            eval(File.read(dir.support + "/get-ship-type.js"));
            eval(File.read(dir.support + "/info-material.js"));
            eval(File.read(dir.support + "/sku-generator.js"));
            eval(File.read(dir.support + "/email-responses.js"));
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/get-subprocess.js"));
            eval(File.read(dir.support + "/set-phoenix-marks.js"));
            eval(File.read(dir.support + "/set-phoenix-scripts.js"));
            eval(File.read(dir.support + "/add-to-table.js"));
            eval(File.read(dir.support + "/compile-csv.js"));
            eval(File.read(dir.support + "/set-hem-labels.js"));
            eval(File.read(dir.support + "/set-product-labels.js"));
            eval(File.read(dir.support + "/write-to-email-db.js"));
            eval(File.read(dir.support + "/get-edge-finishing.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));
            eval(File.read(dir.support + "/sql-statements.js"));
            eval(File.read(dir.support + "/get-target-height.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

            // Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                general: new Statement(connections.general),
                history: new Statement(connections.history),
                email: new Statement(connections.email)
            }

            // Force user dev settings.
            if(module.devSettings.forceUser == "Bret Combe"){
                job.setUserName("Administrator");
                job.setUserFullName("Bret Combe");
                job.setUserEmail("bret.c@digitalroominc.com");
            }
                
            // Pull the user information.
            db.general.execute("SELECT * FROM digital_room.users WHERE email = '" + job.getUserEmail() + "';");
            if(!db.general.isRowAvailable()){
                sendEmail_db(s, data, null, getEmailResponse("Undefined User", null, null, data, job.getUserEmail(), null), null);
                job.sendToNull(job.getPath());
                db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                    ["project-id", data.projectID]
                ],[
                    ["status","Parse Failed"],
                    ["note","Undefined user."]
                ]))
                return;
            }
                db.general.fetchRow();
                
            var userInfo = {
                first: db.general.getString(1),
                last: db.general.getString(2),
                email: db.general.getString(3),
                dir: db.general.getString(4) == null ? "Unknown User" : db.general.getString(1) + " " + db.general.getString(2) + " - " + db.general.getString(4),
                fileSource: getFileSource(db.general.getString(9))
            }

        }catch(e){

        }
    }
}