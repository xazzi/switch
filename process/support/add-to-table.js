addToTable = function(s, dbConn, table, parameter, example, data, userInfo){
    var db_options = new Statement(dbConn);
        db_options.execute("SELECT * FROM digital_room.`" + table + "` WHERE parameter = '" + parameter + "';");

    // If the parameter is found in the tables, return out of the function.
    if(db_options.isRowAvailable()){
        db_options.fetchRow();

        // Paper mapping
        if(table == "specs_paper"){
            return specs = {
                active: true,
                value: parameter.replace(/"/g,''),
                map: {
                    slc: Number(db_options.getString(4)),
                    bri: Number(db_options.getString(5)),
                    sln: Number(db_options.getString(6)),
                    lou: Number(db_options.getString(7)),
                    arl: Number(db_options.getString(8))
                }
            }
        }

        // Material options
        if(table == "options_material"){
            return specs = {
                active: true,
                value: parameter.replace(/"/g,'')
            }
        }

        // A-frame options
        if(table == "options_a-frame"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter
            }
        }

        // Yard options
        if(table == "options_yard-frame"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter,
                undersize: db_options.getString(5) == 1
            }
        }

        // Shape options
        if(table == "options_shape"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter
            }
        }

        // Side options
        if(table == "options_side"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter
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
                value: parameter.replace(/"/g,'')
            }
        }

        // Pocket options
        if(table == "options_pockets"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                size: db_options.getString(5),
                value: parameter.replace(/"/g,'')
            }
        }

        // Coating options
        if(table == "options_coating"){
            return specs = {
                active: db_options.getString(4) == "None" ? false : true,
                method: db_options.getString(4),
                value: parameter
            }
        }

        // Mount options
        if(table == "options_mount"){
            return specs = {
                active: db_options.getString(4) == "None" ? false : true,
                method: db_options.getString(4),
                value: parameter
            }
        }

        // Base options
        if(table == "options_base"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter.replace(/,/g,'')
            }
        }

        // Display options
        if(table == "options_display"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter.replace(/,/g,'')
            }
        }

        // View direction options
        if(table == "options_view-direction"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter
            }
        }

        // Laminate options
        if(table == "options_laminate"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter.replace(/"/g,'')
            }
        }

        // Edge options
        if(table == "options_edge"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter.replace(/"/g,'')
            }
        }

        // Cut options
        if(table == "options_cut"){
            return specs = {
                active: true,
                method: db_options.getString(4),
                value: parameter
            }
        }

        // If none of the above matched, return empty?
        return specs = {
            active: true
        }
    }

        // If the parameter is not on the table, add it to the able and send an email.
        db_options.execute("INSERT INTO digital_room.`" + table + "` (parameter, date_added, example_item) VALUES ('" + parameter + "','" + new Date() + "','" + example + "');");
        sendEmail_db(s, data, null, getEmailResponse("New Entry", null, table, data, userInfo, null), userInfo);

    return specs = {
        active: false,
        method: null,
        value: null,
        size: null,
        webbing: null
    }
}