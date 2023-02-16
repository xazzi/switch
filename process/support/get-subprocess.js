var parent = []

getSubprocess = function(folder, dbConn, query, matInfo, product, data, scale, subprocess){
    function readFiles(folder, dbConn, query, matInfo, product, data, scale, subprocess){

        var db_mapItem = new Statement(dbConn);
            db_mapItem.execute("SELECT * FROM digital_room.`specs_item-name` WHERE parameter = '" + query.itemName + "';");
            db_mapItem.fetchRow();

        if(subprocess == null){
            subprocess = db_mapItem.getString(4);
        }

        if(subprocess == undefined){
            return settings = {
                name: "None",
                exists: false,
                mixed: true,
                undersize: db_mapItem.getString(5) == 'n' ? false : true
            }
        }

            subprocess = subprocess.split(',');
    
        var files = folder.entryList("*.json", Dir.Files, Dir.Name);

        for(var i=0; i<files.length; i++){
            var str = File.read(folder.path + "/" + files[i], "UTF-8");
            var dump = JSON.parse(str)
            if(dump.id == "undefined"){
                dump.id = dump.subprocess
            }
            if(contains(subprocess, dump.id)){
                for(var j in dump.facility){
                    if(dump.facility[j].id == query.facilityId){
                        if(dump.facility[j].enabled){
                            if(contains(dump.facility[j].processes, matInfo.prodName) || contains(dump.facility[j].processes, "All")){
                                checkObject(s, dump.facility[j].overrides, matInfo, product, data, scale)
                                return settings = {
                                    name: dump.name,
                                    exists: true,
                                    mixed: dump.facility[j].mixed,
                                    undersize: db_mapItem.getString(5) == 'y' ? true : false
                                }
                            }
                        }
                    }
                }
            }
        }

        return settings = {
            name: "None",
            exists: false,
            mixed: true,
            undersize: db_mapItem.getString(5) == 0 ? false : true
        }
    }
    return readFiles(folder, dbConn, query, matInfo, product, data, scale, subprocess);
}

function checkObject(s, parameter, matInfo, product, data, scale){
    for(var l in parameter){

        // If the parameter is an nested object, dig further.
        if(typeof parameter[l] === 'object'){
            parent.push(l + ".");
            checkObject(s, parameter[l], matInfo, product, data, scale);

        // Eval the new parameter.
        }else{
            var thing = parent.join('');
            eval(thing + l + " = '" + parameter[l] + "'");
        }
    }
    // Remove the last entry of the array when that level of nest is completed.
    parent = parent.slice(0,-1)
}