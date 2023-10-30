emailDatabase_write = function(s, db, table, source, data, message){
    function writeData(s, db, table, source, data){
        for(var i in message){
            db.email.execute("INSERT INTO emails.`" + table + "` (sku, `gang-number`, `item-number`, date, source, message, type) VALUES ('" + data.sku + "','" + data.projectID + "','" + message[i][0] + "','" + new Date() + "','" + source + "','" + message[i][2] + "','" + message[i][1] + "');");
        }
    }

    writeData(s, db, table, source, data)
}