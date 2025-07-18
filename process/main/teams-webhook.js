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

            // --- DATASET LOADING ---
            var handoffDataDS = loadDatasetNoFail_db("Handoff Data");

            // --- CREATE FILE PATH TO LOG JSON LOCALLY ---
            var newJob = s.createNewJob();
            var jsonPath = newJob.createPathWithName("Submit.json", false);
            var jsonFile = new File(jsonPath);

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

            db.settings.execute("SELECT * FROM settings.webhooks_teams WHERE channel = " + sqlValue(s, channel) + ";");
            if (!db.settings.isRowAvailable()){
                s.log(3, "Teams channel not found in database: " + channel);
                return;
            }
            db.settings.fetchRow();

            // --- CONSTRUCT WEBHOOK PAYLOAD ---
            var messageCard = {
                type: "MessageCard",
                summary: s.getServerName(),
                sections: []
            };

            var fields = [
                ["Element", s.getPropertyValue("element")],
                ["Server", s.getServerName()],
                ["Flow", s.getPropertyValue("flow")],
                ["File", job.getName()],
                ["User", job.getUserFullName()],
                ["Gang", safeEval(handoffDataDS, "//base/gangNumber")],
                ["Process", safeEval(handoffDataDS, "//base/process")],
                ["Subprocess", safeEval(handoffDataDS, "//base/subprocess")]
            ];

            var structure = {
                activityTitle: s.getPropertyValue("message"),
                facts: []
            };

            for (var i = 0; i < fields.length; i++) {
                structure.facts.push({
                    name: fields[i][0],
                    value: fields[i][1] || "Unknown"
                });
            }

            //var type = s.getPropertyValue("alertType") || "info";

            // TODO - Do something with this.
            var colorMap = {
                info: "0078D7",    // blue
                success: "28A745", // green
                warning: "FFC107", // amber
                error: "DC3545"    // red
            };

            messageCard.themeColor = colorMap["error"] || colorMap["info"];
            messageCard.sections.push(structure);

            // --- LOG JSON LOCALLY ---
            jsonFile.open(File.Append);
            jsonFile.writeLine(JSON.stringify(messageCard));
            jsonFile.close();

            // --- SAVE TO DB QUEUE ---
            db.settings.execute(
                "INSERT INTO history.webhook_teams_queue (channel, payload) VALUES (" +
                sqlValue(s, channel) + ", " +
                sqlValue(s, messageCard) + ");"
            );

            s.log(1, "Webhook payload saved to queue.");
            job.sendToNull(job.getPath());

        } catch (e) {
            s.log(3, "Critical Error (Teams Webhook): " + e);
            job.fail(e);
        }
    }

    function safeEval(dataset, xpath) {
        try {
            return dataset.evalToString(xpath);
        } catch (e) {
            return "Unknown";
        }
    }

    post(s, job, codebase);
};