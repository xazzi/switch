postWebhook = function(s, job, db, channel, message, additionalFields) {
    function run(s, job, db, channel, message, additionalFields){
        var messageCard = {
            type: "MessageCard",
            summary: s.getServerName(),
            sections: []
        };

        var fields = [
            ["Server", s && s.getServerName ? s.getServerName() : "Unknown"],
            ["File", job 
                ? (typeof job.getName === "function" ? job.getName() : (job.file || "Unknown"))
                : "Unknown"
            ],
            ["User", job
                ? (typeof job.getUserFullName === "function" ? job.getUserFullName() : (job.user || "Unknown"))
                : "Unknown"
            ]
        ];

        if (additionalFields && additionalFields.length) {
            fields = fields.concat(additionalFields);
        }

        var structure = {
            activityTitle: message,
            facts: []
        };

        // Iterate through the fields and add them to the facts.
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

        db.history.execute(
            "INSERT INTO history.webhook_teams_queue (channel, payload) VALUES (" +
            sqlValue(s, channel) + ", " +
            sqlValue(s, messageCard) + ");"
        );
    }
    
    run(s, job, db, channel, message, additionalFields)
}

safeProperty = function(s, key, fallback) {
    try {
        var val = s.getPropertyValue(key);
        return (val !== undefined && val !== null) ? val.toString() : fallback || "Unknown";
    } catch (e) {
        return fallback || "Unknown";
    }
}