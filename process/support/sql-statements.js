generateSqlStatement_Insert = function(s, table, array) {
    function run(s, table, array){
        var headerArray = [];
        var valueArray = [];

        for (var i = 0; i < array.length; i++) {
            headerArray.push("`" + array[i][0] + "`");
            valueArray.push(sqlValue(s, array[i][1]));
        }

        var headerString = headerArray.join(', ');
        var valueString = valueArray.join(', ');

        var sql = "INSERT INTO " + table + " (" + headerString + ") VALUES (" + valueString + ");";

        return sql;
    }
    return run(s, table, array)
}

generateSqlStatement_Update = function(s, table, query, array) {
    function run(s, table, query, array){
        var setArray = [];
        var setQuery = [];

        for (var i = 0; i < array.length; i++) {
            setArray.push("`" + array[i][0] + "` = " + sqlValue(s, array[i][1]));
        }

        for (var i = 0; i < query.length; i++) {
            setQuery.push("`" + query[i][0] + "` = " + sqlValue(s, query[i][1]));
        }

        var setClause = setArray.join(', ');
        var whereClause = setQuery.join(' AND ');

        var sql = "UPDATE " + table + " SET " + setClause + " WHERE " + whereClause + ";";

        return sql;
    }
    return run(s, table, query, array)
}

sqlValue = function(s, value) {
    function run(s, value) {
        try {
            if (value === null || value === undefined) {
                return "NULL";
            }

            // Special handling for Error objects
            if (value instanceof Error) {
                value = "" + value;
            }

            // Check for Date object
            if (value && typeof value === "object" && typeof value.getMonth === "function" && typeof value.getDate === "function") {
                // Do Nothing
            }

            // If still an object, attempt JSON.stringify
            else if (typeof value === "object") {
                try {
                    value = JSON.stringify(value);
                } catch (e) {
                    s.log(3, "Failed to JSON.stringify: " + e);
                    return "'[Unserializable object]'";
                }
            }

            // Escape dangerous characters
            value = String(value)
                .replace(/\\/g, '\\\\')  // escape backslashes
                .replace(/'/g, "''");    // escape single quotes

            return "'" + value + "'";

        } catch (e) {
            s.log(3, "sqlValue error: " + e);
            return "'[Error in sqlValue]'";
        }
    }

    return run(s, value);
};

updateItemHistory = function(s, db, projectId, statusNote) {
    function run(s, db, projectId, statusNote){
        db.history.execute(generateSqlStatement_Update(s,"history.details_item",[
            ["project-id", projectId]
        ],[
            ["status", "Parse Failed"],
            ["note", statusNote]
        ]));
    }
    run(s, db, projectId, statusNote);
}

updateGangHistory = function(s, db, projectId, statusNote) {
    function run(s, db, projectId, statusNote){
        db.history.execute(generateSqlStatement_Update(s, "history.details_gang",[
            ["project-id", projectId]
        ],[
            ["status", "Parse Failed"],
            ["note", statusNote]
        ]));
    }
    run(s, db, projectId, statusNote);
}

updateEmailHistory = function(s, db, source, data, messages) {
    function run(s, db, source, data, messages){
        for (var i = 0; i < messages.length; i++) {
            var itemNumber = messages[i][0];
            var type = messages[i][1];
            var messageText = messages[i][2];

            db.email.execute(generateSqlStatement_Insert(s, "emails.parsed_data", [
                ["project_id", data.projectID],
                ["gang_number", data.gangNumber],
                ["item_number", itemNumber],
                ["source", source],
                ["message", messageText],
                ["type", type]
            ]));
        }
    }

    run(s, db, source, data, messages)
}

logItemFailure = function(s, db, reason, itemId, data) {
    function run(s, db, reason, itemId, data){
        data.notes.push([itemId, "Removed", reason]);
        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
            ["project-id", data.projectID],
            ["item-number", itemId]
        ], [
            ["status", "Removed from Gang"],
            ["note", reason]
        ]));
    }
    run(s, db, reason, itemId, data)
}

notificationQueue_Gangs = function(s, db, title, subject, message, projectId, jobItemId, type, metadataJson, email, messageData) {
    function run(s, db, title, subject, message, projectId, jobItemId, type, metadataJson, email, messageData){
        db.history.execute(generateSqlStatement_Insert(s, "history.alerts_gangs",[
            ["project_id", projectId],
            ["gang_number", jobItemId || null],
            ["type", type || "general"],
            ["title", title],
            ["subject", subject],
            ["message", message],
            ["message_data", messageData],
            ["metadata", metadataJson || null],
            ["created_by_email", email || "bret.c@digitalroominc.com"]
        ]));
    }
    run(s, db, title, subject, message, projectId, jobItemId, type, metadataJson, email, messageData)
}