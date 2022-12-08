getMatInfo = function(query, dbConn){

    // Pull the base paper mapping.
    var db_mapPaper = new Statement(dbConn);
        db_mapPaper.execute("SELECT * FROM digital_room.map_paper WHERE paper_name = '" + query.paper + "';");
    if(!db_mapPaper.isRowAvailable()){
        return "Material Data Missing"
        //db_mapPaper.execute("SELECT * FROM digital_room.map_paper WHERE paper_name = '" + query.material + "';");
    }
        db_mapPaper.fetchRow();

    // Get the paper mapping ID for the specific facility.
    var paperMapId
    if(query.facilityId == 28){
        paperMapId = Number(db_mapPaper.getString(2));
    }else if(query.facilityId == 18){
        paperMapId = Number(db_mapPaper.getString(3));
    }else if(query.facilityId == 25){
        paperMapId = Number(db_mapPaper.getString(4));
    }else if(query.facilityId == 35){
        paperMapId = Number(db_mapPaper.getString(5));
    }
    
    // Pull the material data based on the facility mapping ID.
    var db_material = new Statement(dbConn);
        db_material.execute('CALL digital_room.getMaterial(' + paperMapId + ')');
    if(!db_material.isRowAvailable()){
        return "Material Data Missing";
    }
        db_material.fetchRow();

    var matInfo = {

        id: db_material.getString(0),
        prodName: db_material.getString(1),
        subprocess: "None",
        prodMatFileName: db_material.getString(34),
        type: db_material.getString(2),
        width: Number(db_material.getString(3)),
        height: Number(db_material.getString(4)),
        phoenixStock: db_material.getString(5),

        spacing: {
            type: db_material.getString(7),
            base: db_material.getString(8),
            top: db_material.getString(9),
            bottom: db_material.getString(10),
            left: db_material.getString(11),
            right: db_material.getString(12)
        },

        bleed: db_material.getString(13),
        rotation: db_material.getString(6),
        allowedRotations: db_material.getString(14),
        impositionProfile: db_material.getString(15),
        grade: db_material.getString(16),
        bleedType: db_material.getString(17),

        printer: {
            name: db_material.getString(18),
            margin: {
                top: db_material.getString(19),
                bottom: db_material.getString(20),
                left: db_material.getString(21),
                right: db_material.getString(22)
            }
        },

        forceLam: db_material.getString(23) == "0" ? false : true,
        cropGang: db_material.getString(24) == "0" ? false : true,
        whiteElements: db_material.getString(25) == "0" ? false : true,
        pageHandling: db_material.getString(26),
        overrun: db_material.getString(27),
        forceUndersize: db_material.getString(28) == "0" ? false : true,
        sideMix: db_material.getString(29) == "0" ? false : true,

        rip: {
            device: db_material.getString(30),
            hotfolder: db_material.getString(31)
        },

        cutter: {
            device: db_material.getString(32),
            hotfolder: db_material.getString(33)
        }
    }
    
    return matInfo
}