addToTable = function(s, db, table, parameter, example, data, userInfo, object){
    var original = parameter
    
        parameter = parameter.replace(/"/g,'\\"');
        parameter = parameter.replace(/'/g,"\\'");
        parameter = parameter.replace(/,/g,'\\,');

    // This logic is temporary, it's just to update existing entries in the tables to include the " and ' symbols
    if(parameter.length != original.length){
        db.general.execute("SELECT * FROM digital_room.`" + table + "` WHERE parameter = '" + original.replace(/"|'/g,'') + "';");
        if(db.general.isRowAvailable()){
            db.general.execute("UPDATE digital_room.`" + table + "` SET `parameter` = '" + parameter + "' WHERE (`parameter` = '" + original.replace(/"|'/g,'') + "');");
        }
    }

    // For bannerstands, run a specific query.
    if(table == "options_bannerstand"){
        db.general.execute("SELECT * FROM digital_room.`" + table + "` WHERE parameter = '" + parameter + "' AND width = '" + object.width + "' AND height = '" + object.height + "';");

    // For everything else, run a generic query.
    }else{
        db.general.execute("SELECT * FROM digital_room.`" + table + "` WHERE parameter = '" + parameter + "';");
    }

    // If the parameter is found in the tables, return out of the function.
    if(db.general.isRowAvailable()){
        db.general.fetchRow();

        // Paper mapping
        // These map options need to match the material maps below, this allows the process to work when there isn't a paper assigned to the item.
        if(table == "specs_paper"){
            return specs = {
                active: true,
                value: db.general.getString(1),
                map: {
                    slc: Number(db.general.getString(4)),
                    bri: Number(db.general.getString(5)),
                    sln: Number(db.general.getString(6)),
                    lou: Number(db.general.getString(7)),
                    arl: Number(db.general.getString(8)),
                    wix: Number(db.general.getString(9)),
                    vn: Number(db.general.getString(10))
                }
            }
        }

        // Item mapping
        if(table == "specs_item-name"){
            return specs = {
                active: true,
                value: db.general.getString(1),
                subprocess: db.general.getString(4)
            }
        }

        // Material options
        // These map options need to match the paper maps above, this allows the process to work when there isn't a paper assigned to the item.
        if(table == "options_material"){
            return specs = {
                active: true,
                value: db.general.getString(1),
                map: {
                    slc: null,
                    bri: null,
                    sln: Number(db.general.getString(5)),
                    lou: null,
                    arl: null,
                    wix: null,
                    vn: Number(db.general.getString(4))
                }
            }
        }

        // A-frame options
        if(table == "options_a-frame"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1).replace(/"/g,''),
                color: db.general.getString(5)
            }
        }

        // Yard options
        if(table == "options_yard-frame"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1),
                undersize: db.general.getString(5) == 1
            }
        }

        // Shape options
        if(table == "options_shape"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1),
                applyProductLabel: db.general.getString(5) == "y"
            }
        }

        // Corner options
        if(table == "options_corner"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // Diecut options
        if(table == "options_diecut"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1),
                applyProductLabel: db.general.getString(5) == "y"
            }
        }

        // Side options
        if(table == "options_side"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // Grommet options
        if(table == "options_grommets"){
            return specs = {
				active: true,
				key: db.general.getString(4)
            }
        }

        // Hem options
        if(table == "options_hems"){
            return specs = {
                value: db.general.getString(1).replace(/"/g,''),
                enable: db.general.getString(4) == "y" ? true : false,
                method: db.general.getString(5),
                side: {
                    top: db.general.getString(6) == "y" ? true : false,
                    bottom: db.general.getString(7) == "y" ? true : false,
                    left: db.general.getString(8) == "y" ? true : false,
                    right: db.general.getString(9) == "y" ? true : false
                },
                webbing: db.general.getString(10) == "y" ? true : false
            }
        }

        // Pocket options
        if(table == "options_pockets"){
            return specs = {
                value: db.general.getString(1),
                enable: db.general.getString(4) == "y" ? true : false,
                side: {
                    top: db.general.getString(5) == "y" ? true : false,
                    bottom: db.general.getString(6) == "y" ? true : false,
                    left: db.general.getString(7) == "y" ? true : false,
                    right: db.general.getString(8) == "y" ? true : false
                },
                size: {
                    top: db.general.getString(9),
                    bottom: db.general.getString(10),
                    left: db.general.getString(11),
                    right: db.general.getString(12)
                }
            }
        }

        // Mount options
        if(table == "options_mount"){
            return specs = {
                active: db.general.getString(4) == "None" ? false : true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // Base options
        if(table == "options_base"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // Display options
        if(table == "options_display"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // View direction options
        if(table == "options_view-direction"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // Print direction options
        if(table == "options_print-direction"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // Laminate options
        if(table == "options_laminate"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // Coating options
        if(table == "options_coating"){
            return specs = {
                active: db.general.getString(4) == "None" ? false : true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // Edge options
        if(table == "options_edge"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // Unwind options
        if(table == "options_unwind"){
            return specs = {
                active: true,
                value: db.general.getString(1),
                enable: db.general.getString(4) == "y" ? true : false,
                key: db.general.getString(5),
                rotation: db.general.getString(6)
            }
        }

        // Bannerstand hardware
        if(table == "options_bannerstand"){
            var specs = {
                active: true,
                value: db.general.getString(2).replace(/"/g,''),
                template:{
                    id: db.general.getString(6),
                    active: false,
                    name: null
                },
                nickname: {
                    global: db.general.getString(7),
                    slc: db.general.getString(8),
					wxm: db.general.getString(9)
                },
                displaySize: {
                    global: db.general.getString(10),
                    slc: db.general.getString(11),
                    wxm: db.general.getString(12)
                },
                enabled: db.general.getString(13)
            }

            // Pull the rectactable template name from the database.
            db.general.execute("SELECT * FROM digital_room.`bannerstand_retractable` WHERE id = '" + specs.template.id + "';");
            if(db.general.isRowAvailable()){
                db.general.fetchRow();
                specs.template.active = true;
                specs.template.name = db.general.getString(1)
            }

            return specs
        }

        // Cut options
        if(table == "options_cut"){
            return specs = {
                active: true,
                method: db.general.getString(4),
                value: db.general.getString(1)
            }
        }

        // If none of the above matched, return empty?
        return specs = {
            active: true
        }
    }

        // If it makes it this far, the entry doesn't exist in the table yet. Add it
        // New options bannerstand table, nickname check
        if(table == "options_bannerstand"){
            db.general.execute("INSERT INTO digital_room.options_bannerstand" + "(`example-item`, parameter, `item-name`, width, height) VALUES ('" + object.jobItemId + "','" + parameter + "','" + object.itemName + "','" + object.width + "','" + object.height + "');");
        
        // All of the other options tables.
        }else{
            db.general.execute("INSERT INTO digital_room.`" + table + "` (parameter, date_added, example_item) VALUES ('" + parameter + "','" + new Date() + "','" + example + "');");
        }

        // Send an email about the new entry
        sendEmail_db(s, data, null, getEmailResponse("New Entry", null, table, data, userInfo, parameter), userInfo);

    return specs = {
        active: false,
        enable: false,
        method: null,
        value: null,
        size: null,
        webbing: null,
        undersize: null,
        key: null,
        rotation: null,
        color: null,
        templateId: null,
        nickname: {
            global: null,
            slc: null,
            wxm: null
        },
        displaySize: {
            global: null,
            slc: null,
            wxm: null
        }		
    }
}