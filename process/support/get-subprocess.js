var parent = []

getSubprocess = function(folder, db, orderArray, matInfo, product, data, scale, subprocess, dynamic){
    function readFiles(folder, db, orderArray, matInfo, product, data, scale, subprocess, dynamic){

        orderArray.itemName = orderArray.itemName.replace(/"/g,'\\"');
        orderArray.itemName = orderArray.itemName.replace(/'/g,"\\'");
        orderArray.itemName = orderArray.itemName.replace(/,/g,'\\,');

        db.general.execute("SELECT * FROM digital_room.`specs_item-name` WHERE parameter = '" + orderArray.itemName + "';");
        db.general.fetchRow();

        if(subprocess == null){
            subprocess = db.general.getString(4);
        }

        if(subprocess == undefined){
            return settings = {
                name: "None",
                exists: false,
                mixed: true,
                undersize: db.general.getString(5) == 'n' ? false : true,
                orientationCheck: true
            }
        }

        if(db.general.getString(7) == 'n'){
            return "Reject"
        }

            subprocess = subprocess.split(',');
    
        var files = folder.entryList("*.json", Dir.Files, Dir.Name);

        for(var i=0; i<files.length; i++){
            var str = File.read(folder.path + "/" + files[i], "UTF-8");
            var dump = JSON.parse(str)
            if(dump.id == "undefined"){
                dump.id = dump.subprocess
            }
            
            // Find the correct subprocess support file.
            if(contains(subprocess, dump.id)){
                // Loop through all of the facilities in the subprocess.
                for(var j in dump.parameters){
                    // The facility has to have a subprocess assigned to it to advance.
                    if(dump.parameters[j].facility.id == orderArray.facilityId){
                        // If the facility is enabled, advance.
                        if(dump.parameters[j].facility.enabled){
                            // Check that the process is a possible process for the subprocess.
                            if(contains(dump.parameters[j].processes, matInfo.prodName) || contains(dump.parameters[j].processes, "All")){
                                // If the subprocess does not allow mixed, not the first run through the array, and subprocess doesn't not match
                                if(!dump.parameters[j].properties.mixed && data.mixed != null && !contains(data.subprocess, dump.name)){
                                    return settings = {
                                        name: dump.name,
                                        exists: null,
                                        mixed: null,
                                        undersize: null,
                                        orientationCheck: null
                                    }
                                }

                                // Apply the subprocess overrides
                                checkObject(s, dump.parameters[j].overrides, matInfo, product, data, scale, orderArray, dynamic)
                                return settings = {
                                    name: dump.name,
                                    exists: true,
                                    mixed: dump.parameters[j].properties.mixed,
                                    undersize: dump.parameters[j].properties.undersize == true ? true : dump.parameters[j].properties.undersize == false ? false : db.general.getString(5) == 'y' ? true : false,
                                    orientationCheck: dump.parameters[j].properties.orientationCheck
                                }
                            }
                        }
                    }
                }
            }
        }

        // If no subprocess was found, set it as "none".
        return settings = {
            name: "None",
            exists: false,
            mixed: true,
            undersize: db.general.getString(5) == 'y' ? true : false,
            orientationCheck: true
        }
    }
    return readFiles(folder, db, orderArray, matInfo, product, data, scale, subprocess, dynamic);
}

function checkObject(s, parameter, matInfo, product, data, scale, orderArray, dynamic){
    for(var l in parameter){

        // If the parameter is an nested object, dig further.
        if(typeof parameter[l] === 'object'){
            parent.push(l + ".");
            checkObject(s, parameter[l], matInfo, product, data, scale, orderArray, dynamic);

        // Eval the new parameter.
        }else{
            var thing = parent.join('');
            eval(thing + l + " = '" + parameter[l] + "'");
        }
    }
    // Remove the last entry of the array when that level of nest is completed.
    parent = parent.slice(0,-1)
}