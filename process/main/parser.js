runParser = function(s, job){
    function parser(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/",
                subprocess: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/subprocess/"),
                phoenixMarks: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/phoenix marks/"),
                phoenixScripts: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/phoenix scripts/")
            }
            
            // Load in all of the supporting libraries and functions
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/get-itemdata.js"));
            eval(File.read(dir.support + "/get-next-shipdate.js"));
            eval(File.read(dir.support + "/get-ship-type.js"));
            eval(File.read(dir.support + "/info-material.js"));
            eval(File.read(dir.support + "/sku-generator.js"));
            eval(File.read(dir.support + "/email-responses.js"));
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/get-subprocess.js"));
            eval(File.read(dir.support + "/set-phoenix-marks.js"));
            eval(File.read(dir.support + "/set-phoenix-scripts.js"));
            eval(File.read(dir.support + "/add-to-table.js"));
            eval(File.read(dir.support + "/compile-csv.js"));
            eval(File.read(dir.support + "/set-hem-labels.js"));
            eval(File.read(dir.support + "/set-product-labels.js"));
            eval(File.read(dir.support + "/write-to-email-db.js"));
            eval(File.read(dir.support + "/get-edge-finishing.js"));
            eval(File.read(dir.support + "/connect-to-db.js"));
            eval(File.read(dir.support + "/load-module-settings.js"));
            eval(File.read(dir.support + "/sql-statements.js"));
            eval(File.read(dir.support + "/get-target-height.js"));
            eval(File.read(dir.support + "/set-banner-storting.js"));

            // Load settings from the module
            var module = loadModuleSettings(s)

            // Establist connection to the databases
            var connections = establishDatabases(s, module)
            var db = {
                general: new Statement(connections.general),
                history: new Statement(connections.history),
                email: new Statement(connections.email)
            }
                
            var localTime = new Date();
            var hourOffset = module.timezone == "AWS" ? 7 : 0;
            var hourAdjustment = localTime.getTime() - (3600000*hourOffset);
            var adjustedTime = new Date(hourAdjustment).toString();
                
            var now = {
                date: adjustedTime.split("T")[0],
                time: adjustedTime.split("T")[1],
                day: adjustedTime.split("T")[0].split("-")[2],
                month: adjustedTime.split("T")[0].split("-")[1],
                year: adjustedTime.split("T")[0].split("-")[0]
            }
                
            var submitDS
            if(!module.devSettings.ignoreSubmit){
                submitDS = loadDataset_db("Submit");
                if(submitDS == "Dataset Missing"){
                    job.sendTo(findConnectionByName_db(s, "Critical Error"), job.getPath());
                    return
                }
            }
            
            var submit = {
                nodes: !module.devSettings.ignoreSubmit ? submitDS.evalToNodes("//field-list/field") : [],
                rotation: "",
                merge: "",
                route:{
                    active: false,
                    facility: null
                },
                material:{
                    active: false,
                    name: null,
                    width: null,
                    height: null,
                    stock: null,
                    facility: null
                },
                override:{
                    mixedHem: null,
                    mixedLam: null,
                    sideMix: null,
                    rush: false,
                    priority: 0,
                    date: false,
                    redownload:{
                        bool: false,
                        location: null
                    },
                    removeRestrictions:{
                        coroplast: false
                    },
                    fullsize:{
                        gang: false,
                        items: []
                    },
                    gangMethod: null,
                    labelmaster: false
                }
            }
                
            for(var i=0; i<submit.nodes.length; i++){
                // Custom rotations input field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Custom rotations?"){
                    if(submit.nodes.getItem(i).evalToString('value') == "Yes"){
                        submit.rotation = submit.nodes.getItem(i).evalToString("field-list/field/value").split(',');
                    }
                }

                // Hem finishing separation field. changed mixed finishing to mixed hem -CM
                if(submit.nodes.getItem(i).evalToString('tag') == "Mix hems?"){
                    submit.override.mixedHem = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }

                // Lam and non-lam finishing separation field. -CM
                if(submit.nodes.getItem(i).evalToString('tag') == "Mix lam?"){
                    submit.override.mixedLam = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }

                // Redownload file field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Redownload file?"){
                    redownloadFrom(submit.nodes.getItem(i).evalToString('value'), submit)
                }

                // Gang method override.
                if(submit.nodes.getItem(i).evalToString('tag') == "Gang Method"){
                    submit.override.gangMethod = submit.nodes.getItem(i).evalToString('value')
                }
                
                // Due date override
                if(submit.nodes.getItem(i).evalToString('tag') == "Mix due dates?"){
                    submit.override.date = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }

                // Fullsize override
                if(submit.nodes.getItem(i).evalToString('tag') == "Force fullsize?"){
                    if(submit.nodes.getItem(i).evalToString('value') == "All items"){
                        submit.override.fullsize.gang = true;
                    }
                    if(submit.nodes.getItem(i).evalToString('value') == "Specific items"){
                        submit.override.fullsize.items = submit.nodes.getItem(i).evalToString("field-list/field/value").split(',');
                    }
                }

                // Mix sides override.
                if(submit.nodes.getItem(i).evalToString('tag') == "Mix sides?"){
                    submit.override.sideMix = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }
                
                // Rerouting input field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Route to another facility?"){
                    if(submit.nodes.getItem(i).evalToString('value') == "Yes"){
                        submit.route.active = true;				
                        submit.route.facility = submit.nodes.getItem(i).evalToString("field-list/field/value");
                    }
                }

                // Custom material width.
                if(submit.nodes.getItem(i).evalToString('tag') == "Custom material size?"){
                    if(submit.nodes.getItem(i).evalToString('value') == "Yes"){
                        submit.material.active = true;				
                        submit.material.name = submit.nodes.getItem(i).evalToString("field-list/field/field-list/field/value");
                        submit.material.facility = submit.nodes.getItem(i).evalToString("field-list/field/value");

                        db.general.execute("SELECT * FROM digital_room.`override_material-size` WHERE name = '" + submit.material.name + "';");
                        db.general.fetchRow();

                        submit.material.width = db.general.getString(2);
                        submit.material.height = db.general.getString(3);
                        submit.material.stock = db.general.getString(4);
                    }
                }
                
                // Rush field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Rush?"){
                    if(submit.nodes.getItem(i).evalToString('value') == "Yes"){
                        submit.override.priority = 100;
                        submit.override.rush = true
                    }
                }

                // Remove Coroplast restrictions
                if(submit.nodes.getItem(i).evalToString('tag') == "Remove Coroplast Restrictions?"){
                    submit.override.removeRestrictions.coroplast = submit.nodes.getItem(i).evalToString('value') == "true" ? true : false
                }

                // Prep for the Labelmaster
                if(submit.nodes.getItem(i).evalToString('tag') == "Labelmaster?"){
                    submit.override.labelmaster = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }
            }
            
            var orderArray = [];
            var adjustmentArray = [];
            var matInfo = null;
            var matInfoCheck = false;
            var misc = {
                rejectPress: true
            }
            
            var validate = {
                prodName: null
            }
            
            var doc = new Document(job.getPath());	
            var map = doc.createDefaultMap();

            var data = {
                projectID: skuGenerator_projectID(db),
                gangNumber: doc.evalToString('//*[local-name()="Project"]/@ProjectID', map),
                projectNotes: doc.evalToString('//*[local-name()="Project"]/@Notes', map),
                environment: module.localEnvironment,
                fileSource: module.fileSource,
                repository: "//10.21.71.213/File Repository/",
                doubleSided: null,
                secondSurface: null,
                coating:{
                    active: false,
                    method: null,
                    value: null
                },
                frontCoating:{
                    enabled: false,
                    label: null,
                    value: null
                },
                laminate:{
                    active: false,
                    method: null,
                    value: null
                },
                mount:{
                    active: false,
                    method: null,
                    value: null
                },
                reprint: false,
                prodName: null,
                scaled: false,
                scale: "",
                oversize: false,
                thing: null,
                printer: null,
                dateID: null,
                notes: [],
                tolerance: 0,
                paper: null,
                prismStock: null,
                facility:{
                    original: null,
                    destination: null
                },
                date:{
                    due: null
                },
                phoenix:{
                    printExport: null,
                    cutExport: null,
                    gangLabel: []
                },
                subprocess: [],
                mixed: null,
                mixedLam: false,
                prodMatFileName: null,
                cropGang: null,
                rotateFront: null,
                rotateBack: null,
                rotate90: null,
                rush: submit.override.rush,
                sideMix: null,
                labelmaster: submit.override.labelmaster
            }

            db.history.execute(generateSqlStatement_Insert(s, "history.details_gang", [
                ["project-id", data.projectID],
                ["gang-number",data.gangNumber]
            ]));
            
            var theNewToken = getNewToken(s, data.environment);
            
            var watermarkDrive = "T://watermarked-files";
            if(data.environment == "QA"){
                watermarkDrive = "Q://watermarked-files";
            }
                    
            // Handle any custom rotation from the user.
            for(var i=0; i<submit.rotation.length; i++){
                if(submit.rotation[i].length == 0){
                    continue;
                }
                if(submit.rotation[i].match(/\d+:\d+/) == undefined){
                    data.notes.push([submit.rotation[i],"Submit","Does not match required format, rejecting adjustment. (itemnumber:rotation)"]);
                    continue;
                }
                if(submit.rotation[i].split(':')[0].length != 8){
                    data.notes.push([submit.rotation[i].split(':')[0],"Submit","Does not match standard item number format, rejecting adjustment. (8 digit item number)"]);
                    continue;
                }
                
                var temp = {
                    item: submit.rotation[i].split(':')[0],
                    rotation: submit.rotation[i].split(':')[1]
                }
                
                db.general.execute("SELECT * FROM digital_room.rotate WHERE item_number = '" + temp.item + "';");
                if(db.general.isRowAvailable()){
                    if(temp.rotation == "default"){
                        data.notes.push([temp.item,"Submit","Updating database to the default rotation."]); //remove
                    }else{
                        data.notes.push([temp.item,"Submit","Updating database to " + temp.rotation + " degrees."]); //remove
                    }
                    db.general.execute("UPDATE digital_room.rotate SET rotation = '" + temp.rotation + "' WHERE item_number = '" + temp.item + "';")
                }else{
                    data.notes.push([temp.item,"Submit","Forced rotation of " + temp.rotation + " degrees."]);
                    db.general.execute("INSERT INTO digital_room.rotate (item_number, rotation) VALUES ('" + temp.item + "','" + temp.rotation + "');");
                }
            }
            
            // Force user dev settings.
            if(module.devSettings.forceUser == "Bret Combe"){
                job.setUserName("Administrator");
                job.setUserFullName("Bret Combe");
                job.setUserEmail("bret.c@digitalroominc.com");
            }
                
            // Pull the user information.
            db.general.execute("SELECT * FROM digital_room.users WHERE email = '" + job.getUserEmail() + "';");
            if(!db.general.isRowAvailable()){
                sendEmail_db(s, data, null, getEmailResponse("Undefined User", null, null, data, job.getUserEmail(), null), null);
                job.sendToNull(job.getPath());
                db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                    ["project-id", data.projectID]
                ],[
                    ["status","Parse Failed"],
                    ["note","Undefined user."]
                ]))
                return;
            }
                db.general.fetchRow();
                
            var userInfo = {
                first: db.general.getString(1),
                last: db.general.getString(2),
                email: db.general.getString(3),
                dir: db.general.getString(4) == null ? "Unknown User" : db.general.getString(1) + " " + db.general.getString(2) + " - " + db.general.getString(4),
                fileSource: getFileSource(db.general.getString(9))
            }

            // If the module is set to choose the fileSource based on user.
            if(data.fileSource == "User Defined"){
                data.fileSource = userInfo.fileSource
            }

            // Override the fileSource if necessary.
            if(submit.override.redownload.bool){
                data.fileSource = submit.override.redownload.location
            }
                
            // Loop through the items, pull the data from the API, then post it to the array.
            var productList = doc.evalToNodes('//*[local-name()="Product"]', map);
            for(var i=0; i<productList.length; i++){
                
                var node = productList.getItem(i);

                db.history.execute(generateSqlStatement_Insert(s, "history.details_item", [
                    ["project-id", data.projectID],
                    ["gang-number", data.gangNumber],
                    ["order-number", node.getAttributeValue('Name')],
                    ["item-number", node.getAttributeValue('ID')],
                    ["page", "1"],
                    ["status", "Initiated"]
                ]));	

                // Pull the item information from the API.
                var orderSpecs = pullApiInformation(s, node.getAttributeValue('ID'), theNewToken, data.environment, db, data, userInfo);
                
                // API pull failed.
                if(!orderSpecs.complete){
                    data.notes.push([node.getAttributeValue('ID'),"Removed","API pull failed."])
                    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                        ["project-id",data.projectID],
                        ["item-number",node.getAttributeValue('ID')]
                    ],[
                        ["status","Removed from Gang"],
                        ["note","API pull failed."]
                    ]))
                    continue;
                }
                
                // Check if facility information exists
                if(orderSpecs.facility == undefined || orderSpecs.facilityId == undefined){
                    data.notes.push([orderSpecs.jobItemId,"Removed","No facility assigned."]);
                    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                        ["project-id",data.projectID],
                        ["item-number",orderSpecs.jobItemId]
                    ],[
                        ["status","Removed from Gang"],
                        ["note","No facility assigned."]
                    ]))
                    continue;
                }

                // Remove the file if shipping information doesn't exist.
                if(!orderSpecs.ship.exists){
                    data.notes.push([orderSpecs.jobItemId,"Removed","Shipping data is missing."]);
                    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                        ["project-id",data.projectID],
                        ["item-number",orderSpecs.jobItemId]
                    ],[
                        ["status","Removed from Gang"],
                        ["note","Shipping data is missing"]
                    ]))
                    continue;
                }
                
                // Set facility information
                if(data.facility.original == null){
                    data.facility.original = orderSpecs.facility;
                    data.facility.destination = submit.route.active ? submit.route.facility : orderSpecs.facility;

                    // Pull the facility information.
                    db.general.execute("SELECT * FROM digital_room.facility WHERE facility = '" + data.facility.destination + "';");
                    db.general.fetchRow();

                    orderSpecs.facilityId = db.general.getString(3);
                    data.facility.id = db.general.getString(3);

                    // Set any facility level breakers to disable processes
                    data.facility.breaker = {
                        lam: db.general.getString(5) == 'y'
                    }
                }

                if(orderSpecs.reprint)[
                    data.reprint = true
                ]

                // Material overrides
                // -----------------------------------------------------------------------------------------
                
                // Check for DS 13oz-Matte remapping to 13oz-Smooth
                if(data.doubleSided == null || data.doubleSided == orderSpecs.doubleSided){
                    if(orderSpecs.doubleSided && orderSpecs.paper.map.wix == 48 && orderSpecs.item.subprocess != "3,4" && orderSpecs.item.subprocess != "4" && orderSpecs.item.value != "X-Stand Banners"){
                        matInfoCheck = true;
                        orderSpecs.paper.map.wix = 51;
                        data.prismStock = "13 oz. Smooth Matte"
                    }
                }

                // Reassign this product in PRISM.
                if(orderSpecs.paper.map.arl == 101 && data.facility.destination == "Arlington"){
                    data.prismStock = "13 oz. Smooth Matte"
                }

                // Reassign this product in PRISM.
                if(orderSpecs.paper.map.arl == 113 && data.facility.destination == "Van Nuys"){
                    data.prismStock = "13 oz. Poly Film"
                }

                // 4mil with "Adhesive Fabric" materials needs to print on Adhesive Fabric
                if(orderSpecs.paper.map.wix == 73 && orderSpecs.material.value == "Adhesive Fabric"){
                    matInfoCheck = true;
                    orderSpecs.paper.map.wix = 68;
                }

                // 4mil with laminate need to print on Floor Decal
                if(orderSpecs.paper.map.wix == 73 && orderSpecs.laminate.active == true){
                    orderSpecs.paper.map.wix = 74;
                }

                // Pull the material information if it hasn't been pulled yet.
                if(matInfo == null || matInfoCheck){
                    matInfo = getMatInfo(orderSpecs, db);

                    // Material data is missing from the material table, might be a paper mapping issue.
                    if(matInfo == "Material Data Missing"){
                        s.log(3, data.gangNumber + " :: Material entry doesn't exist, job rejected.");
                        sendEmail_db(s, data, matInfo, getEmailResponse("Undefined Material", null, orderSpecs, data, userInfo, null), userInfo);
                        job.sendTo(findConnectionByName_db(s, "Undefined"), job.getPath());
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID]
                        ],[
                            ["status","Gang Failed"],
                            ["note","Undefined material."]
                        ]));
                        db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                            ["project-id", data.projectID]
                        ],[
                            ["status","Parse Failed"],
                            ["note","Undefined material."]
                        ]));
                        return;
                    }
                }

                // If the orderSpec facility is different from the destination facility, check if routing is active, reject if not.
                if(orderSpecs.facility != data.facility.destination){
                    if(!submit.route.active){
                        s.log(3, data.gangNumber + " :: Facility mismatch.");
                        sendEmail_db(s, data, matInfo, getEmailResponse("Facility Mismatch", null, matInfo, data, userInfo, null), userInfo);
                        job.sendToNull(job.getPath());
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID]
                        ],[
                            ["status","Gang Failed"],
                            ["note","Facility mismatch."]
                        ]))
                        db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                            ["project-id", data.projectID]
                        ],[
                            ["status","Parse Failed"],
                            ["note","Facility mismatch."]
                        ]))
                        return
                    }
                }

                // Check if the unwind spec is ready to use.
                if(orderSpecs.unwind.active && !orderSpecs.unwind.enable){
                    data.notes.push([node.getAttributeValue('ID'),"Removed","Unwind rotation not defined in automation. Notify Bret."])
                    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                        ["project-id",data.projectID],
                        ["item-number",orderSpecs.jobItemId]
                    ],[
                        ["status","Removed from Gang"],
                        ["note","Unwind rotation issue."]
                    ]))
                    continue;
                }

                // Items larger than 140" in either dim can't go to VN.
                if(data.facility.destination == "Van Nuys"){
                    if(orderSpecs.width >= 144 || orderSpecs.height >= 144){
                        data.notes.push([orderSpecs.jobItemId,"Removed","Item over 140\" assigned to VN."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Too large for VN."]
                        ]))
                        continue;
                    }
                }

                // If bannerstands aren't enabled for produciton, remove them from the gang.
                if(orderSpecs.bannerstand.active){
                    if(!orderSpecs.bannerstand.enabled){
                        data.notes.push([orderSpecs.jobItemId,"Removed","Bannerstand not approved for production."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Bannerstand not approved for production."]
                        ]))
                        continue;
                    }
                } 

                // Enable the force laminate override
                if(matInfo.forceLam){
                    orderSpecs.laminate.active = true
                }

                // Reassign printers and associated data based on various criteria.
                if(data.facility.destination == "Arlington"){
                    if(matInfo.prodName == "13oz-Matte"){
                        if(orderSpecs.width > 59 && orderSpecs.height > 59){
                            matInfo.width = 125;
                            matInfo.phoenixStock = "Roll_125";
                        }
                    }
                    if(matInfo.prodName == "13oz-PolyFilm"){
                        if(orderSpecs.width >= 37 && orderSpecs.height >= 37){
                            //matInfo.width = 53;
                            //matInfo.phoenixStock = "Roll_53";
                        }
                    }
                }

                // Reassign printers and associated data based on various criteria.
                if(data.facility.destination == "Van Nuys"){
                    if(matInfo.prodName == "PolyFilm"){
                        if(orderSpecs.width >= 59 && orderSpecs.height >= 59){
                            matInfo.width = 125;
                            matInfo.phoenixStock = "Roll_125";
                        }
                    }
                }

                // Override all of the above
                if(submit.material.active){
                    matInfo.width = submit.material.width;
                    if(submit.material.height != null && submit.material.height != 0){
                        matInfo.height = submit.material.height;
                    }
                    matInfo.phoenixStock = submit.material.stock;
                }

                // Move large rolled product from the P10 to the 350.
                if(data.facility.destination == "Salt Lake City"){
                    if(matInfo.printer.name == "P10"){
                        if(orderSpecs.width > matInfo.height || orderSpecs.height > matInfo.height){
                            //matInfo.printer.name = "P5-350-HS";
                            //data.printer = "P5-350-HS";
                            //misc.rejectPress = false;
                        }
                    }
                }
                
                // Set the processes and subprocesses values and check if following items match it.
                if(data.prodName == null){
                    data.prodName = matInfo.prodName;
                    data.prodMatFileName = matInfo.prodMatFileName != null ? matInfo.prodMatFileName : matInfo.prodName;
                    
                    data.paper = orderSpecs.paper.value;
                    if(data.prismStock == null){
                        data.prismStock = orderSpecs.paper.value;
                    }
                    data.date.due = orderSpecs.date.due;
                    
                    data.doubleSided = orderSpecs.doubleSided;
                    data.secondSurface = orderSpecs.secondSurface;
                    data.laminate.active = orderSpecs.laminate.active;
                    data.laminate.method = orderSpecs.laminate.method;
                    data.laminate.value = orderSpecs.laminate.value;
                    data.coating.active = orderSpecs.coating.active;
                    data.coating.method = orderSpecs.coating.method;
                    data.coating.value = orderSpecs.coating.value;
                    data.frontCoating.enabled = orderSpecs.frontCoating.enabled;
                    data.frontCoating.label = orderSpecs.frontCoating.label;
                    data.frontCoating.value = orderSpecs.frontCoating.value;
                    data.mount.active = orderSpecs.mount.active;

                    data.impositionProfile = {
                        name: matInfo.impositionProfile,
                        method: "Default (" + matInfo.phoenixMethodUserFriendly + ")"
                    }

                    data.cropGang = matInfo.cropGang;
                    data.finishingType = orderSpecs.finishingType;
                    data.rotateFront = matInfo.rotateFront;
                    data.rotateBack = matInfo.rotateBack;
                    data.rotate90 = matInfo.rotate90;
                    data.sideMix = matInfo.sideMix;
                    data.printer = matInfo.printer.name;
                    data.phoenixStock = matInfo.phoenixStock;
                    data.phoenix.printExport = matInfo.phoenix.printExport;
                    data.phoenix.cutExport = matInfo.phoenix.cutExport;

                    data.phoenix.gangLabel.push(matInfo.prodName)
                    
                    // Apply special labels.
                    // For LFP products (roll and sheet), apply coating as a laminate option.
                    if(matInfo.type == "roll" || matInfo.type == "sheet"){
                        if(data.coating.active || data.laminate.active){
                            data.phoenix.gangLabel.push("Lam");
                        }
                    }

                    // Mount label.
                    if(data.mount.active){
                        data.phoenix.gangLabel.push("Mount");
                    }
                }

                // Check for side deviation.
                if(data.doubleSided != orderSpecs.doubleSided){
                    if(data.sideMix || submit.override.sideMix){
                        data.doubleSided = true;
                    }else{
                        var temp = orderSpecs.doubleSided ? "Double Sided" : "Single Sided"
                        data.notes.push([orderSpecs.jobItemId,"Removed","Different process, " + temp + "."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Different process: " + temp]
                        ]))
                        continue;
                    }
                }

                // If it's a DS banner, reduce the max length of the gang.
                if(data.facility.destination == "Wixom"){
                    if(matInfo.prodName == "13oz-Smooth" || matInfo.prodName == "18oz-Matte"){
                        if(data.doubleSided || orderSpecs.doubleSided){
                            matInfo.height = 190;
                        }
                    }
                }

                // Reassign printers and associated data based on various criteria.
                if(data.facility.destination == "Salt Lake City"){
                    if(matInfo.prodName == "Foamboard"){
                        if(orderSpecs.doubleSided){
                            matInfo.width = 48;
                            matInfo.height = 96;
                            data.phoenixStock = "Mat_Foamboard"
                        }
                    }
                }

                if(data.printer != matInfo.printer.name){
                    if(misc.rejectPress){
                        data.notes.push([orderSpecs.jobItemId,"Removed","Different printer " + matInfo.printer.name + "."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Different printer: " + matInfo.printer.name]
                        ]))
                        continue;
                    }
                }
                
                // Deviation checks to make sure all of the items in the gang are able to go together.
                if(data.prodName != matInfo.prodName){
                    data.notes.push([orderSpecs.jobItemId,"Removed","Different process, " + matInfo.prodName + "."]);
                    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                        ["project-id",data.projectID],
                        ["item-number",orderSpecs.jobItemId]
                    ],[
                        ["status","Removed from Gang"],
                        ["note","Different process: " + matInfo.prodName]
                    ]))
                    continue;
                }
                
                // Check for paper deviation
                if(data.paper != orderSpecs.paper.value){
                    data.notes.push([orderSpecs.jobItemId,"Removed","Different IMS material, " + orderSpecs.paper.value + "."]);
                    data.notes.push([orderSpecs.jobItemId,"Priority","Different IMS material, " + orderSpecs.paper.value + "."]);
                    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                        ["project-id",data.projectID],
                        ["item-number",orderSpecs.jobItemId]
                    ],[
                        ["status","Removed from Gang"],
                        ["note","Different IMS material: " + orderSpecs.paper.value]
                    ]))
                    continue;
                }
                
                // If finishing hem type is different, remove them from the gang.
                if(data.facility.destination != "Arlington" && data.facility.destination != "Van Nuys"){
                    if(!submit.override.mixedHem){
                        if(data.finishingType != orderSpecs.finishingType){
                            data.notes.push([orderSpecs.jobItemId,"Removed","Different hem type, " + orderSpecs.finishingType + "."]);
                            db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                                ["project-id",data.projectID],
                                ["item-number",orderSpecs.jobItemId]
                            ],[
                                ["status","Removed from Gang"],
                                ["note","Different hem type: " + orderSpecs.finishingType]
                            ]))
                            continue;
                        }
                    }
                }

                // Check if print surface is allowed for material. -CM
                if((!matInfo.standardPrint && !orderSpecs.secondSurface) || (!matInfo.reversePrint && orderSpecs.secondSurface)){
                    var type = orderSpecs.secondSurface ? "2nd Surface" : "1st Surface"
                    data.notes.push([orderSpecs.jobItemId, "Removed.", "Print surface not allowed with material, " + type + ", " + matInfo.prodName + "."]);
                    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                        ["project-id",data.projectID],
                        ["item-number",orderSpecs.jobItemId]
                    ],[
                        ["status","Removed from Gang"],
                        ["note","Print surface issue."]
                    ]))
                    continue;
                }
                
                // Check if surface deviation
                if(data.prodName != "CutVinyl" && data.prodName != "CutVinyl-Frosted"){
                    if(data.secondSurface != orderSpecs.secondSurface){
                        var type = orderSpecs.secondSurface ? "2nd Surface" : "1st Surface"
                        data.notes.push([orderSpecs.jobItemId,"Removed","Different process, " + type + "."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Different process: " + type]
                        ]))
                        continue;
                    }
                }

                // If the laminate breaker is on, separate the laminates out.
                if(!data.facility.breaker.lam){
                    
                    // Check if coating deviation
                    if(data.coating.active != orderSpecs.coating.active){
                        var type = orderSpecs.coating.active ? "Coated" : "Uncoated"
                        data.notes.push([orderSpecs.jobItemId,"Removed","Different process, " + type + "."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Different process: " + type]
                        ]))
                        continue;
                    }
                    
                    // Check if laminate deviation
                    if(data.laminate.active != orderSpecs.laminate.active){
                        var type = orderSpecs.laminate.active ? "Laminate" : "Unlaminated"
                        data.notes.push([orderSpecs.jobItemId,"Removed","Different process, " + type + "."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Different process: " + type]
                        ]))
                        continue;
                    }
                }

                // Laminate and coating checks, skip if allowed to mix.
                if(!matInfo.lamMix && !submit.override.mixedLam){

                    // Check if coating deviation
                    if(data.coating.active != orderSpecs.coating.active){
                        var type = orderSpecs.coating.active ? "Coated" : "Uncoated"
                        data.notes.push([orderSpecs.jobItemId,"Removed","Different process, " + type + "."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Different process: " + type]
                        ]))
                        continue;
                    }
                    
                    // Check if laminate deviation
                    if(data.laminate.active != orderSpecs.laminate.active){
                        var type = orderSpecs.laminate.active ? "Laminate" : "Unlaminated"
                        data.notes.push([orderSpecs.jobItemId,"Removed","Different process, " + type + "."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Different process: " + type]
                        ]))
                        continue;
                    }
                }

                // If we are allowing the laminate to mix with non lam, throw a flag for the file name.
                if(matInfo.prodName == "Magnet" && data.facility.destination == "Salt Lake City"){
                    if((data.laminate.active != orderSpecs.laminate.active) || (data.coating.active != orderSpecs.coating.active)){
                        data.mixedLam = true
                    }
                }
                
                // Check if mount deviation
                if(data.mount.active != orderSpecs.mount.active){
                    var type = orderSpecs.mount.active ? "Mounted" : "Not Mounted"
                    data.notes.push([orderSpecs.jobItemId,"Removed","Different process, " + type + "."]);
                    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                        ["project-id",data.projectID],
                        ["item-number",orderSpecs.jobItemId]
                    ],[
                        ["status","Removed from Gang"],
                        ["note","Different process: " + type]
                    ]))
                    continue;
                }

                // Separate out the due dates so they can't gang together.
                if(!submit.override.date){
                    if(orderSpecs.date.due != data.date.due){
                        data.notes.push([orderSpecs.jobItemId,"Removed","Different due date, " + orderSpecs.date.due + "."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",orderSpecs.jobItemId]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Different due date: " + orderSpecs.date.due]
                        ]))
                        continue;
                    }
                }

                // Reassign the dueDate if we are mixing due dates.
                if(orderSpecs.date.due < data.date.due){
                    data.date.due = orderSpecs.date.due
                }
                
                orderSpecs.productNotes = node.getAttributeValue('Notes');
                
                orderSpecs.filePath = node.getAttributeValue('ContentFile').toString();
                orderSpecs.filePath = orderSpecs.filePath.replace(/\//g,'\\');
                orderSpecs.filePath = orderSpecs.filePath.split('\\');
                
                // Once compiled, push to working array.
                orderArray.push(orderSpecs);
            }

            // 1st safety check for if all files have been removed from the gang.
            if(orderArray.length == 0){
                sendEmail_db(s, data, matInfo, getEmailResponse("Empty Gang", null, matInfo, data, userInfo, null), userInfo);
                job.sendToNull(job.getPath());
                db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                    ["project-id", data.projectID]
                ],[
                    ["status","Parse Failed"],
                    ["note","All files removed."]
                ]))
                return
            }
            
            data.dateID = data.date.due.split("T")[0].split("-")[1] + "-" + data.date.due.split("T")[0].split("-")[2];
            data.sku = skuGenerator(3, "numeric", data, db);
                
            // Create the CSV and the new Job() for the project.
            var newCSV = s.createNewJob();
            var csvPath = newCSV.createPathWithName(data.gangNumber + ".csv", false);
            var csvFile = new File(csvPath);
                csvFile.open(File.Append);
                
            var writeHeader = true;

            var dynamic = getTargetHeight(s, matInfo, orderArray, data)

            // Set the usableArea
            var usableArea = {
                width: matInfo.width - matInfo.printer.margin.left - matInfo.printer.margin.right,
                height: dynamic.height.value - matInfo.printer.margin.top - matInfo.printer.margin.bottom
            }
                
            // Special label for gang level info that prints on the sheet.
            if(data.phoenix.gangLabel.length == 0){
                data.phoenix.gangLabel.push("None");
            }
                data.phoenix.gangLabel.join(', ');
        
            // Loop through the approved files in the array.
            for(var i=0; i<orderArray.length; i++){
             
                // Product level data.
                var product = {
                    contentFile: orderArray[i].filePath[orderArray[i].filePath.length-1],
                    artworkFile: orderArray[i].filePath[orderArray[i].filePath.length-1],
                    orderNumber: orderArray[i].jobOrderId,
                    itemNumber: orderArray[i].jobItemId,
                    itemName: orderArray[i].itemName,
                    quantity: orderArray[i].qty,
                    width: round(Number(orderArray[i].width)),
                    height: round(Number(orderArray[i].height)),
                    doubleSided: orderArray[i].doubleSided,
                    secondSurface: orderArray[i].secondSurface,
                    laminate: orderArray[i].laminate.active ? true : false,
                    coating: orderArray[i].coating.active ? true : false,
                    rotation: matInfo.rotation,
                    allowedRotations: matInfo.allowedRotations,
                    stock: data.phoenixStock,
                    spacingBase: matInfo.spacing.base,
                    spacingTop: matInfo.spacing.top == undefined ? matInfo.spacing.base : matInfo.spacing.top,
                    spacingBottom: matInfo.spacing.bottom == undefined ? matInfo.spacing.base : matInfo.spacing.bottom,
                    spacingLeft: matInfo.spacing.left == undefined ? matInfo.spacing.base : matInfo.spacing.left,
                    spacingRight: matInfo.spacing.right == undefined ? matInfo.spacing.base : matInfo.spacing.right,
                    offcut:{
                        top: matInfo.offcut.top,
                        bottom: matInfo.offcut.bottom,
                        left: matInfo.offcut.left,
                        right: matInfo.offcut.right
                    },
                    bleed: {
                        type: matInfo.bleed.type,
                        base: matInfo.bleed.base,
                        top: matInfo.bleed.top == undefined ? matInfo.bleed.base : matInfo.bleed.top,
                        bottom: matInfo.bleed.bottom == undefined ? matInfo.bleed.base : matInfo.bleed.bottom,
                        left: matInfo.bleed.left == undefined ? matInfo.bleed.base : matInfo.bleed.left,
                        right: matInfo.bleed.right == undefined ? matInfo.bleed.base : matInfo.bleed.right
                    },
                    grade: matInfo.grade,
                    shapeSearch: "Largest",
                    dieDesignSource: "ArtworkPaths",
                    dieDesignName: "",
                    overrunMax: matInfo.overrunMax,
                    overrunMin: 0,
                    notes: [],
                    transfer: false,
                    pageHandling: matInfo.pageHandling,
                    group: null,
                    rollLabel:{
                        eyeMark: false
                    },
                    customLabel:{
                        apply: false,
                        value: "",
                        size: ""
                    },
                    script:{
                        name: [],
                        parameters: [],
                        dynamic: null,
                        pockets: null
                    },
                    subprocess:{
                        name: null,
                        exists: false,
                        mixed: false,
                        undersize: false,
                        orientationCheck: true,
                        template: null
                    },
                    nametag: "",
                    hemValue: typeof(orderArray[i]["hem"]) == "undefined" ? null : orderArray[i].hem.value,
                    query: null,
                    date:{
                        due: orderArray[i].date.due,
                        abbr: orderArray[i].date.due.split("-")[1] + "-" + orderArray[i].date.due.split("-")[2],
                        dayID: new Date(Date.parse(orderArray[i].date.due)).getDay()
                    },
                    late: now.date >= orderArray[i].date.due,
                    reprint:{
                        status: orderArray[i].reprint.status,
                        reason: orderArray[i].reprint.reason
                    },
                    edge: getEdgeFinishing(orderArray[i]),
                    pocket:{
                        top: orderArray[i].pocket.side.top,
                        bottom: orderArray[i].pocket.side.bottom,
                        left: orderArray[i].pocket.side.left,
                        right: orderArray[i].pocket.side.right
                    },
                    orientation:{
                        status: null,
                        result:{
                            standard: null,
                            flipped: null
                        },
                        width:{
                            standard: null,
                            flipped: null
                        },
                        height:{
                            standard: null,
                            flipped: null
                        }
                    },
                    shipType: getShipType(orderArray[i].ship.serviceCode),
                    forceUndersize: matInfo.forceUndersize,
                    cutLayerName: matInfo.cutter.layerName,
                    unwind:{
                        active: orderArray[i].unwind.active,
                        value: orderArray[i].unwind.value,
                        key: orderArray[i].unwind.key,
                        rotation: orderArray[i].unwind.rotation
                    }
                }
                
                var scale = {
                    width: 100,
                    height: 100,
                    modifier: 1,
                    adjusted:{
                        width: false,
                        height: false
                    },
                    locked: false,
                    check:{
                        result:{
                            standard: null,
                            flipped: null
                        },
                        width:{
                            standard: null,
                            flipped: null
                        },
                        height:{
                            standard: null,
                            flipped: null
                        }
                    }
                }
                
                // Check if it should use buttCut processing
                if(matInfo.prodName == "Coroplast"){
                    if(data.facility.destination == "Salt Lake City"){
                        if(orderArray[i].shape.method == "Rect"){
                            // Turn buttcut off if required.
                            db.general.execute("SELECT * FROM digital_room.buttcut_disable WHERE item_number = '" + orderArray[i].jobItemId + "';");
                            if(db.general.isRowAvailable()){
                                data.notes.push([product.itemNumber,"Notes","Butt cut disabled."]);

                            // Otherwise check the scenarios...
                            }else{
                                // Scenario 1 to activate butt-cut
                                if(orderArray[i].qty >= 20){
                                    if(orderArray[i].width <= 24 || orderArray[i].height <= 48){
                                        product.query = "19";
                                    }
                                }
                                // Scenario 2 to activate butt-cut
                                if(orderArray[i].qty >= 2){
                                    if(orderArray[i].width == 48 && orderArray[i].height == 48){
                                        product.query = "19";
                                    }
                                }
                            }
                        }
                    }
                }

                // Max width Perf
                if(matInfo.prodName == "Perf"){
                    if(product.width >= 53 && product.height >= 53){
                        product.query = "22"
                    }
                }
                
                // Check for butt-weld processing
                if(data.facility.destination == "Wixom"){
                    if(orderArray[i].hem.method == "Weld" || orderArray[i].hem.method == "Sewn"){
                        if(!orderArray[i].doubleSided){
                            product.query = "20";
                        }
                    }
                }
                
                // Full-Sheet subprocessing
                if((product.width == 48 && product.height == 96) || (product.height == 48 && product.width == 96)){
                    if(matInfo.width == 48 && matInfo.height == 96){
                        product.query = "21";
                        product.subprocess.undersize = false;
                        scale.locked = true;
                    }
                }
                
                // If there is a subprocess associated to the item, pull the data and reassign the parameters.
                product.subprocess = getSubprocess(dir.subprocess, db, orderArray[i], matInfo, product, data, scale, product.query, dynamic);

                // Reject the subprocess if it's not ready.
                if(product.subprocess == "Reject"){
                    s.log(3, data.projectID + " :: Subprocess still in testing, job rejected.");
                    sendEmail_db(s, data, matInfo, getEmailResponse("Rejected Subprocess", product, matInfo, data, userInfo, null), userInfo);
                    job.sendTo(findConnectionByName_db(s, "Undefined"), job.getPath());
                    return
                }

                //If bannerstands are enabled and template ID is not assigned for specified subprocess, remove from gang. -CM
                if(orderArray[i].bannerstand.active){
                    if(product.subprocess.name == "Retractable" || product.subprocess.name == "TableTop" || product.subprocess.name == "MiniBannerStand"){
                        if(orderArray[i].bannerstand.template.id == null){
                            data.notes.push([orderArray[i].jobItemId,"Removed","Template ID not assigned."]);
                            db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                                ["project-id",data.projectID],
                                ["item-number",orderArray[i].jobItemId]
                            ],[
                                ["status","Removed from Gang"],
                                ["note","Template ID not assigned."]
                            ]))
                            continue;
                        }
                    }
                }

                // If it's DS 13ozBanner for SLC, skip it and send an email.
                if(data.facility.destination == "Salt Lake City"){
                    if(orderArray[i].doubleSided && matInfo.prodName == "13ozBanner"){
                        if(product.subprocess.name != "Retractable"){
                            data.notes.push([product.itemNumber,"Removed","DS 13oz banner assigned to SLC."]);
                            db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                                ["project-id",data.projectID],
                                ["item-number",product.itemNumber]
                            ],[
                                ["status","Removed from Gang"],
                                ["note","Can not produce in SLC."]
                            ]))
                            continue;
                        }
                    }
                }

                // If it's DS product for VN, skip it and send an email.
                if(data.facility.destination == "Van Nuys"){
                    if(orderArray[i].doubleSided){
                        data.notes.push([product.itemNumber,"Removed","DS product assigned to VN."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",product.itemNumber]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Can not produce in VN."]
                        ]))
                        continue;
                    }
                }

                // Long banners with weld in ARL need to go somewhere else.
                if(data.facility.destination == "Arlington"){
                    if(matInfo.prodName == "13oz-Matte"){
                        if(orderArray[i].hem.method == "Weld"){
                            if(orderArray[i].width >= 241 || orderArray[i].height >= 241){
                                data.notes.push([product.itemNumber,"Removed","Welded banner over 168\" assigned to ARL."]);
                                db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                                    ["project-id",data.projectID],
                                    ["item-number",product.itemNumber]
                                ],[
                                    ["status","Removed from Gang"],
                                    ["note","Can not produce in ARL."]
                                ]))
                                continue;
                            }
                        }
                    }
                }

                // Set the gang mixing value on the data object from the first subprocess pulled.
                if(data.mixed == null){
                    data.mixed = product.subprocess.mixed;
                }

                // If the subprocess can't be mixed with other subprocesses, reject it.
                if(data.mixed != product.subprocess.mixed){
                    data.notes.push([product.itemNumber,"Removed","Different subprocess, " + product.subprocess.name + "."]);
                    db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                        ["project-id",data.projectID],
                        ["item-number",product.itemNumber]
                    ],[
                        ["status","Removed from Gang"],
                        ["note","Different subprocess: " + product.subprocess.name]
                    ]))
                    continue
                }

                // If the subprocess name isn't in the array yet, add it.
                if(!contains(data.subprocess, product.subprocess.name)){
                    data.subprocess.push(product.subprocess.name);
                }
                
                // If the order is a reprint, send an email to the user.
                if(product.reprint.status){
                    data.notes.push([product.itemNumber,"Notes","Reprint! Check IMS. Reason: " + product.reprint.reason]);
                }
                
                // If the order is a late.
                if(product.late){
                    data.notes.push([product.itemNumber,"Notes","Late!"]);
                    data.dateID = now.month + "-" + now.day
                }
                
                // If the order is a replacement, send an email to the user.
                if(orderArray[i].replacement){
                    data.notes.push([product.itemNumber,"Notes","Replacement. Automated undersizing has been disabled."]);
                    //data.notes.push([product.itemNumber,"Priority","Replacement. Automated undersizing has been disabled."]);
                    product.subprocess.undersize = false;
                }
                
                // Gather the source file options
                var file = {
                    source: new File(watermarkDrive + "/" + product.contentFile),
                    depository: new File("//10.21.71.213/File Repository/" + product.contentFile),
                    usableData: false,
                    stats: null
                }
                    
                // Do we need to transfer the file from the depository?
                if(file.depository.exists){
                    if(submit.override.redownload.bool){
                        try{
                            file.depository.remove();
                            s.log(2, product.contentFile + " removed successfully, redownloading.")
                        }catch(e){
                            s.log(2, product.contentFile + " failed to delete.")
                        }
                        product.transfer = true;
                    }else{
                        file.stats = new FileStatistics("//10.21.71.213/File Repository/" + product.contentFile);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",product.itemNumber]
                        ],[
                            ["status","Already Exists"]
                        ]))
                    }
                }else{
                    if(data.fileSource == "S3 Bucket"){
                        product.transfer = true;
                    }else{
                        if(file.source.exists){
                            file.stats = new FileStatistics(watermarkDrive + "/" + product.contentFile);
                            product.transfer = true;
                        }else{
                            data.notes.push([product.itemNumber,"Notes","File missing: " + product.contentFile]);
                            db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                                ["project-id",data.projectID],
                                ["item-number",product.itemNumber]
                            ],[
                                ["status","Removed from Gang"],
                                ["note","File missing: " + product.contentFile]
                            ]))
                            continue;
                        }
                    }
                }

                // Read some data from the file.
                try{
                    if(file.stats != null){                        
                        file.width = file.stats.getNumber("TrimBoxDefinedWidth")/72;
                        file.height = file.stats.getNumber("TrimBoxDefinedHeight")/72;
                        file.pages = file.stats.getNumber("NumberOfPages");
                        file.usableData = true;
                    }
                }catch(e){}
                
                // If the file exists and you have data to use, go here.
                if(file.usableData){
                    if(product.subprocess.orientationCheck){

                        // Check if the 2nd page exists for DS product.
                        if(file.pages == 1 && product.doubleSided){
                            data.notes.push([product.itemNumber,"Removed","File missing 2nd page for DS printing."]);
                            db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                                ["project-id",data.projectID],
                                ["item-number",product.itemNumber]
                            ],[
                                ["status","Removed from Gang"],
                                ["note","Missing 2nd page for DS printing."]
                            ]))
                            continue;
                        }

                        // Perform the orientation and scale logic
                        if(data.prodName != "CutVinyl" && data.prodName != "CutVinyl-Frosted"){
                            
                            // Check for standard orientation of the file.
                            compareToFile(s, round(product.height + product.edge.top.allowance + product.edge.bottom.allowance), file.height, product, scale, "height", "standard")
                            compareToFile(s, round(product.width + product.edge.left.allowance + product.edge.right.allowance), file.width, product, scale, "width", "standard")

                            // Check for flipped orientation of the file.
                            compareToFile(s, round(product.width + product.edge.top.allowance + product.edge.bottom.allowance), file.height, product, scale, "height", "flipped")
                            compareToFile(s, round(product.height + product.edge.left.allowance + product.edge.right.allowance), file.width, product, scale, "width", "flipped")

                            // Compile the orientation results
                            product.orientation.result.standard = (product.orientation.height.standard && product.orientation.width.standard);
                            product.orientation.result.flipped = (product.orientation.height.flipped && product.orientation.width.flipped);

                            // Compile the orientation results
                            scale.check.result.standard = (scale.check.height.standard == scale.check.width.standard);
                            scale.check.result.flipped = (scale.check.height.flipped == scale.check.width.flipped);

                            // If the file is square.
                            if(product.height == product.width){
                                product.orientation.status = "Square";
                                if(scale.check.result.standard){
                                    scale.modifier = 1;
                                }

                            // If the file is in WxH orientation.
                            }else if(product.orientation.result.standard && !product.orientation.result.flipped){
                                product.orientation.status = "Standard";
                                if(scale.check.result.standard){
                                    scale.modifier = scale.check.height.standard;
                                }

                            // If the file is in HxW orientation.
                            }else if(!product.orientation.result.standard && product.orientation.result.flipped){
                                product.orientation.status = "Flipped";
                                product.height = [product.width, product.width = product.height][0]; // Flips the WxH data.
                                //data.notes.push([product.itemNumber,"Notes","Flipped sizes to standard format."]);
                                if(scale.check.result.flipped){
                                    scale.modifier = scale.check.height.flipped;
                                }

                            // If neither is true then we have an issue, use the previous logic to help determine the orientation.
                            }else{
                                var variance = {
                                    standard: Math.abs(file.width-product.width) + Math.abs(file.height-product.height),
                                    flipped: Math.abs(file.width-product.height) + Math.abs(file.height-product.width)
                                }
    
                                if(product.pocket.top || product.pocket.bottom){
                                    product.orientation.status = variance.standard >= variance.flipped ? "Flipped" : "Standard";
                                }else{
                                    product.orientation.status = variance.standard > variance.flipped ? "Flipped" : "Standard";
                                }

                                if(product.orientation.status == "Flipped"){
                                    product.height = [product.width, product.width = product.height][0]; // Flips the WxH data.
                                }

                                product.orientation.status = "Failed"
                                file.usableData = false;
                                data.notes.push([product.itemNumber,"Notes","Can not confirm orientation or scale, verify in gang."])
                                //data.notes.push([product.itemNumber,"Priority","Can not confirm orientation or scale, verify in gang."]);
                            }

                            // I have no idea what this does.
                            if(Math.round((file.width/product.width)*100) == 10 && Math.round((file.height/product.height)*100) == 10){
                                data.notes.push([product.itemNumber,"Notes","Please carefully check for correct size."]);
                                product.orientation.status = "Standard"
                            }
                        }
                    }
                }

                // Otherwise determine the scale of the file by using the logic Prepress should be following as well.
                if(!file.usableData){
                    if(matInfo.type == "roll"){
                        if(data.facility.destination == "Salt Lake City" || data.facility.destination == "Brighton" || data.facility.destination == "Wixom"){
                            if(product.width >= 198 || product.height >= 198){
                                scale.modifier = 2;
                            }
                            if(product.width >= 398 || product.height >= 398){
                                scale.modifier = 4;
                            }
                            if(product.width >= 797 || product.height >= 797){
                                scale.modifier = 10;
                            }
                        }
                        if(data.facility.destination == "Van Nuys" || data.facility.destination == "Arlington"){
                            if(product.width >= 144 || product.height >= 144){
                                scale.modifier = 2;
                            }
                            if(product.width >= 287 || product.height >= 287){
                                scale.modifier = 4;
                            }
                            if(product.width >= 573 || product.height >= 573){
                                scale.modifier = 10;
                            }
                        }
                    }
                }

                // If it's a breakaway banner then adjust some parameters
                if(product.subprocess.name == "Breakaway"){
                    if(file.pages != 2){
                        data.notes.push([product.itemNumber,"Removed","Breakaway banner not split."]);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",product.itemNumber]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Breakaway banner file incorrect."]
                        ]))
                        continue;
                    }
                    product.artworkFile = product.contentFile.split('.pdf')[0] + "_2.pdf"
                    db.history.execute(generateSqlStatement_Insert(s, "history.details_item", [
                        ["project-id", data.projectID],
                        ["gang-number", data.gangNumber],
                        ["order-number", product.orderNumber],
                        ["item-number", product.itemNumber],
                        ["page", "2"],
                        ["status", "Initiated"]
                    ]));	
                }
                
                // Check if the item_number can be undersized.
                db.general.execute("SELECT * FROM digital_room.item_number_fullsize WHERE item_number = '" + product.itemNumber + "';");
                if(db.general.isRowAvailable()){
                    product.subprocess.undersize = false;
                }

                // Check the yard frame table for any hardware that would require full size product.
                if(orderArray[i].yardframe.active){
                    if(!orderArray[i].yardframe.undersize){
                        product.subprocess.undersize = false
                        data.notes.push([product.itemNumber,"Notes","Requires hardware, undersizing disabled."]);
                    }
                }

                // Disable undersizing for a size that is assumed to be riders.
                if(product.width == 24 && product.height == 6){
                    product.subprocess.undersize = false;
                }
                
                // Size adjustments ----------------------------------------------------------
                // General automated scaling for when approaching material dims.
                // Not for undersizing to force better yield.
                if(!scale.locked){
                    if(!submit.override.fullsize.gang && !contains(submit.override.fullsize.items, product.itemNumber)){
                        if(!data.oversize && !data.scaled){
                            if(product.width > product.height){
                                if(product.width >= usableArea.height){
                                    scale.width = ((usableArea.height-.25)/product.width)*100;
                                    scale.adjusted.width = true;
                                    if(product.width == product.height){
                                        scale.height = scale.width
                                    }
                                }
                                if(product.height >= usableArea.width){
                                    scale.height = ((usableArea.width-.25)/product.height)*100;
                                    scale.adjusted.height = true;
                                    if(product.width == product.height){
                                        scale.width = scale.height
                                    }
                                }
                            }else{
                                if(product.height >= usableArea.height){
                                    scale.height = ((usableArea.height-.25)/product.height)*100;
                                    scale.adjusted.height = true;
                                    if(product.width == product.height){
                                        scale.width = scale.height
                                    }
                                }
                                if(product.width >= usableArea.width){
                                    scale.width = ((usableArea.width-.25)/product.width)*100;
                                    scale.adjusted.width = true;
                                    if(product.width == product.height){
                                        scale.height = scale.width
                                    }
                                }
                            }
                        }
                    }
                    if(scale.width > 100){scale.width = 100}
                    if(scale.height > 100){scale.height = 100}
                }
                
                // If the product can be undersized...
                // This checks if the material info database is asking to undersize.
                if(product.subprocess.undersize && product.forceUndersize == true){
                    if(!submit.override.fullsize.gang && !contains(submit.override.fullsize.items, product.itemNumber)){

                        // If the width hasn't already been undersized automatically to fit on the material.
                        if(!scale.adjusted.width){
                            db.general.execute("SELECT * FROM digital_room.undersize WHERE type = 'width' and base = " + product.width + ";");
                            if(db.general.isRowAvailable()){
                                db.general.fetchRow();
                                scale.width = db.general.getString(3)/db.general.getString(2)*100;
                                scale.adjusted.width = true;
                            }
                        }
                        
                        // If the height hasn't already been undersized automatically to fit on the material.
                        if(!scale.adjusted.height){
                            db.general.execute("SELECT * FROM digital_room.undersize WHERE type = 'height' and base = " + product.height + ";");
                            if(db.general.isRowAvailable()){
                                db.general.fetchRow();
                                scale.height = db.general.getString(3)/db.general.getString(2)*100;
                                scale.adjusted.height = true;
                            }
                        }
                    }
                }
                
                // Retractable undersizing so it fits in the stand easier.
                // Undersizing has been disabled due to size happening with the templates now.
                if(product.subprocess.name == "Retractable" || product.subprocess.name == "UV-Greyback"){
                    if(!submit.override.fullsize.gang && !contains(submit.override.fullsize.items, product.itemNumber)){
                        if(product.width == 24){
                            //scale.width = 23.25/product.width*100;
                            //data.notes.push([product.itemNumber,"Notes",'Retractable width scaled. (' + Math.round(scale.width) + '%)']);
                        }
                        if(product.width == 33){
                            //scale.width = 33/product.width*100;
                            //data.notes.push([product.itemNumber,"Notes",'Retractable width scaled. (' + Math.round(scale.width) + '%)']);
                        }
                    }
                }
                
                // Backdrop undersizing for shipping purposes
                if(product.subprocess.name == "Backdrop"){
                    if(product.subprocess.undersize){
                        if(!submit.override.fullsize.gang && !contains(submit.override.fullsize.items, product.itemNumber)){
                            if(file.width == product.width){
                                // Width == 96
                                if(product.width == "96"){
                                    scale.width = 94/product.width*100;
                                    data.notes.push([product.itemNumber,"Notes",'Backdrop width undersized. (' + Math.round(scale.width) + '%)']);
                                }
                                // Height == 96
                                if(product.width != product.height){
                                    if(product.height == "96"){
                                        scale.height = 94/product.height*100;
                                        data.notes.push([product.itemNumber,"Notes",'Backdrop height undersized. (' + Math.round(scale.height) + '%)']);
                                    }
                                }
                            }
                        }
                    }
                }

                // Establish the difference in expected vs actual product width due to undersizing.
                var difference = {
                    width: product.width-(product.width*(scale.width/100)),
                    height: product.height-(product.height*(scale.height/100))
                }
                
                // Remove the file from the gang if the undersizing is too extreme.
                if(data.prodName != "CutVinyl" && data.prodName != "CutVinyl-Frosted"){
                    if((difference.width > 5) || (difference.height > 5)){
                        data.notes.push([product.itemNumber,"Removed",'File size is too different from expected size, removed from gang.']);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",product.itemNumber]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","File size discrepancy."]
                        ]))
                        continue;
                    // If the undersizing is greater than 1" but less than 5", remove it if a custom width was selected, otherwise just notify the user.
                    }else if((difference.width > 1) || (difference.height > 1)){
                        if(submit.material.active){
                            data.notes.push([product.itemNumber,"Removed",'File size is too different from expected size, removed from gang.']);
                            db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                                ["project-id",data.projectID],
                                ["item-number",product.itemNumber]
                            ],[
                                ["status","Removed from Gang"],
                                ["note","File size discrepancy."]
                            ]))
                            continue;
                        }else{
                            data.notes.push([product.itemNumber,"Notes",'Undersizing was greater than 1", please confirm accuracy in Phoenix report.']);
                            data.notes.push([product.itemNumber,"Notes",'Requested: ' + product.width + 'x' + product.height + ', Actual: ' + product.width*(scale.width/100) + 'x' + product.height*(scale.height/100)]);
                        }
                    }
                }
               
                //write imp instructions to the database -cm
                if(orderArray[i].impInstructions.active){
                    db.email.execute("INSERT INTO emails.impinst_notes (`project-id`,`gang-number`,`item-number`,`message`) VALUES ('" + data.projectID + "','" + data.gangNumber + "','" + product.itemNumber + "', '" + orderArray[i].impInstructions.value + "');");
                }

                // Rotation adjustments ----------------------------------------------------------
                // Coroplast rotation
                if(data.prodName == "Coroplast"){
                    if(product.subprocess.name != "FullSheet"){
                        if(Math.round((product.width*(scale.width/100))*100)/100 > usableArea.width){
                            product.rotation = "Custom";
                            product.allowedRotations = 90;
                        }
                    }
                }

                // Roll Label rotation
                // This has to be set BEFORE the setPhoenixMarks() function
                // We use this data inside the marks requirements.
                if(product.unwind.active){
                    product.rotation = "Custom";
                    if(product.unwind.key == 'NI'){
                        if(product.width >= product.height){
                            product.unwind.rotation = 270;
                        }
                    }
                    product.allowedRotations = product.unwind.rotation;
                    // Activate the custom eyemarks based on the height of the image when rotated.
                    if(product.unwind.rotation == 90 || product.unwind.rotation == 270){
                        if(product.height >= 5.62){
                            product.rollLabel.eyeMark = true;
                        }
                    }
                    // Activate the custom eyemarks based on the width of the image when not rotated.
                    if(product.unwind.rotation == 0 || product.unwind.rotation == 180){
                        if(product.width >= 5.62){
                            product.rollLabel.eyeMark = true;
                        }
                    }
                }
                
                // Brushed Silver rotation
                if(data.prodName == "BrushedSilver"){ // BrushedSilver rotates 90 degrees by default
                    if((product.height*(scale.width/100)) > usableArea.width){
                        product.rotation = "Orthogonal";
                        product.allowedRotations = 0;
                    }
                }
                
                // A-Frames Rotations
                if(product.subprocess.name == "A-Frame"){
                    // Rotate if the product is 22" wide or less.
                    if((product.width == 22 && product.height == 28) || (product.width == 28 && product.height == 22)){
                        product.rotation = "Custom";
                        product.allowedRotations = 0;
                    }
                }
                
                // Disable rotation for DS roll banners with pockets top or bottom for wixom, where possible.
                if(data.facility.destination == "Wixom"){
                    if(product.doubleSided){
                        if(orderArray[i].pocket.enable || orderArray[i].itemName == "Pole Banners" || orderArray[i].itemName == "Replacement Pole Banners"){
                            if(product.width*(scale.width/100) < usableArea.width){
                                product.rotation = "None";
                                product.allowedRotations = 0;
                            }
                        }
                    }
                }
                
                // Cut Vinyl adjustments (These should be moved to the database in the future)
                if(data.prodName == "CutVinyl" || data.prodName == "CutVinyl-Frosted"){
                    product.dieDesignSource = "ArtworkTrimbox";
                    product.transfer = true;
                    data.repository = "//10.21.71.213/Repository_VL/";
                    if(typeof(orderArray[i]["cut"]) != "undefined"){
                        if(orderArray[i].cut.method == "Reverse"){
                            product.nametag = "_Reverse";
                        }
                    }
                }

                // Set advanced settings for the marks
                var advancedSettings = {
                    hemLabel: setHemLabels(s, orderArray[i]),
                    productLabel: setProductLabel(s, orderArray[i]),
                    bannerSorting: setBannerSorting(s, orderArray[i])
                }

                // If it's contour at all, override the bleed type to margins, regardless of any facility or product.
                if(orderArray[i].shape.method == "Custom" || orderArray[i].diecut.method == "Custom" || orderArray[i].shape.method == "Oval"){
                    product.bleed.type = "Contour";
                }

                // Set the marks from the json file ----------------------------------------------------------
                marksArray = [];
                setPhoenixMarks(s, dir.phoenixMarks, matInfo, data, orderArray[i], product, marksArray, advancedSettings);
                setPhoenixScripts(s, dir.phoenixScripts, matInfo, data, orderArray[i], product);

                // If the product requires a custom label, apply it.
                if(product.customLabel.apply){
                    product.customLabel.value = product.width + '"x' + product.height + '" ' + product.itemName
                    
                    // For bannerstands, Retractables use the bannerstand value instead.
                    if(orderArray[i].bannerstand.active){

                        // Pull the SLC data
                        if(data.facility.destination == "Salt Lake City"){
                            product.customLabel.value = orderArray[i].bannerstand.nickname.slc == undefined ? orderArray[i].bannerstand.nickname.global : orderArray[i].bannerstand.nickname.slc;
                            product.customLabel.size = orderArray[i].bannerstand.displaySize.slc == undefined ? orderArray[i].bannerstand.displaySize.global : orderArray[i].bannerstand.displaySize.slc;

                        // Pull the WXM data
                        }else if(data.facility.destination == "Wixom"){
                            product.customLabel.value = orderArray[i].bannerstand.nickname.wxm == undefined ? orderArray[i].bannerstand.nickname.global : orderArray[i].bannerstand.nickname.wxm;
                            product.customLabel.size = orderArray[i].bannerstand.displaySize.wxm == undefined ? orderArray[i].bannerstand.displaySize.global : orderArray[i].bannerstand.displaySize.wxm;

                        // If it's not SLC or WXM.
                        }else{
                            product.customLabel.value = orderArray[i].bannerstand.nickname.global;
                            product.customLabel.size = orderArray[i].bannerstand.displaySize.global;
                        }
                    }
                };

                if(orderArray[i].replacement){
                    product.customLabel.value = "Replacement: " + product.customLabel.value
                }

                // Tension Stands Templates
                if(product.subprocess.name == "TensionStand"){
                    product.artworkFile = product.contentFile.split('.pdf')[0] + "_1.pdf"
                    product.dieDesignName = product.width + "x" + product.height + "_" + scale.modifier + "x";
                    product.customLabel.value = (i+1)+"-F";
                    if(!product.doubleSided){
                        product.customLabel.value += "+Blank"
                    }
                    //data.impositionProfile.name = "TensionStands";
                    if((product.width*(scale.width/100)) > usableArea.width){
                        product.rotation = "Orthogonal";
                        product.allowedRotations = 0;
                    }
                }

                // Table Runner Templates
                if(product.subprocess.name == "TableRunner"){
                    product.dieDesignName = product.width + "x" + product.height + "_" + scale.modifier + "x";
                }

                // Retractable Templates, Bannerstand hardware
                if(product.subprocess.name == "Retractable" || product.subprocess.name == "TableTop" || product.subprocess.name == "MiniBannerStand"){
                    product.dieDesignName = orderArray[i].bannerstand.template.name
                }

                // Rectangle Flag Templates
                if(product.subprocess.name == "RectangleFlag"){
                    if(product.doubleSided){
                        product.artworkFile = product.contentFile.split('.pdf')[0] + "_1.pdf"
                    }
                    product.dieDesignName = "rectFlag_" + product.width + "x" + product.height + "_F";
                }

                // Angled Flag Templates
                if(product.subprocess.name == "AngledFlag"){
                    if(product.doubleSided){
                        product.artworkFile = product.contentFile.split('.pdf')[0] + "_1.pdf"
                    }
                    db.general.execute("SELECT * FROM digital_room.angled_flag WHERE width = '" + product.width + "' AND height = '" + product.height + "';");
                    if(!db.general.isRowAvailable()){
                        data.notes.push([product.itemNumber,"Removed",'No template found in lookup table.']);
                        db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                            ["project-id",data.projectID],
                            ["item-number",product.itemNumber]
                        ],[
                            ["status","Removed from Gang"],
                            ["note","Not in lookup table."]
                        ]))
                        continue;
                    }
                    db.general.fetchRow();
                    product.subprocess.template = db.general.getString(3)
                    product.dieDesignName = "angledFlag_" + product.subprocess.template + "_F";
                }

                // Specific gang adjustments ----------------------------------------------------------
                if(!submit.override.removeRestrictions.coroplast){
                    if(matInfo.prodName == "Coroplast"){
                        if(orderArray[i].qty%10 == 0){
                            product.group = 20000 + [i];
                        }
                    }
                }
                
                // For VN LFP, add 10% min overrun to files over qty 20
                if(data.facility.destination == "Van Nuys"){
                    if(product.quantity >= 20){
                        product.overrunMin = 10;
                        product.overrunMax = 20;
                    }
                }

                // Set the group number based on the height so they group together in Phoenix
                // Set the overrun higher so it fills the sheet
                if(matInfo.prodName == "RollLabel"){
                    product.group = product.quantity + "-" + product.height;
                    if(product.unwind.rotation == 90 || product.unwind.rotation == 270){
                        product.group = product.quantity + "-" + product.width;
                    }
                    product.overrunMin = 8;
                }
                
                // Various Overrides ----------------------------------------------------------
                // If the product is to utilize the 10pct scaled process in Phoenix
                if(data.scaled){
                    scale.width = scale.width/10;
                    scale.height = scale.height/10;
                    product.spacingBase = product.spacingBase/10;
                    product.spacingTop = product.spacingTop/10;
                    product.spacingBottom = product.spacingBottom/10;
                    product.spacingLeft = product.spacingLeft/10;
                    product.spacingRight = product.spacingRight/10;
                    product.bleed.top = product.bleed.top/10;
                    product.bleed.bottom = product.bleed.bottom/10;
                    product.bleed.left = product.bleed.left/10;
                    product.bleed.right = product.bleed.right/10;
                    data.notes.push([product.itemNumber,"Notes",'Scaled file, verify accuracy. (' + Math.round(scale.height) + '%)']);
                }

                // Reassign ClearStaticCling in ARL to a different rip hotfolder when it's 2nd surface.
                if(data.facility.destination == "Arlington"){
                    if(matInfo.id == 85){ // 85 == Clear Static Cling
                        if(data.secondSurface){
                            matInfo.rip.hotfolder = "CSC-MIR"
                        }
                    }
                }
                
                // Check for custom rotations assigned in the database.
                // This overrides any defaults assigned to the product or subprocess.
                db.general.execute("SELECT * FROM digital_room.rotate WHERE item_number = " + product.itemNumber + ";");
                if(db.general.isRowAvailable()){
                    db.general.fetchRow();
                    if(db.general.getString(2) != "default"){
                        product.rotation = "Custom";
                        product.allowedRotations = db.general.getString(2);
                        //data.notes.push([product.itemNumber,"Notes","Rotation pulled from database, " + db.general.getString(2) + " degrees."]);
                    }
                }
            
                // Misc variables and final logic ----------------------------------------------------------
                // Apply the scale modifier now that all of the scaling logic is done.
                scale.width = scale.width*scale.modifier;
                scale.height = scale.height*scale.modifier;
                
                // GSM option to determine which paper size to use. 250 is usually default.
                if(data.oversize){product.grade = "251"}
                if(data.mount.active){product.grade = "252"}
                if(data.scaled){product.grade = "253"}
                
                // Item based override for calling very wide material.
                if(product.width >= 115 && product.height >= 115 && !data.scaled){
                    product.grade = "254"
                }
                
                // Set the Phoenix printer (thing).
                data.thing = data.facility.destination + "/" + data.printer;
                if(data.printer != "None"){	
                    if(matInfo.type == "roll-sticker"){
                        data.thing += "-LabelMaster"
                    }	 
                    if(matInfo.type == "roll" || matInfo.type == "roll-sticker" || matInfo.type == "roll-label"){
                        if(data.scaled){
                            data.thing += " (Scaled)";
                        }else if(data.oversize){
                            // Send the base printer name
                        }else{
                            data.thing += " (" + dynamic.height.value + ")";
                        }
                    }
                }

                // For small product on the router(s), reassign the layer name.
                if(data.facility.destination == "Salt Lake City"){
                    if(matInfo.cutter.device == "router"){
                        if(matInfo.cutter.layerName != "Default"){
                            if(product.width * product.height <= 100){
                                product.cutLayerName += " Small"
                            }else if(product.width <= 6 || product.height <= 6){
                                product.cutLayerName += " Small"
                            }
                        }
                    }
                }

                // Compile the data into an array.
                var infoArray = compileCSV(product, matInfo, scale, orderArray[i], data, marksArray, dashInfo);

                // Write the compiled data into the CSV.
                if(writeHeader){
                    writeCSV(s, csvFile, infoArray, 0);
                    writeHeader = false;
                }
                    writeCSV(s, csvFile, infoArray, 1);
                    
                // If it's breakaway, write it again for the 2nd page.
                if(product.subprocess.name == "Breakaway"){
                    product.artworkFile = product.contentFile.split('.pdf')[0] + "_1.pdf";
                    marksArray.push(data.facility.destination + "/Master Labels/Custom/Breakaway/Velcro" + data.scale);
                    infoArray = compileCSV(product, matInfo, scale, orderArray[i], data, marksArray, dashInfo);
                        
                    writeCSV(s, csvFile, infoArray, 1);
                }

                // If it's tension stand, write it again for the 2nd page.
                if(product.subprocess.name == "TensionStand"){
                    if(product.doubleSided){
                        product.artworkFile = product.contentFile.split('.pdf')[0] + "_2.pdf";
                        product.customLabel.value = (i+1)+"-B";
                        infoArray = compileCSV(product, matInfo, scale, orderArray[i], data, marksArray, dashInfo);
                            
                        writeCSV(s, csvFile, infoArray, 1);

                        // Write the extra line to the database
                        db.history.execute(generateSqlStatement_Insert(s, "history.details_item", [
                            ["project-id", data.projectID],
                            ["gang-number", data.gangNumber],
                            ["order-number", product.orderNumber],
                            ["item-number", product.itemNumber],
                            ["page", "2"],
                            ["status", "Initiated"]
                        ]));	
                    }
                }

                // Rectangle Flag Templates
                if(product.subprocess.name == "RectangleFlag"){
                    if(product.doubleSided){
                        product.artworkFile = product.contentFile.split('.pdf')[0] + "_2.pdf"
                        product.dieDesignName = "rectFlag_" + product.width + "x" + product.height + "_B";
                        infoArray = compileCSV(product, matInfo, scale, orderArray[i], data, marksArray, dashInfo);
                            
                        writeCSV(s, csvFile, infoArray, 1);

                        // Write the extra line to the database
                        db.history.execute(generateSqlStatement_Insert(s, "history.details_item", [
                            ["project-id", data.projectID],
                            ["gang-number", data.gangNumber],
                            ["order-number", product.orderNumber],
                            ["item-number", product.itemNumber],
                            ["page", "2"],
                            ["status", "Initiated"]
                        ]));
                    }
                }

                // Angled Flag Templates
                if(product.subprocess.name == "AngledFlag"){
                    if(product.doubleSided){
                        product.artworkFile = product.contentFile.split('.pdf')[0] + "_2.pdf"
                        product.dieDesignName = "angledFlag_" + product.subprocess.template + "_B";
                        infoArray = compileCSV(product, matInfo, scale, orderArray[i], data, marksArray, dashInfo);
                            
                        writeCSV(s, csvFile, infoArray, 1);

                        // Write the extra line to the database
                        db.history.execute(generateSqlStatement_Insert(s, "history.details_item", [
                            ["project-id", data.projectID],
                            ["gang-number", data.gangNumber],
                            ["order-number", product.orderNumber],
                            ["item-number", product.itemNumber],
                            ["page", "2"],
                            ["status", "Initiated"]
                        ]));
                    }
                }
                
                // Create the xml to inject the file into the flow.
                if(product.transfer){
                    var injectXML = s.createNewJob();
                    var injectPath = injectXML.createPathWithName(product.contentFile.split('.pdf')[0] + ".xml", false);
                    var injectFile = new File(injectPath);
                    
                    injectXML.setUserEmail(userInfo.email);
                    
                    createDataset(s, injectXML, data, matInfo, true, product, orderArray[i], userInfo, false, now);
                    
                    writeInjectJSON(injectFile, orderArray[i], product);
                    
                    injectXML.setHierarchyPath([data.environment,userInfo.dir]);
                    injectXML.setPriority(submit.override.priority)
                    injectXML.sendTo(findConnectionByName_db(s, "Inject XML"), injectPath);
                }
                
                // Create the xml for Illustrator to reference.
                if(data.prodName == "CutVinyl" || data.prodName == "CutVinyl-Frosted"){
                    var cvXML = s.createNewJob();
                    var cvPath = cvXML.createPathWithName(product.itemNumber + ".xml", false);
                    var cvFile = new File(cvPath);
                    
                    createDataset(s, cvXML, data, matInfo, true, product, orderArray[i], userInfo, false, now);
                    
                    writeInjectXML(cvFile, product);
                    
                    cvXML.setHierarchyPath([data.environment]);
                    cvXML.setPriority(submit.override.priority)
                    cvXML.sendTo(findConnectionByName_db(s, "CV XML"), cvPath);
                }

                db.history.execute(generateSqlStatement_Update(s, "history.details_item", [
                    ["project-id", data.projectID],
                    ["item-number",product.itemNumber]
                ],[
                    ["orientation",product.orientation.status],
                    ["due-date", orderArray[i].date.due]
                ]))
                
                productArray.push([product.contentFile,product.orderNumber,product.itemNumber,orderArray[i].productNotes,orderArray[i].date.due,product.orientation.status,product.itemName,orderArray[i].shape.method,orderArray[i].corner.method,product.allowedRotations]);
                
                // Write the gang number to the database.
                db.history.execute("SELECT * FROM history.data_item_number WHERE gang_number = '" + data.gangNumber + "' AND item_number = '" + product.itemNumber + "';");
                if(!db.general.isRowAvailable()){
                    db.history.execute("INSERT INTO history.data_item_number (gang_number, item_number) VALUES ('" + data.gangNumber + "', '" + product.itemNumber + "');");
                }

                if(s.getServerName() == 'Switch-Dev'){
                    if(i>=49){
                        break;
                    }
                }
            }

            // If it's 2nd Surface in SLC then append that to the hot folder name.
            if(data.facility.destination == "Salt Lake City"){
                if(data.secondSurface){
                    matInfo.rip.hotfolder = matInfo.rip.hotfolder + "-2ndSurf";
                }
            }

            // Adjust the imposition profile based on overrides from the user.
            if(data.impositionProfile.name == "Sheet" || data.impositionProfile.name == "Roll"){
                if(submit.override.gangMethod == "Default"){
                    data.impositionProfile.name += "_" + matInfo.phoenixMethod;
                }
                if(submit.override.gangMethod == "Production Efficiency"){
                    data.impositionProfile.name += "_Standard";
                    data.impositionProfile.method = "Production Efficiency";
                }
                if(submit.override.gangMethod == "Material Usage"){
                    data.impositionProfile.name += "_Layout by Layout";
                    data.impositionProfile.method = "Material Usage";
                }
                if(submit.override.gangMethod == "Sequential"){
                    data.impositionProfile.name += "_Sequential"
                    data.impositionProfile.method = "Sequential";
                }
                if(submit.override.gangMethod == "Single Item Layout"){
                    data.impositionProfile.name += "_SingleItemLayout"
                    data.impositionProfile.method = "Single Item Layout";
                }
            }

            // Close the CSV you were writing
            csvFile.close();

            // 2nd safety check for if all files have been removed from the gang.
            if(productArray.length == 0){
                sendEmail_db(s, data, matInfo, getEmailResponse("Empty Gang", null, matInfo, data, userInfo, null), userInfo);
                job.sendToNull(job.getPath());
                db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                    ["project-id", data.projectID]
                ],[
                    ["status","Parse Failed"],
                    ["note","All files removed."]
                ]))
                return
            }

            emailDatabase_write(s, db, "parsed_data", "Parser", data, data.notes)
        
            createDataset(s, newCSV, data, matInfo, false, null, null, userInfo, true, now);
            newCSV.setHierarchyPath([data.environment,data.projectID]);
            newCSV.setUserEmail(job.getUserEmail());
            newCSV.setUserName(job.getUserName());
            newCSV.setUserFullName(job.getUserFullName());
            newCSV.setPriority(submit.override.priority);
            newCSV.sendTo(findConnectionByName_db(s, "CSV"), csvPath);
            
            createDataset(s, job, data, matInfo, false, null, null, userInfo, false, now);
            job.setHierarchyPath([data.gangNumber]);
            job.setPriority(submit.override.priority)
            job.sendTo(findConnectionByName_db(s, "MXML"), job.getPath());
            
            db.history.execute(generateSqlStatement_Update(s, "history.details_gang", [
                ["project-id", data.projectID]
            ],[
                ["process",data.prodName],
                ["subprocess",data.subprocess],
                ["facility",data.facility.destination],
                ["save-location",data.dateID],
                ["rush",data.rush],
                ["email",userInfo.email],
                ["processed-time",now.time],
                ["processed-date",now.date],
                ["due-date",data.date.due],
                ["dynamic-height-enabled",dynamic.height.enabled],
                ["height-value",dynamic.height.value],
                ["status","Parse Complete"]
            ]))
            
        }catch(e){
            s.log(3, "Critical Error!: " + e);
            job.setPrivateData("error",e);
            job.sendTo(findConnectionByName_db(s, "Critical Error"), job.getPath());
        }
    }
    parser(s, job)
}

// -------------------------------------------------------

function createDataset(s, newCSV, data, matInfo, writeProduct, product, orderArray, userInfo, writeProducts, now){
	
	var theXML = new Document();

	var handoffNode = theXML.createElement("handoff", null);
		theXML.appendChild(handoffNode);
	
	var baseNode = theXML.createElement("base", null);
		handoffNode.appendChild(baseNode);
		
        addNode_db(theXML, baseNode, "projectID", data.projectID);
		addNode_db(theXML, baseNode, "gangNumber", data.gangNumber);
		addNode_db(theXML, baseNode, "projectNotes", data.projectNotes);
		addNode_db(theXML, baseNode, "saveLocation", data.dateID);
		addNode_db(theXML, baseNode, "dateID", data.dateID.replace('-',''));
		addNode_db(theXML, baseNode, "dueDate", data.date.due);
		addNode_db(theXML, baseNode, "sku", data.sku);
		addNode_db(theXML, baseNode, "process", data.prodName);
		addNode_db(theXML, baseNode, "subprocess", data.subprocess);
		addNode_db(theXML, baseNode, "prodMatFileName", data.prodMatFileName);
		addNode_db(theXML, baseNode, "paper", data.paper);
        addNode_db(theXML, baseNode, "prismStock", data.prismStock);
		addNode_db(theXML, baseNode, "type", matInfo.type);
		addNode_db(theXML, baseNode, "rush", data.rush);
		addNode_db(theXML, baseNode, "processed-time", now.time);
		addNode_db(theXML, baseNode, "processed-date", now.date);
        addNode_db(theXML, baseNode, "approved", matInfo.approved);
	
	var settingsNode = theXML.createElement("settings", null);
		handoffNode.appendChild(settingsNode);	
	
		addNode_db(theXML, settingsNode, "things", data.thing);
		addNode_db(theXML, settingsNode, "printer", data.printer);
		addNode_db(theXML, settingsNode, "whiteink", matInfo.whiteElements);
		addNode_db(theXML, settingsNode, "doublesided", data.doubleSided);
		addNode_db(theXML, settingsNode, "secondsurf", data.secondSurface);
		addNode_db(theXML, settingsNode, "mount", data.mount.active);
		addNode_db(theXML, settingsNode, "impositionProfile", data.impositionProfile.name);
        addNode_db(theXML, settingsNode, "impositionMethod", data.impositionProfile.method);
		addNode_db(theXML, settingsNode, "scaled", data.scaled);

    var laminateNode = theXML.createElement("laminate", null);
		handoffNode.appendChild(laminateNode);

        addNode_db(theXML, laminateNode, "active", data.laminate.active ? true : false);
        addNode_db(theXML, laminateNode, "method", data.laminate.method);
        addNode_db(theXML, laminateNode, "value", data.laminate.value);

    var coatingNode = theXML.createElement("coating", null);
		handoffNode.appendChild(coatingNode);

        addNode_db(theXML, coatingNode, "active", data.coating.active ? true : false);
        addNode_db(theXML, coatingNode, "method", data.coating.method);
        addNode_db(theXML, coatingNode, "value", data.coating.value);

    var frontCoatingNode = theXML.createElement("frontCoating", null);
		handoffNode.appendChild(frontCoatingNode);

        addNode_db(theXML, frontCoatingNode, "enabled", data.frontCoating.enabled);
        addNode_db(theXML, frontCoatingNode, "label", data.frontCoating.label);
        addNode_db(theXML, frontCoatingNode, "value", data.frontCoating.value);
	
	var mountNode = theXML.createElement("mount", null);
		handoffNode.appendChild(mountNode);	
			
		addNode_db(theXML, mountNode, "material", null);
		addNode_db(theXML, mountNode, "color", null);
		addNode_db(theXML, mountNode, "thickness", null);
	
	var cutterNode = theXML.createElement("cutters", null);
		handoffNode.appendChild(cutterNode);
		
        addNode_db(theXML, cutterNode, "autocut", matInfo.cutter.enable);
		addNode_db(theXML, cutterNode, "device", matInfo.cutter.device);
		addNode_db(theXML, cutterNode, "hotfolder", matInfo.cutter.hotfolder);
		
	var ripNode = theXML.createElement("rip", null);
		handoffNode.appendChild(ripNode);
		
        addNode_db(theXML, ripNode, "autorip", matInfo.rip.enable);
		addNode_db(theXML, ripNode, "device", matInfo.rip.device);
		addNode_db(theXML, ripNode, "hotfolder", matInfo.rip.hotfolder);
	
	var miscNode = theXML.createElement("misc", null);
		handoffNode.appendChild(miscNode);
		
		addNode_db(theXML, miscNode, "environment", data.environment);
		addNode_db(theXML, miscNode, "cropGang", data.cropGang);
        addNode_db(theXML, miscNode, "rotateFront", data.rotateFront);
        addNode_db(theXML, miscNode, "rotateBack", data.rotateBack);
        addNode_db(theXML, miscNode, "rotate90", data.rotate90);
		addNode_db(theXML, miscNode, "printExport", data.phoenix.printExport);
		addNode_db(theXML, miscNode, "cutExport", data.phoenix.cutExport);
		addNode_db(theXML, miscNode, "fileSource", data.fileSource);
		addNode_db(theXML, miscNode, "facility", data.facility.destination);
        addNode_db(theXML, miscNode, "server", s.getServerName());
        addNode_db(theXML, miscNode, "organizeLayouts", matInfo.cutter.organizeLayouts);
        addNode_db(theXML, miscNode, "duplicateHoles", matInfo.duplicateHoles);
        addNode_db(theXML, miscNode, "splitDSLayouts", matInfo.splitDSLayouts);
        addNode_db(theXML, miscNode, "cutAdjustments", matInfo.cutAdjustments);
        addNode_db(theXML, miscNode, "labelmaster", data.labelmaster);
        addNode_db(theXML, miscNode, "addKeyline", matInfo.addKeyline);
        addNode_db(theXML, miscNode, "cutMethod", matInfo.cutMethod);
        addNode_db(theXML, miscNode, "targetLayoutCount", matInfo.layoutCount.target);
        addNode_db(theXML, miscNode, "maxLayoutCount", matInfo.layoutCount.max);
        addNode_db(theXML, miscNode, "mixedLam", data.mixedLam);
		
	var userNode = theXML.createElement("user", null);
		handoffNode.appendChild(userNode);
		
		addNode_db(theXML, userNode, "first", userInfo.first);
		addNode_db(theXML, userNode, "last", userInfo.last);
		addNode_db(theXML, userNode, "email", userInfo.email);
		addNode_db(theXML, userNode, "folder", userInfo.dir);
	
	if(writeProduct){
		var productNode = theXML.createElement("product", null);
			handoffNode.appendChild(productNode);
			
			addNode_db(theXML, productNode, "quantity", product.quantity);
			addNode_db(theXML, productNode, "width", product.width);
			addNode_db(theXML, productNode, "height", product.height);
			addNode_db(theXML, productNode, "contentFile", product.contentFile);
			addNode_db(theXML, productNode, "orderNumber", product.orderNumber);
			addNode_db(theXML, productNode, "itemNumber", product.itemNumber);
			addNode_db(theXML, productNode, "shipDate", orderArray.date.due);
			addNode_db(theXML, productNode, "secondSurface", orderArray.secondSurface);
			addNode_db(theXML, productNode, "isCutVinyl", data.prodName == "CutVinyl");
			addNode_db(theXML, productNode, "cvFrosted", data.prodName == "CutVinyl-Frosted");
			addNode_db(theXML, productNode, "cvColors", orderArray.cvColors);
			addNode_db(theXML, productNode, "nametag", product.nametag);
            addNode_db(theXML, productNode, "subprocess", product.subprocess.name);
            addNode_db(theXML, productNode, "cutLayerName", product.cutLayerName);
            addNode_db(theXML, productNode, "doubleSided", product.doubleSided);
	}
	
	if(writeProducts){
		var productsNode = theXML.createElement("products", null);
			handoffNode.appendChild(productsNode);
			
		for(var i=0; i<productArray.length; i++){
			var subProductsNode = theXML.createElement("product", null);
				productsNode.appendChild(subProductsNode);
				
				addNode_db(theXML, subProductsNode, "contentFile", productArray[i][0]);
				addNode_db(theXML, subProductsNode, "orderNumber", productArray[i][1]);
				addNode_db(theXML, subProductsNode, "itemNumber", productArray[i][2]);
				addNode_db(theXML, subProductsNode, "notes", productArray[i][3]);
				addNode_db(theXML, subProductsNode, "due-date", productArray[i][4]);
                addNode_db(theXML, subProductsNode, "orientation", productArray[i][5]);
                addNode_db(theXML, subProductsNode, "item-name", productArray[i][6]);
                addNode_db(theXML, subProductsNode, "shape-method", productArray[i][7]);
                addNode_db(theXML, subProductsNode, "corner-method", productArray[i][8]);
                addNode_db(theXML, subProductsNode, "rotation", productArray[i][9]);
		}
	}
	
	var theDataset = newCSV.createDataset("XML");
	var theXMLFilename = theDataset.getPath();
		theXML.save(theXMLFilename);
	
		newCSV.setDataset("Handoff Data", theDataset);
}

function compareToFile(s, expected, actual, product, scale, axis, type){
    var scales = [1,2,4,10]
    for(var k in scales){
        if(expected == round(actual*scales[k])){
            scale.check[axis][type] = scales[k]
            product.orientation[axis][type] = true
            return
        }
    }
    return false
}

// -------------------------------------------------------

function writeCSV(s, file, array, index){
	for(var n=0; n<array.length; n++){
		file.write(array[n][index]);
		if(n != array.length-1){
			file.write(";");
		}
	}
	file.writeLine("")
}

// -------------------------------------------------------

function writeInjectXML(file, product){
	file.open(File.Append);
	file.writeLine('<?xml version="1.0" encoding="UTF-8"?>');
	file.writeLine("<inject>");
		
	writeXmlLine(file, "inject", product.contentFile);
		
	file.writeLine ("</inject>");
	file.close();
}

function round(x){
    return Math.round((x) * 100) / 100;
}

// -------------------------------------------------------

function writeInjectJSON(file, orderArray, product){
	file.open(File.Append);
	file.writeLine("{");
		
	file.writeLine('"file_id" : "' +  orderArray.fileID + '",');
	file.writeLine('"filename" : "' +  product.contentFile + '"');
		
	file.writeLine ("}");
	file.close();
}

// -------------------------------------------------------

function writeXmlLine(xmlFile, xmlLabel, xmlVariable){
    xmlFile.write("<" + xmlLabel + ">");
    xmlFile.write(xmlVariable);
    xmlFile.writeLine("</" + xmlLabel + ">");
}