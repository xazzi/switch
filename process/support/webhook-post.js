postWebhook = function(s, job, db, channel, message, additionalFields) {
    function run(s, job, db, channel, message, additionalFields){
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
            ["User", job.getUserFullName()]
        ];

        if (additionalFields && additionalFields.length) {
            fields = fields.concat(additionalFields);
        }

        var structure = {
            activityTitle: message,
            facts: []
        };

        for (var i = 0; i < fields.length; i++) {
            structure.facts.push({
                name: fields[i][0],
                value: fields[i][1] || "Unknown"
            });
        }

        var colorMap = {
            info: "0078D7",
            success: "28A745",
            warning: "FFC107",
            error: "DC3545"
        };

        messageCard.themeColor = colorMap["error"];
        messageCard.sections.push(structure);

        var newJob = s.createNewJob();
        var jsonPath = newJob.createPathWithName("Submit.json", false);
        var jsonFile = new File(jsonPath);

        jsonFile.open(File.Append);
        jsonFile.writeLine(JSON.stringify(messageCard));
        jsonFile.close();

        db.execute(
            "INSERT INTO history.webhook_teams_queue (channel, payload) VALUES (" +
            sqlValue(s, channel) + ", " +
            sqlValue(s, messageCard) + ");"
        );

        s.log(1, "Webhook payload saved to queue.");
    }
    
    run(s, job, db, channel, message, additionalFields)
}