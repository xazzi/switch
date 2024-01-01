// THIS IS NOT IN USE YET, IT WAS MOSTLY WORKING THOUGH.
// DEVELOPMENT WAS STARTED ON THIS PROCESS BUT IT HAS MORE DEPTH THAN WE CURRENTLY REQUIRE.
// AS AUTOMATION TAKES ON MORE MATERIAL REASSIGNMENT THEN YOU CAN REVISIT THIS.

var parent = []

materialReassign = function(folder, dbConn, query, matInfo, data, reassignment){
    function readFiles(folder, dbConn, query, matInfo, data, reassignment){

        query.itemName = query.itemName.replace(/"/g,'\\"');
        query.itemName = query.itemName.replace(/'/g,"\\'");
        query.itemName = query.itemName.replace(/,/g,'\\,');

        if(reassignment == null){
            reassignment = query.material.reassignment;
        }

        reassignment = reassignment.split(',');

        if(reassignment == undefined){
            return settings = {
                name: "None",
                exists: false,
                undersize: db_mapItem.getString(5) == 'n' ? false : true
            }
        }
    
        var files = folder.entryList("*.json", Dir.Files, Dir.Name);

        for(var i=0; i<files.length; i++){
            var str = File.read(folder.path + "/" + files[i], "UTF-8");
            var dump = JSON.parse(str)
            
            if(contains(reassignment, dump.id)){
                for(var j in dump.facility){
                    if(dump.facility[j].id == query.facilityId){
                        if(dump.facility[j].enabled){
                            if(contains(dump.facility[j].processes, matInfo.prodName) || contains(dump.facility[j].processes, "All")){
                                if(data.reassignment != null){
                                    if(dump.name != data.reassignment){
                                        return settings = {
                                            name: dump.name,
                                            exists: null,
                                            undersize: null
                                        }
                                    }
                                }
                                checkObject(s, dump.facility[j].overrides, matInfo, data)
                                return settings = {
                                    name: dump.name,
                                    exists: true,
                                    undersize: dump.facility[j].undersize ? true : !dump.facility[j].undersize ? false : db_mapItem.getString(5) == 'y' ? true : false
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
            undersize: null
        }
    }
    return readFiles(folder, dbConn, query, matInfo, data, reassignment);
}

function checkObject(s, parameter, matInfo, data){
    for(var l in parameter){

        // If the parameter is an nested object, dig further.
        if(typeof parameter[l] === 'object'){
            parent.push(l + ".");
            checkObject(s, parameter[l], matInfo, data);

        // Eval the new parameter.
        }else{
            var thing = parent.join('');
            eval(thing + l + " = '" + parameter[l] + "'");
        }
    }
    // Remove the last entry of the array when that level of nest is completed.
    parent = parent.slice(0,-1)
}