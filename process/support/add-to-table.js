addToTable = function(s, dbConn, table, parameter, example, data, userInfo){
    var db_options = new Statement(dbConn);
        db_options.execute("SELECT * FROM digital_room.`" + table + "` WHERE parameter = '" + parameter + "';");

    // If the parameter is found in the tables, return out of the function.
    if(db_options.isRowAvailable()){
        db_options.fetchRow();
        if(table == "options_grommets"){
            return db_options.getString(4)
        }
        if(table == "options_hems"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                webbing: db_options.getString(5) == 1,
                value: parameter.replace(/"/g,'')
            }
        }
        return;
    }

        // If the parameter is not on the table, add it to the able and send an email.
        db_options.execute("INSERT INTO digital_room.`" + table + "` (parameter, date_added, example_item) VALUES ('" + parameter + "','" + new Date() + "','" + example + "');");
        sendEmail_db(s, data, null, getEmailResponse("New Entry", null, table, data, userInfo, null), userInfo);

    return
}