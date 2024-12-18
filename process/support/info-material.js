getMatInfo = function(orderSpecs, db){

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
    }else if(orderSpecs.facilityId == 1){
        paperMapId = orderSpecs.paper.map.vn;
    }

    // Pull the material defaults based on the facility mapping ID.
        db.general.execute('CALL digital_room.getMaterial(' + paperMapId + ')');
    if(!db.general.isRowAvailable()){
        return "Material Data Missing";
    }
        db.general.fetchRow();

    var matInfo = {

        id: db.general.getString(0),
        prodName: db.general.getString(1),
        prodMatFileName: db.general.getString(34),
        type: db.general.getString(2),
        width: Number(db.general.getString(3)),
        height: Number(db.general.getString(4)),
        dynamicHeightIncrement: db.general.getString(66),
        phoenixStock: db.general.getString(5),

        spacing: {
            type: db.general.getString(7),
            base: db.general.getString(8),
            top: db.general.getString(9),
            bottom: db.general.getString(10),
            left: db.general.getString(11),
            right: db.general.getString(12)
        },

        bleed: {
            type: db.general.getString(17),
            base: db.general.getString(13),
            top: db.general.getString(53),
            bottom: db.general.getString(54),
            left: db.general.getString(55),
            right: db.general.getString(56)
        },

        offcut: {
            top: db.general.getString(61),
            bottom: db.general.getString(62),
            left: db.general.getString(63),
            right: db.general.getString(64)
        },

        rotation: db.general.getString(6),
        allowedRotations: db.general.getString(14),
        impositionProfile: db.general.getString(15),
        phoenixMethod: db.general.getString(35),
        phoenixMethodUserFriendly: db.general.getString(36),
        grade: db.general.getString(16),

        printer: {
            name: db.general.getString(18),
            margin: {
                top: db.general.getString(19),
                bottom: db.general.getString(20),
                left: db.general.getString(21),
                right: db.general.getString(22)
            }
        },

        forceLam: db.general.getString(23) == "0" ? false : true,
        cropGang: db.general.getString(24) == "0" ? false : true,
        whiteElements: db.general.getString(25) == "0" ? false : true,
        pageHandling: db.general.getString(26),
        overrunMax: db.general.getString(27),
        forceUndersize: db.general.getString(28) == "0" ? false : true,
        sideMix: db.general.getString(29) == "0" ? false : true,
        lamMix: db.general.getString(45) == 'y' ? true : false,
        approved: db.general.getString(46) == 'y' ? true : false,
        duplicateHoles: db.general.getString(47) == 'y' ? true : false,
        standardPrint: db.general.getString(51) == 'y' ? true : false,   //1st surface
        reversePrint: db.general.getString(50) == 'y' ? true : false,    //2nd surface
        rotateFront: db.general.getString(37) == 'y' ? true : false,
        rotateBack: db.general.getString(38) == 'y' ? true : false,
        rotate90: db.general.getString(39) == 'y' ? true : false,
        splitDSLayouts: db.general.getString(52) == 'y' ? true : false,
        cutAdjustments: db.general.getString(58) == 'y' ? true : false,
        labelOffset: db.general.getString(57) == 'NULL' ? null : db.general.getString(57) + " Offset",
        addKeyline: db.general.getString(59) == 'y' ? true : false,
        cutMethod: db.general.getString(60),
        
        layoutCount:{
            target: db.general.getString(67),
            max: db.general.getString(68)
        },

        dsIndicator:{
            top: db.general.getString(40) == 'y' ? true : false,
            bottom: db.general.getString(41) == 'y' ? true : false
        },

        rip: {
            enable: db.general.getString(48) == 'y' ? true : false,
            device: db.general.getString(30),
            hotfolder: db.general.getString(31) == 'empty' ? '' : db.general.getString(31)
        },

        cutter: {
            enable: db.general.getString(49) == 'y' ? true : false,
            device: db.general.getString(32),
            hotfolder: db.general.getString(33),
            layerName: db.general.getString(42),
            organizeLayouts: db.general.getString(44) == 'y' ? true : false
        },

        phoenix:{
            printExport: db.general.getString(65),
            cutExport: db.general.getString(43)
        }
    }
    
    return matInfo
}