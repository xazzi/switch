addToTable = function(s, db, table, parameter, example, data, userInfo, object, orderSpecs, tableFormat, dataDump){
    var original = parameter
    
        parameter = parameter.replace(/"/g,'\\"');
        parameter = parameter.replace(/'/g,"\\'");
        parameter = parameter.replace(/,/g,'\\,');

    // This logic is temporary, it's just to update existing entries in the tables to include the " and ' symbols
    if(parameter.length != original.length){
        db.settings.execute("SELECT * FROM settings.`" + table + "` WHERE parameter = '" + original.replace(/"|'/g,'') + "';");
        if(db.settings.isRowAvailable()){
            db.settings.execute("UPDATE settings.`" + table + "` SET `parameter` = '" + parameter + "' WHERE (`parameter` = '" + original.replace(/"|'/g,'') + "');");
        }
    }

    // For items with hardware, run a specific query.
    if(table == "options_hardware"){
        db.settings.execute("SELECT * FROM settings.`" + table + "` WHERE `prism-value` = '" + parameter + "' AND width = '" + object.width + "' AND height = '" + object.height + "';");

    // For the new table style
    }else if(tableFormat == "new"){
        db.settings.execute("SELECT * FROM settings.`" + table + "` WHERE `prism-value` = '" + parameter + "';");

    // For the attr table style
    }else if(tableFormat == "attr"){
        db.settings.execute("SELECT * FROM settings.`" + table + "` WHERE `prism-value` = '" + parameter + "';");

    // For the attr table style
    }else if(tableFormat == "mxml-stock"){
        s.log(2, "SELECT")
        db.settings.execute("SELECT * FROM settings.`" + table + "` WHERE `mxml_value` = '" + parameter + "';");

    // For the paper query
    }else if(tableFormat == "paper"){
        if(data.mxmlStock.enabled){
            parameter = data.mxmlStock.lookup.paper
        }
        db.settings.execute("SELECT * FROM settings.`" + table + "` WHERE prism_value = '" + parameter + "' AND account_type_code = '" + dataDump.account_type_code + "';");

    // For everything else, run a generic query.
    }else{
        db.settings.execute("SELECT * FROM settings.`" + table + "` WHERE parameter = '" + parameter + "';");
    }

    // If the parameter is found in the tables, return out of the function.
    if(db.settings.isRowAvailable()){
        db.settings.fetchRow();

        // Run this to update missing values in the tables due to the transition to the new table format.
        if(tableFormat == "new"){
            if(db.settings.getString(1) == null){
                db.settings.execute("UPDATE settings.`" + table + "` SET `prism-code` = '" + orderSpecs.code + "' WHERE (`prism-value` = '" + parameter + "');");
            }
            if(db.settings.getString(2) == null){
                db.settings.execute("UPDATE settings.`" + table + "` SET `prism-label` = '" + orderSpecs.label + "' WHERE (`prism-value` = '" + parameter + "');");
            }
        }

        // Paper mapping
        // These map options need to match the material maps below, this allows the process to work when there isn't a paper assigned to the item.
        if(table == "specs_paper"){
            return specs = {
                active: true,
                value: db.settings.getString(1),
                accountTypeCode: db.settings.getString(2),
                map: {
                    slc: Number(db.settings.getString(5)),
                    bri: Number(db.settings.getString(6)),
                    sln: Number(db.settings.getString(7)),
                    lou: Number(db.settings.getString(8)),
                    arl: Number(db.settings.getString(9)),
                    wix: Number(db.settings.getString(10)),
                    vn: Number(db.settings.getString(11)),
                    sb: Number(db.settings.getString(12))
                }
            }
        }

        // Map the data from the mxml if overridden.
        if(table == "map_mxml-stock"){
            return specs = {
                enabled: db.settings.getString(6) == 'y',
                value: db.settings.getString(1),
                lookup:{
                    paper: db.settings.getString(2),
                    coating: {
                        front: db.settings.getString(3),
                        back: db.settings.getString(4)
                    }
                } 
            }
        }

        // Item mapping
        if(table == "specs_item-name"){
            return specs = {
                active: true,
                value: db.settings.getString(1),
                subprocess: db.settings.getString(4)
            }
        }

        // A-frame options
        if(table == "options_a-frame"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null,
                attributes: {
                    color: db.settings.getString(8),
                    type: db.settings.getString(9)
                }
            }
        }

        // Yard options
        if(table == "options_yard-frame"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1),
                undersize: db.settings.getString(5) == 1
            }
        }

        // Shape options
        if(table == "options_shape"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1),
                applyProductLabel: db.settings.getString(5) == "y"
            }
        }

        // Corner options
        if(table == "options_corner"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }
        }

        // Diecut options
        if(table == "options_diecut"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1),
                applyProductLabel: db.settings.getString(5) == "y"
            }
        }

        // Side options
        if(table == "options_side"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }
        }

        // Grommet options
        if(table == "options_grommets"){
            return specs = {
				active: true,
				key: db.settings.getString(4)
            }
        }

        // Hem options
        if(table == "options_hems"){
            return specs = {
                value: db.settings.getString(1).replace(/"/g,''),
                enable: db.settings.getString(4) == "y" ? true : false,
                method: db.settings.getString(5),
                side: {
                    top: db.settings.getString(6) == "y" ? true : false,
                    bottom: db.settings.getString(7) == "y" ? true : false,
                    left: db.settings.getString(8) == "y" ? true : false,
                    right: db.settings.getString(9) == "y" ? true : false
                },
                webbing: db.settings.getString(10) == "y" ? true : false
            }
        }

        // Pocket options
        if(table == "options_pockets"){
            return specs = {
                value: db.settings.getString(1),
                enable: db.settings.getString(4) == "y" ? true : false,
                method: "Active",
                side: {
                    top: db.settings.getString(5) == "y" ? true : false,
                    bottom: db.settings.getString(6) == "y" ? true : false,
                    left: db.settings.getString(7) == "y" ? true : false,
                    right: db.settings.getString(8) == "y" ? true : false
                },
                size: {
                    top: db.settings.getString(9),
                    bottom: db.settings.getString(10),
                    left: db.settings.getString(11),
                    right: db.settings.getString(12)
                }
            }
        }

        // Mount options
        if(table == "options_mount"){
            return specs = {
                active: db.settings.getString(4) == "None" ? false : true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }
        }

        // Base options
        if(table == "options_base"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }
        }

        // Display options
        if(table == "options_display"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }
        }

        // View direction options
        if(table == "options_view-direction"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }
        }

        // Print direction options
        if(table == "options_print-direction"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }
        }

        // Laminate options
        if(table == "options_laminate"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null,
                key: db.settings.getString(8),
                map:{
                    fcoat: db.settings.getString(9),
                    bcoat: db.settings.getString(10)
                }
            }
        }

        // Front Laminate options
        if(table == "options_front-laminate"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null
            }
        }

        // Back Laminate options
        if(table == "options_back-laminate"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null
            }
        }

        // Coating options
        if(table == "options_coating"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null,
                key: db.settings.getString(8),
                map:{
                    front:{
                        enabled: true,
                        label: db.settings.getString(2),
                        value: db.settings.getString(9)
                    },
                    back:{
                        enabled: true,
                        label: db.settings.getString(2),
                        value: db.settings.getString(10)
                    }
                }
            }
        }

        // Front Coating options
        if(table == "options_front-coating"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null
            }
        }

        // Back Coating options
        if(table == "options_back-coating"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null
            }
        }

        // Cover options
        if(table == "options_cover"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null
            }
        }

        // Material Thickness options
        if(table == "options_material-thickness"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null
            }
        }

        // Print Finish options
        if(table == "options_print-finish"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null
            }
        }

        // BindPlace options
        if(table == "options_bindplace"){
            return specs = {
                enabled: db.settings.getString(7) == 'y',
                label: db.settings.getString(2),
                value: db.settings.getString(4) != null ? db.settings.getString(4) : db.settings.getString(3) != null ? db.settings.getString(3) : null
            }
        }

        // Edge options
        if(table == "options_edge"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }
        }

        // Unwind options
        if(table == "options_unwind"){
            return specs = {
                active: true,
                value: db.settings.getString(1),
                enable: db.settings.getString(4) == "y" ? true : false,
                key: db.settings.getString(5),
                rotation: db.settings.getString(6)
            }
        }

        // General hardware
        if(table == "options_hardware"){
            return specs = {
                active: true,
                prism:{
                    code: db.settings.getString(1),
                    label: db.settings.getString(2),
                    value: db.settings.getString(3).replace(/"/g,'')
                },
                template:{
                    id: db.settings.getString(7),
                    active: false,
                    name: null
                },
                nickname: {
                    global: db.settings.getString(8),
                    slc: db.settings.getString(9),
					wxm: db.settings.getString(10)
                },
                displaySize: {
                    global: db.settings.getString(11),
                    slc: db.settings.getString(12),
                    wxm: db.settings.getString(13)
                },
                enabled: db.settings.getString(14) == "y" ? true : false,
                example: db.settings.getString(15),
                dateAdded: db.settings.getString(16)
            }
        }

        // Cut options
        if(table == "options_cut"){
            return specs = {
                active: true,
                method: db.settings.getString(4),
                value: db.settings.getString(1)
            }
        }

        // If we aren't extracting data from the table, return out.
        return null
    }

        // If it makes it this far, the entry doesn't exist in the table yet. Add it
        // Add new hardware info to the hardware table
        if(table == "options_hardware"){
            db.settings.execute("INSERT INTO settings.options_hardware" + "(`example-item`, `prism-code`, `prism-label`, `prism-value`, `item-name`, width, height, `date-added`) VALUES ('" + object.jobItemId + "','" + orderSpecs.code + "','" + orderSpecs.label + "','" + orderSpecs.value + "','" + object.itemName + "','" + object.width + "','" + object.height + "','" + new Date() + "');");
        
        // For the new table style
        }else if(tableFormat == "new"){
            db.settings.execute("INSERT INTO settings.`" + table + "` (`prism-code`, `prism-label`, `prism-value`, `date-added`, `example-item`) VALUES ('" + orderSpecs.code + "','" + orderSpecs.label + "','" + orderSpecs.value + "','" + new Date() + "','" + example + "');");

        // For the paper query
        }else if(tableFormat == "paper"){
            db.settings.execute("INSERT INTO settings.`" + table + "` (prism_value, account_type_code, date_added, example_item) VALUES ('" + parameter + "','" + dataDump.account_type_code + "','" + new Date() + "','" + example + "');");

        // For the paper query
        }else if(tableFormat == "mxml-stock"){
            s.log(2, "INSERT")
            db.settings.execute("INSERT INTO settings.`" + table + "` (mxml_value, date_added) VALUES ('" + parameter + "','" + new Date() + "');");

        // For display attributes
        }else if(tableFormat == "attr"){
            db.settings.execute("INSERT INTO settings.`" + table + "` (`prism-name`, `prism-value`, `date_added`, `example_item`) VALUES ('" + orderSpecs.attribute_name + "','" + orderSpecs.attr_value + "','" + new Date() + "','" + example + "');");

        // All of the other options tables.
        }else{
            db.settings.execute("INSERT INTO settings.`" + table + "` (parameter, date_added, example_item) VALUES ('" + parameter + "','" + new Date() + "','" + example + "');");
        }

        // Send an email about the new entry
        sendEmail_db(s, data, null, getEmailResponse("New Entry", null, table, data, userInfo, parameter), userInfo);

        return null

    /*
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
        prism:{
            code: null,
            label: null,
            value: null
        },
        template:{
            id: null,
            active: false,
            name: null
        },
        nickname: {
            global: null,
            slc: null,
            wxm: null
        },
        displaySize: {
            global: null,
            slc: null,
            wxm: null
        },
        enabled: false,
        example: null,
        dateAdded: new Date(),
        side: {
            active: false,
            method: null,
            value: null
        }
    }
        */
}