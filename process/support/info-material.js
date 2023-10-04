getMatInfo = function(orderSpecs, dbConn_material){

    // Get the paper mapping ID for the specific facility.
    var paperMapId
    if(orderSpecs.facilityId == 28){
        paperMapId = orderSpecs.paper.map.slc;
    }else if(orderSpecs.facilityId == 18){
        paperMapId = orderSpecs.paper.map.bri;
    }else if(orderSpecs.facilityId == 25){
        paperMapId = orderSpecs.paper.map.sln;
    }else if(orderSpecs.facilityId == 35){
        paperMapId = orderSpecs.paper.map.lou;
    }else if(orderSpecs.facilityId == 5){
        paperMapId = orderSpecs.paper.map.arl;
    }else if(orderSpecs.facilityId == 37){
        paperMapId = orderSpecs.paper.map.wix;
    }
    
    // Pull the material defaults based on the facility mapping ID.
    var db_material = new Statement(dbConn_material);
        db_material.execute('CALL digital_room.getMaterial(' + paperMapId + ')');
    if(!db_material.isRowAvailable()){
        return "Material Data Missing";
    }
        db_material.fetchRow();

    var matInfo = {

        id: db_material.getString(0),
        prodName: db_material.getString(1),
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
        phoenixMethod: db_material.getString(35),
        phoenixMethodUserFriendly: db_material.getString(36),
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
        rotateFront: db_material.getString(37) == 'y' ? true : false,
        rotateBack: db_material.getString(38) == 'y' ? true : false,
        rotate90: db_material.getString(39) == 'y' ? true : false,

        dsIndicator:{
            top: db_material.getString(40) == 'y' ? true : false,
            bottom: db_material.getString(41) == 'y' ? true : false
        },

        rip: {
            device: db_material.getString(30),
            hotfolder: db_material.getString(31)
        },

        cutter: {
            device: db_material.getString(32),
            hotfolder: db_material.getString(33),
            layerName: db_material.getString(42)
        },

        phoenix:{
            cutExport: db_material.getString(43)
        }
    }
    
    return matInfo
}