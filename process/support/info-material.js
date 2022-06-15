getMatInfo = function(query){

    var dbConn = new DataSource();
        dbConn.connect("manufacturing","root","MmxG?5ZH@5");

    var db_facility = new Statement(dbConn);
        db_facility.execute("SELECT * FROM digital_room.facility WHERE name = '" + query.facility + "';");
        db_facility.fetchRow();
    var facilityId = db_facility.getString(0);
        
    var db_mapItem = new Statement(dbConn);
        db_mapItem.execute("SELECT * FROM digital_room.map_item WHERE item_name = '" + query.itemName + "';");
        db_mapItem.fetchRow();
    var itemMapId = db_mapItem.getString(1);
    
    var db_mapPaper = new Statement(dbConn);
        db_mapPaper.execute("SELECT * FROM digital_room.map_paper WHERE paper_name = '" + query.paper + "';");
    if(!db_mapPaper.isRowAvailable()){
        db_mapPaper.execute("SELECT * FROM digital_room.map_paper WHERE paper_name = '" + query.material + "';");
    }
        db_mapPaper.fetchRow();
    var paperMapId = Number(db_mapPaper.getString(1));
    
    var db_material = new Statement(dbConn);
        db_material.execute('CALL `digital_room`.`getMaterial_v3`(' + paperMapId + ',' + itemMapId + ',' + facilityId + ')');
    if(!db_material.isRowAvailable()){
        return "Material Data Missing";
    }
        db_material.fetchRow();

    var matInfo = {

        id: db_material.getString(0),
        prodName: db_material.getString(1),
        paperRef: db_material.getString(2),
        itemRef: db_material.getString(3),
        type: db_material.getString(4),
        width: Number(db_material.getString(5)),
        height: Number(db_material.getString(6)),
        phoenixStock: db_material.getString(7),
        rotation: db_material.getString(8),

        spacing: {
            type: db_material.getString(9),
            base: db_material.getString(10),
            top: db_material.getString(11),
            bottom: db_material.getString(12),
            left: db_material.getString(13),
            right: db_material.getString(14)
        },

        bleed: db_material.getString(15),
        allowedRotations: db_material.getString(16),
        impositionProfile: db_material.getString(17),
        phoenixVersion: db_material.getString(18),
        devEnvironment: db_material.getString(19) == "0" ? false : true,
        grade: db_material.getString(20),
        bleedType: db_material.getString(21),

        printer: {
            name: db_material.getString(22),
            margin: {
                top: db_material.getString(23),
                bottom: db_material.getString(24),
                left: db_material.getString(25),
                right: db_material.getString(26)
            }
        },

        forceLam: db_material.getString(27) == "0" ? false : true,
        cropGang: db_material.getString(28) == "0" ? false : true,

        rip: {
            caldera: db_material.getString(29),
            calderaIP: db_material.getString(30),
            asanti: db_material.getString(31)
        },

        autoCutter: {
            hotfolder: db_material.getString(32),
            bigBoy: db_material.getString(33) == "0" ? false : true,
            longBoy: db_material.getString(34) == "0" ? false : true,
            sacZund: db_material.getString(35) == "0" ? false : true,
            slcZund: db_material.getString(36) == "0" ? false : true,
            router: db_material.getString(37) == "0" ? false : true,
            xy: db_material.getString(38) == "0" ? false : true
        },

        whiteElements: db_material.getString(39) == "0" ? false : true,
        subProcess: null,
        pageHandling: db_material.getString(40),
        overrun: db_material.getString(41),
        forceUndersize: db_material.getString(42) == "0" ? false : true,
        sideMix: db_material.getString(44) == "0" ? false : true
    }

    return matInfo
}