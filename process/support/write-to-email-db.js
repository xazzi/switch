emailDatabase_write = function(s, db, table, source, data, message){
    function writeData(s, db, table, source, data){
        for(var i in message){
            db.email.execute(generateSqlStatement_Insert(s, "emails.`" + table + "`", [
                ["project_id", data.projectID],
                ["gang_number",data.gangNumber],
                ["item_number", message[i][0]],
                ["date", new Date()],
                ["source", source],
                ["message", message[i][2]],
                ["type", message[i][1]]
            ]));
        }
    }

    writeData(s, db, table, source, data)
}