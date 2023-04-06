addToTable = function(s, dbConn, table, parameter, example, data, userInfo){
    var original = parameter

        parameter = parameter.replace(/"/g,'\\"');
        parameter = parameter.replace(/'/g,"\\'");
        parameter = parameter.replace(/,/g,'\\,');

    var db_options = new Statement(dbConn);

    // This logic is temporary, it's just to update existing entries in the tables to include the " and ' symbols
    if(parameter.length != original.length){
        db_options.execute("SELECT * FROM digital_room.`" + table + "` WHERE parameter = '" + original.replace(/"|'/g,'') + "';");
        if(db_options.isRowAvailable()){
            dbQuery.execute("UPDATE digital_room.`" + table + "` SET `parameter` = '" + parameter + "' WHERE (`parameter` = '" + original.replace(/"|'/g,'') + "');");
        }
    }

        db_options.execute("SELECT * FROM digital_room.`" + table + "` WHERE parameter = '" + parameter + "';");

    // If the parameter is found in the tables, return out of the function.
    if(db_options.isRowAvailable()){
        db_options.fetchRow();

        // Paper mapping
        if(table == "specs_paper"){
            return specs = {
                active: true,
                value: db_options.getString(1),
                map: {
                    slc: Number(db_options.getString(4)),
                    bri: Number(db_options.getString(5)),
                    sln: Number(db_options.getString(6)),
                    lou: Number(db_options.getString(7)),
                    arl: Number(db_options.getString(8)),
                    wix: Number(db_options.getString(9))
                }
            }
        }

        // Item mapping
        if(table == "specs_item-name"){
            return specs = {
                active: true,
                value: db_options.getString(1),
                id: db_options.getString(4)
            }
        }

        // Material options
        if(table == "options_material"){
            return specs = {
                active: true,
                value: db_options.getString(1)
            }
        }

        // A-frame options
        if(table == "options_a-frame"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // Yard options
        if(table == "options_yard-frame"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1),
                undersize: db_options.getString(5) == 1
            }
        }

        // Shape options
        if(table == "options_shape"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // Side options
        if(table == "options_side"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // Grommet options
        if(table == "options_grommets"){
            return specs = {
				active: true,
				key: db_options.getString(4)
            }
        }

        // Hem options
        if(table == "options_hems"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                webbing: db_options.getString(5) == "y" ? true : false,
                value: db_options.getString(1)
            }
        }

        // Pocket options
        if(table == "options_pockets"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                size: db_options.getString(5),
                value: db_options.getString(1)
            }
        }

        // Coating options
        if(table == "options_coating"){
            return specs = {
                active: db_options.getString(4) == "None" ? false : true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // Mount options
        if(table == "options_mount"){
            return specs = {
                active: db_options.getString(4) == "None" ? false : true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // Base options
        if(table == "options_base"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // Display options
        if(table == "options_display"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // View direction options
        if(table == "options_view-direction"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // Laminate options
        if(table == "options_laminate"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // Edge options
        if(table == "options_edge"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // Cut options
        if(table == "options_cut"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: db_options.getString(1)
            }
        }

        // If none of the above matched, return empty?
        return specs = {
            active: true
        }
    }

        // If the parameter is not on the table, add it to the able and send an email.
        db_options.execute("INSERT INTO digital_room.`" + table + "` (parameter, date_added, example_item) VALUES ('" + parameter + "','" + new Date() + "','" + example + "');");
        
        db_options.execute("SELECT * FROM digital_room.`" + table + "` WHERE parameter = '" + parameter + "';");
        if(db_options.isRowAvailable()){
            sendEmail_db(s, data, null, getEmailResponse("New Entry", null, table, data, userInfo, null, parameter), userInfo);
        }else{
            sendEmail_db(s, data, null, getEmailResponse("New Entry Failed", null, table, data, userInfo, null, parameter), userInfo);
        }

    return specs = {
        active: false,
        method: null,
        value: null,
        size: null,
        webbing: null,
        undersize: null,
        key: null
    }
}