getSubprocess = function(folder, dbConn, query, matInfo){
    function readFiles(folder, dbConn, query, matInfo){
        var db_mapItem = new Statement(dbConn);
            db_mapItem.execute("SELECT * FROM digital_room.map_item WHERE item_name = '" + query.itemName.replace(/'/g,"\\'") + "';");
            db_mapItem.fetchRow();
        var subprocessMapId = db_mapItem.getString(2);

        var files = folder.entryList("*.json", Dir.Files, Dir.Name);
        for(var i=0; i<files.length; i++){
            var str = File.read(folder.path + "/" + files[i], "UTF-8");
            var dump = JSON.parse(str)
            if(dump.id == subprocessMapId){
                for(var j in dump.facility){
                    if(dump.facility[j].id == query.facilityId){
                        if(dump.facility[j].enabled){
                            for(var key in dump.facility[j].overrides){
                                matInfo[key] = dump.facility[j].overrides[key]
                            }
                            return matInfo;
                        }
                    }
                }
            }
        }
        return matInfo;
    }
    return contents = readFiles(folder, dbConn, query, matInfo);
}