// TODO - Run a cleanup on this.
getMatInfo = function(mapId, db){

    // Pull the material defaults based on the facility mapping ID.
        db.settings.execute('CALL settings.getMaterial("' + mapId + '")');
    if(!db.settings.isRowAvailable()){
        return "Material Data Missing";
    }
        db.settings.fetchRow();

    var matInfo = {

        accountType: db.settings.getString(82),
        id: db.settings.getString(0),
        prodName: db.settings.getString(1),
        prodMatFileName: db.settings.getString(34),
        type: db.settings.getString(2),
        width: Number(db.settings.getString(3)),
        height: Number(db.settings.getString(4)),
        dynamicHeightIncrement: db.settings.getString(66),
        maxHeight: db.settings.getString(78),
        maxWidth: db.settings.getString(79),
        phoenixStock: db.settings.getString(5),
        phoenixPress: db.settings.getString(80),
        mixDueDate: submit.override.date === true ? true : db.settings.getString(81) === 'y',

        spacing: {
            type: db.settings.getString(7),
            base: db.settings.getString(8),
            top: db.settings.getString(9),
            bottom: db.settings.getString(10),
            left: db.settings.getString(11),
            right: db.settings.getString(12)
        },

        bleed: {
            type: db.settings.getString(17),
            base: db.settings.getString(13),
            top: db.settings.getString(53),
            bottom: db.settings.getString(54),
            left: db.settings.getString(55),
            right: db.settings.getString(56)
        },

        offcut: {
            top: db.settings.getString(61),
            bottom: db.settings.getString(62),
            left: db.settings.getString(63),
            right: db.settings.getString(64)
        },

        rotation: db.settings.getString(6),
        allowedRotations: db.settings.getString(14),
        impositionProfile: db.settings.getString(15),
        phoenixMethod: db.settings.getString(35),
        phoenixMethodUserFriendly: db.settings.getString(36),
        grade: db.settings.getString(16),

        printer: {
            name: db.settings.getString(18),
            margin: {
                top: db.settings.getString(19),
                bottom: db.settings.getString(20),
                left: db.settings.getString(21),
                right: db.settings.getString(22)
            }
        },

        workstyle:{
            simplex: db.settings.getString(70),
            duplex: db.settings.getString(71)
        },

        forceLam: db.settings.getString(23) == "0" ? false : true,
        cropGang: db.settings.getString(24) == "0" ? false : true,
        whiteElements: db.settings.getString(25) == "0" ? false : true,
        pageHandling: db.settings.getString(26),
        overrunMax: db.settings.getString(27),
        forceUndersize: db.settings.getString(28) == "0" ? false : true,
        allowUndersize: db.settings.getString(69) == "y" ? true : false,
        sideMix: db.settings.getString(29) == "0" ? false : true,
        lamMix: db.settings.getString(45) == 'y' ? true : false,
        approved: db.settings.getString(46) == 'y' ? true : false,
        duplicateHoles: db.settings.getString(47) == 'y' ? true : false,
        standardPrint: db.settings.getString(51) == 'y' ? true : false, //1st surface
        reversePrint: db.settings.getString(50) == 'y' ? true : false, //2nd surface
        rotateFront: db.settings.getString(37) == 'y' ? true : false,
        rotateBack: db.settings.getString(38) == 'y' ? true : false,
        rotate90: db.settings.getString(39) == 'y' ? true : false,
        splitDSLayouts: db.settings.getString(52) == 'y' ? true : false,
        cutAdjustments: db.settings.getString(58) == 'y' ? true : false,
        labelOffset: db.settings.getString(57) == 'NULL' ? null : db.settings.getString(57) + " Offset",
        addKeyline: db.settings.getString(59) == 'y' ? true : false,
        cutMethod: db.settings.getString(60),
        optimizeForDFE: db.settings.getString(72) == 'y' ? true : false,
        cutPathExistsCheck: db.settings.getString(73) == 'y' ? true : false,
        reversePages: db.settings.getString(74) == 'y' ? true : false,
        orientationCheck: db.settings.getString(75) == 'y' ? true : false,
        dieDesignSource: db.settings.getString(76),
        
        layoutCount:{
            target: db.settings.getString(67),
            max: db.settings.getString(68)
        },

        dsIndicator:{
            top: db.settings.getString(40) == 'y' ? true : false,
            bottom: db.settings.getString(41) == 'y' ? true : false
        },

        rip: {
            enable: db.settings.getString(48) == 'y' ? true : false,
            device: db.settings.getString(30),
            hotfolder: db.settings.getString(31) == 'empty' ? '' : db.settings.getString(31),
            resolution: db.settings.getString(77)
        },

        cutter: {
            enable: db.settings.getString(49) == 'y' ? true : false,
            device: db.settings.getString(32),
            hotfolder: db.settings.getString(33),
            layerName: db.settings.getString(42),
            organizeLayouts: db.settings.getString(44) == 'y' ? true : false
        },

        phoenix:{
            printExport: db.settings.getString(65),
            cutExport: db.settings.getString(43)
        }
    }
    
    return matInfo
}