generateSqlStatement_Insert = function(s, table, array) {
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

sqlValue = function(s, value) {
    if (value === null || value === undefined) {
        return "NULL";
    }

    // Check for Date object
    if (value && typeof value === "object" && typeof value.getMonth === "function" && typeof value.getDate === "function") {
        //value = formatDate(value);  // convert to string
    }

    // Convert plain object to JSON
    else if (typeof value === "object") {
        try {
            s.log(1, "Final messageData: " + JSON.stringify(value));
            value = JSON.stringify(value);
        } catch (e) {
            s.log(3, "Unable to stringify object: " + e);
            return "'[Unserializable object]'";
        }
    }

    // Escape single quotes
    return "'" + value.toString().replace(/'/g, "''") + "'";
}

generateSqlStatement_Update = function(s, table, query, array) {
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

updateItemHistory = function(s, db, projectId, statusNote) {
    db.history.execute(generateSqlStatement_Update(s,"history.details_item",[
        ["project-id", projectId]
    ],[
        ["status", "Parse Failed"],
        ["note", statusNote]
    ]));
}

updateGangHistory = function(s, db, projectId, statusNote) {
    db.history.execute(generateSqlStatement_Update(s, "history.details_gang",[
        ["project-id", projectId]
    ],[
        ["status", "Parse Failed"],
        ["note", statusNote]
    ]));
}

notificationQueue_Gangs = function(s, db, title, subject, message, projectId, jobItemId, type, metadataJson, email, messageData) {
    db.history.execute(generateSqlStatement_Insert(s, "history.alerts_gangs",[
        ["project_id", projectId],
        ["gang_number", jobItemId || null],
        ["type", type || "general"],
        ["title", title],
        ["subject", subject],
        ["message", message],
        ["message_data", messageData],
        ["metadata", metadataJson || null],
        ["to_email", email.to || "bret.c@digitalroominc.com"],
        ["cc_email", email.cc]
    ]));
}

notificationQueue_Items = function(s, db, title, subject, message, projectId, jobItemId, type, metadataJson, email, messageData) {
    db.history.execute(generateSqlStatement_Insert(s, "history.alerts_gangs",[
        ["project_id", projectId],
        ["gang_number", jobItemId || null],
        ["type", type || "general"],
        ["title", title],
        ["subject", subject],
        ["message", message],
        ["message_data", messageData],
        ["metadata", metadataJson || null],
        ["to_email", email.to || "bret.c@digitalroominc.com"],
        ["cc_email", email.cc]
    ]));
}