runPost = function (s, job, codebase) {
    function post(s, job, codebase) {
        try {
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/"
            };

            // Read in any support directories
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));
            eval(File.read(dir.support + "/sql-statements.js"));
            eval(File.read(dir.support + "/webhook-post.js"));

            // --- DATASET LOADING ---
            var handoffDataDS = loadDatasetNoFail_db("Handoff Data");

            // --- MODULE SETTINGS ---
            var module = loadModuleSettings(s);

            // --- DB CONNECTIONS ---
            var connections = establishDatabases(s, module);
            var db = {
                settings: new Statement(connections.settings),
                history: new Statement(connections.history),
                email: new Statement(connections.email)
            };

            var channel = s.getPropertyValue("channel");

            // Pull the channel URL from the table.
            db.settings.execute("SELECT * FROM settings.webhooks_teams WHERE channel = " + sqlValue(s, channel) + ";");
            if (!db.settings.isRowAvailable()){
                s.log(3, "Teams channel not found in database: " + channel);
                return;
            }
            db.settings.fetchRow();

            // Call the function that writes to the tables.
            postWebhook(s, job, db, channel, safeProperty(s, "message"), [
                ["Element", safeProperty(s, "element")],
                ["Flow", safeProperty(s, "flow")],
                ["Gang", safeEval(handoffDataDS, "//base/gangNumber")],
                ["Process", safeEval(handoffDataDS, "//base/process")],
                ["Subprocess", safeEval(handoffDataDS, "//base/subprocess")]
            ]);
            
            job.sendToNull(job.getPath());

        } catch (e) {
            s.log(3, "Critical Error (Teams Webhook): " + e);

            try{
                job.sendTo(findConnectionByName_db(s, "Failed"), job.getPath());
            }catch(e){
                job.fail(e);
            }
        }
    }

    post(s, job, codebase);
};