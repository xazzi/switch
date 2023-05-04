runParser = function(s, job){
    function parser(s, job){
        try{
            var dir = {
                support: "C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/support/",
                subprocess: new Dir("C:/Scripts/" + s.getPropertyValue("scriptSource") + "/switch/process/subprocess/")
            }
                                
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/get-itemdata.js"));
            eval(File.read(dir.support + "/get-next-shipdate.js"));
            eval(File.read(dir.support + "/get-ship-type.js"));
            eval(File.read(dir.support + "/info-material.js"));
            eval(File.read(dir.support + "/sku-generator.js"));
            eval(File.read(dir.support + "/email-responses.js"));
            eval(File.read(dir.support + "/general-functions.js"));
            eval(File.read(dir.support + "/get-subprocess.js"));
            eval(File.read(dir.support + "/get-marks.js"));
            eval(File.read(dir.support + "/get-phoenix-scripts.js"));
            eval(File.read(dir.support + "/add-to-table.js"));
            
            var dbConn = connectToDatabase_db(s.getPropertyValue("database"));
                dbQuery = new Statement(dbConn);
                
            var localTime = new Date();
            var hourOffset = s.getPropertyValue("timezone") == "AWS" ? 7 : 0;
            var hourAdjustment = localTime.getTime() - (3600000*hourOffset);
            var adjustedTime = new Date(hourAdjustment).toString();
                
            var now = {
                date: adjustedTime.split("T")[0],
                time: adjustedTime.split("T")[1],
                day: adjustedTime.split("T")[0].split("-")[1],
                month: adjustedTime.split("T")[0].split("-")[2],
                year: adjustedTime.split("T")[0].split("-")[0]
            }
                
            var submitDS
            if(s.getPropertyValue("devMode") == "No"){
                submitDS = loadDataset_db("Submit");
            }
            
            var submit = {
                nodes: s.getPropertyValue("devMode") == "No" ? submitDS.evalToNodes("//field-list/field") : [],
                rotation: "",
                merge: "",
                route: false,
                facilityName: "Default",
                facilityId: "Default",
                override: {
                    mixedFinishing: null,
                    sideMix: null,
                    rush: false,
                    priority: 0,
                    date: false,
                    redownload: false,
                    forceFullsize: false,
                    gangMethod: null
                }
            }
                
            for(var i=0; i<submit.nodes.length; i++){
                // Custom rotations input field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Custom rotations?"){
                    if(submit.nodes.getItem(i).evalToString('value') == "Yes"){
                        submit.rotation = submit.nodes.getItem(i).evalToString("field-list/field/value").split(',');
                    }
                }
                
                // Finishing separation field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Mix finishing?"){
                    submit.override.mixedFinishing = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }

                // Finishing separation field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Redownload file?"){
                    submit.override.redownload = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }

                // Finishing separation field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Gang Method"){
                    submit.override.gangMethod = submit.nodes.getItem(i).evalToString('value')
                }
                
                // Due date override
                if(submit.nodes.getItem(i).evalToString('tag') == "Mix due dates?"){
                    submit.override.date = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }

                // Undersize override
                if(submit.nodes.getItem(i).evalToString('tag') == "Force fullsize?"){
                    submit.override.forceFullsize = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }

                // Finishing separation field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Mix sides?"){
                    submit.override.sideMix = submit.nodes.getItem(i).evalToString('value') == "Yes" ? true : false
                }
                
                // Rerouting input field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Route to another facility?"){
                    if(submit.nodes.getItem(i).evalToString('value') == "Yes"){
                        submit.route = true;				
                        submit.facilityName = submit.nodes.getItem(i).evalToString("field-list/field/value");

                        dbQuery.execute("SELECT * FROM digital_room.facility WHERE facility = '" + submit.facilityName + "';");
                        dbQuery.fetchRow();
                        submit.facilityId = dbQuery.getString(3);
                    }
                }
                
                // Rush field.
                if(submit.nodes.getItem(i).evalToString('tag') == "Rush?"){
                    if(submit.nodes.getItem(i).evalToString('value') == "Yes"){
                        submit.override.priority = 100;
                        submit.override.rush = true
                    }
                }
            }
            
            var orderArray = [];
            var adjustmentArray = [];
            var matInfo = null;
            var matInfoCheck = false;
            
            var validate = {
                prodName: null
            }
            
            var doc = new Document(job.getPath());	
            var map = doc.createDefaultMap();
            
            var data = {
                projectID: doc.evalToString('//*[local-name()="Project"]/@ProjectID', map),
                projectNotes: doc.evalToString('//*[local-name()="Project"]/@Notes', map),
                environment: s.getPropertyValue("environment"),
                fileSource: s.getPropertyValue("fileSource"),
                doubleSided: null,
                secondSurface: null,
                coating: {
                    active: false,
                    method: null,
                    value: null
                },
                laminate: {
                    active: false,
                    method: null,
                    value: null
                },
                mount: {
                    active: false,
                    method: null,
                    value: null
                },
                prodName: null,
                scaled: false,
                scale: "",
                oversize: false,
                thing: null,
                printer: null,
                rip: {
                    device: null,
                    hotfolder: null
                },
                dateID: null,
                notes: [],
                tolerance: 0,
                paper: null,
                facility: {
                    original: null
                },
                date: {
                    due: null
                },
                phoenix: {
                    printExport: "Auto_SaltLakeCity",
                    cutExport: "Auto_SaltLakeCity",
                    gangLabel: []
                },
                subprocess: [],
                mixed: null,
                prodMatFileName: null,
                cropGang: null,
                rush: submit.override.rush
            }
            
            var theNewToken = getNewToken(s, data.environment);
            
            var watermarkDrive = "T://watermarked-files";
            if(data.environment == "QA"){
                watermarkDrive = "Q://watermarked-files";
            }
            
            var email = {
                rotations: [],
                errors: []
            }
                    
            // Handle any custom rotation from the user.
            for(var i=0; i<submit.rotation.length; i++){
                if(submit.rotation[i].length == 0){
                    continue;
                }
                if(submit.rotation[i].match(/\d+:\d+/) == undefined){
                    email.errors.push(submit.rotation[i] + ": Does not match required format, rejecting adjustment. (itemnumber:rotation)");
                    continue;
                }
                if(submit.rotation[i].split(':')[0].length != 8){
                    email.errors.push(submit.rotation[i].split(':')[0] + ": Does not match standard item number format, rejecting adjustment. (8 digit item number)");
                    continue;
                }
                if(submit.rotation[i].split(':')[1] != (0||90||180||270||"default")){
                    email.errors.push(submit.rotation[i].split(':')[0] + ": " + submit.rotation[i].split(':')[1] + " degrees is not an approved rotation, rejecting adjustment. (0, 90, 180, 270, and default)");
                    continue;
                }
                
                var temp = {
                    item: submit.rotation[i].split(':')[0],
                    rotation: submit.rotation[i].split(':')[1]
                }
                
                dbQuery.execute("SELECT * FROM digital_room.rotate WHERE item_number = '" + temp.item + "';");
                if(dbQuery.isRowAvailable()){
                    if(temp.rotation == "default"){
                        email.rotations.push(temp.item + ": Updating database to the default rotation.");
                    }else{
                        email.rotations.push(temp.item + ": Updating database to " + temp.rotation + " degrees.");
                    }
                    dbQuery.execute("UPDATE digital_room.rotate SET rotation = '" + temp.rotation + "' WHERE item_number = '" + temp.item + "';")
                }else{
                    email.rotations.push(temp.item + ": Adding to rotation database at " + temp.rotation + " degrees.");
                    dbQuery.execute("INSERT INTO digital_room.rotate (item_number, rotation) VALUES ('" + temp.item + "','" + temp.rotation + "');");
                }
            }
            
            if(s.getPropertyValue("devMode") == "Yes"){
                job.setUserName("Administrator");
                job.setUserFullName("Bret Combe");
                job.setUserEmail("bret.c@digitalroominc.com");
            }
                
            // Pull the user information.
            dbQuery.execute("SELECT * FROM digital_room.users WHERE email = '" + job.getUserEmail() + "';");
            if(!dbQuery.isRowAvailable()){
                sendEmail_db(s, data, null, getEmailResponse("Undefined User", null, null, data, job.getUserEmail(), null), null);
                return;
            }
                dbQuery.fetchRow();
                
            var userInfo = {
                first: dbQuery.getString(1),
                last:	dbQuery.getString(2),
                email: dbQuery.getString(3),
                dir: dbQuery.getString(4) == null ? "Unknown User" : dbQuery.getString(1) + " " + dbQuery.getString(2) + " - " + dbQuery.getString(4)
            }
                
            // Loop through the items, pull the data from the API, then post it to the array.
            var productList = doc.evalToNodes('//*[local-name()="Product"]', map);
            for(var i=0; i<productList.length; i++){
                
                var node = productList.getItem(i);
                
                // Pull the item information from the API.
                var orderSpecs = pullApiInformation(s, node.getAttributeValue('ID'), theNewToken, data.environment, dbConn, data, userInfo);
                if(!orderSpecs.complete){
                    s.log(3, node.getAttributeValue('ID') + " on " + data.projectID + " :: API pull failed, job rejected.");
                    sendEmail_db(s, data, null, getEmailResponse("API GET Failed", null, null, data, userInfo, null), userInfo);
                    job.sendToNull(job.getPath());
                    return;
                }
                if(!orderSpecs.paper.active){
                    //s.log(3, data.projectID + " :: Paper mapping doesn't exist, job rejected.");
                    //sendEmail_db(s, data, matInfo, getEmailResponse("Unmapped Paper", null, orderSpecs, data, userInfo, null), userInfo);
                    job.sendToNull(job.getPath());
                    return;
                }
                            
                // Check if facility information exists
                if(orderSpecs.facility == undefined || orderSpecs.facilityId == undefined){
                    s.log(3, orderSpecs.jobItemId + ": No facility assigned, removed from gang " + data.projectID + ".");
                    data.notes.push(orderSpecs.jobItemId + ": No facility assigned, removed from gang.");
                    sendEmail_db(s, data, null, getEmailResponse("No Facility Assigned", null, orderSpecs, data, userInfo, null), userInfo);
                    continue;
                }
                
                // Set facility information
                if(data.facility.original == null){
                    data.facility.original = orderSpecs.facility;
                    data.facility.destination = submit.route ? submit.facilityName : orderSpecs.facility;
                }
                
                // Override the facilityId with the manual route, if true.
                if(submit.route){
                    orderSpecs.facilityId = submit.facilityId;
                }

                // Material overrides
                // -----------------------------------------------------------------------------------------
                // Check for DS 13oz-Matte remapping to 13oz-Smooth
                if(orderSpecs.doubleSided && orderSpecs.paper.map.wix == 48 && orderSpecs.item.subprocess != "3,4" && orderSpecs.item.subprocess != "4" && orderSpecs.item.value != "X-Stand Banners"){
                    matInfoCheck = true;
                    orderSpecs.paper.map.wix = 51;
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
                    matInfo = getMatInfo(orderSpecs, dbConn);
                    if(matInfo == "Material Data Missing"){
                        s.log(3, data.projectID + " :: Material entry doesn't exist, job rejected.");
                        sendEmail_db(s, data, matInfo, getEmailResponse("Undefined Material v1", null, orderSpecs, data, userInfo, null), userInfo);
                        job.sendTo(findConnectionByName_db(s, "Undefined"), job.getPath());
                        return;
                    }
                    if(matInfo == "Paper Data Missing"){
                        s.log(3, data.projectID + " :: Paper mapping doesn't exist, job rejected.");
                        sendEmail_db(s, data, matInfo, getEmailResponse("Unmapped Paper", null, orderSpecs, data, userInfo, null), userInfo);
                        job.sendToNull(job.getPath());
                        return;
                    }
                }

                // Enable the force laminate override
                if(matInfo.forceLam){
                    orderSpecs.laminate.active = true
                }

                if(data.facility.destination == "Arlington"){
                    if(matInfo.prodName == "13oz-Matte"){
                        if(orderSpecs.width > 59 && orderSpecs.height > 59){
                            matInfo.width = 126;
                            matInfo.printer.name = "3200";
                            matInfo.phoenixStock = "Roll_126";
                        }
                    }
                }
                
                // Set the processes and subprocesses values and check if following items match it.
                if(data.prodName == null){
                    data.prodName = matInfo.prodName;
                    data.prodMatFileName = matInfo.prodMatFileName != null ? matInfo.prodMatFileName : matInfo.prodName;
                    
                    data.paper = orderSpecs.paper.value;
                    data.date.due = orderSpecs.date.due;
                    
                    data.doubleSided = orderSpecs.doubleSided;
                    data.secondSurface = orderSpecs.secondSurface;
                    data.coating.active = orderSpecs.coating.active;
                    data.laminate.active = orderSpecs.laminate.active;
                    data.mount.active = orderSpecs.mount.active;
                    
                    data.rip.device = matInfo.rip.device;
                    data.rip.hotfolder = data.secondSurface ? matInfo.rip.hotfolder + "-2ndSurf" : matInfo.rip.hotfolder;
                    
                    data.impositionProfile = matInfo.impositionProfile;
                    data.cropGang = matInfo.cropGang;
                    data.finishingType = orderSpecs.finishingType;

                    data.printer = matInfo.printer.name;
                    data.phoenixStock = matInfo.phoenixStock;
                    
                    // Data overrides and array pushes.
                    if(data.coating.active || data.laminate.active){
                        data.phoenix.gangLabel.push("Lam");
                    }
                    if(data.mount.active){
                        data.phoenix.gangLabel.push("Mount");
                    }
                    if(data.facility.destination == "Brighton" || data.facility.destination == "Louisville" || data.facility.destination == "Wixom" || data.facility.destination == "Arlington"){
                        if(matInfo.prodName != "13ozBanner"){
                            data.phoenix.cutExport = "Auto_Brighton";
                        }
                    }
                    if(data.facility.destination == "Solon"){
                        data.phoenix.cutExport = "Auto_Solon";
                    }
                }

                if(data.printer != matInfo.printer.name){
                    data.notes.push(orderSpecs.jobItemId + ": Different printer " + matInfo.printer.name + ", removed from gang.");
                    continue;
                }

                if(!orderSpecs.ship.exists){
                    data.notes.push(orderSpecs.jobItemId + ": Shipping data is missing, removed from gang.");
                    continue;
                }
                
                // Deviation checks to make sure all of the items in the gang are able to go together.
                if(data.prodName != matInfo.prodName){
                    data.notes.push(orderSpecs.jobItemId + ": Different process (" + matInfo.prodName + "), removed from gang.");
                    continue;
                }
                
                // Check for paper deviation
                if(data.paper != orderSpecs.paper.value){
                    data.notes.push(orderSpecs.jobItemId + ": Different IMS material (" + orderSpecs.paper.value + "), removed from gang. Please notify Chelsea McVay.");
                    continue;
                }
                
                // If finishing type is different, remove them from the gang.
                if(data.facility.destination != "Arlington"){
                    if(!submit.override.mixedFinishing){
                        if(data.finishingType != orderSpecs.finishingType){
                            data.notes.push(orderSpecs.jobItemId + ": Different finishing type (" + orderSpecs.finishingType + "), removed from gang.");
                            continue;
                        }
                    }
                }
                
                // Check if surface deviation
                if(data.prodName != "CutVinyl" && data.prodName != "CutVinyl-Frosted"){
                    if(data.secondSurface != orderSpecs.secondSurface){
                        var type = orderSpecs.secondSurface ? "(2nd Surface)" : "(1st Surface)"
                        data.notes.push(orderSpecs.jobItemId + ": Different process " + type + ", removed from gang.");
                        continue;
                    }
                }
                
                // Check if coating deviation
                if(data.coating.active != orderSpecs.coating.active){
                    var type = orderSpecs.coating.active ? "(Coated)" : "(Uncoated)"
                    data.notes.push(orderSpecs.jobItemId + ": Different process " + type + ", removed from gang.");
                    continue;
                }
                
                // Check if laminate deviation
                if(data.laminate.active != orderSpecs.laminate.active){
                    var type = orderSpecs.laminate.active ? "(laminate)" : "(Unlaminated)"
                    data.notes.push(orderSpecs.jobItemId + ": Different process " + type + ", removed from gang.");
                    continue;
                }
                
                // Check if mount deviation
                if(data.mount.active != orderSpecs.mount.active){
                    var type = orderSpecs.mount.active ? "(Mounted)" : "(Not Mounted)"
                    data.notes.push(orderSpecs.jobItemId + ": Different process " + type + ", removed from gang.");
                    continue;
                }
                
                // Adjust the due date.
                // Commenting out this code for now, going to remove the ability for multiple due dates to be gangable.
                //if(orderSpecs.date.due < data.date.due){
                //	data.date.due = orderSpecs.date.due;
                //}
                
                // Separate out the due dates so they can't gang together.
                if(!submit.override.date){
                    if(orderSpecs.date.due != data.date.due){
                        data.notes.push(orderSpecs.jobItemId + ": Different due date (" + orderSpecs.date.due + "), removed from gang.");
                        continue;
                    }
                }
                
                // After all of the deviation checks have been done, set some settings for the gang.
                // These are intended to overwrite previous settings if necessary, and therefor out of the initial data compiling above.
                // --------------------------------------------------------------------------------------------------------------------------------
                
                // Check if it should enable long rolls (251gsm)
                if(matInfo.type == "roll" && !data.scaled){
                    if((orderSpecs.width > matInfo.width && orderSpecs.width > matInfo.height) || 
                        (orderSpecs.height > matInfo.width && orderSpecs.height > matInfo.height)){ 
                        data.scaled = false;
                        data.oversize = true;
                    }
                }
                
                // Enable the 10th Scale logic in Phoenix
                if(orderSpecs.width >= 380 || orderSpecs.height >= 380){
                    data.scaled = true;
                    data.oversize = false;
                    data.scale = "-10pct";
                }
                
                orderSpecs.productNotes = node.getAttributeValue('Notes');
                
                orderSpecs.filePath = node.getAttributeValue('ContentFile').toString();
                orderSpecs.filePath = orderSpecs.filePath.replace(/\//g,'\\');
                orderSpecs.filePath = orderSpecs.filePath.split('\\');
                
                // Once compiled, push to working array.
                orderArray.push(orderSpecs);
            }

            if(orderArray.length == 0){
                // Send the gang summary email.
                data.notes.push("All files removed from gang!");
                sendEmail_db(s, data, matInfo, getEmailResponse("Gang Notes", null, matInfo, data, userInfo, email), userInfo);
                return
            }

            if(data.impositionProfile == "Sheet"){
                data.impositionProfile += "_" + submit.override.gangMethod
            }
            
            data.dateID = data.date.due.split("T")[0].split("-")[1] + "-" + data.date.due.split("T")[0].split("-")[2];
            data.sku = skuGenerator(3, "numeric", data, dbConn);
                
            // Create the CSV and the new Job() for the project.
            var newCSV = s.createNewJob();
            var csvPath = newCSV.createPathWithName(data.projectID + ".csv", false);
            var csvFile = new File(csvPath);
                csvFile.open(File.Append);
                
            var writeHeader = true;
                
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
                    width: Number(orderArray[i].width),
                    height: Number(orderArray[i].height),
                    doubleSided: orderArray[i].doubleSided,
                    secondSurface: orderArray[i].secondSurface,
                    coating: orderArray[i].coating.active ? true : orderArray[i].laminate.active ? true : false,
                    rotation: matInfo.rotation,
                    allowedRotations: matInfo.allowedRotations,
                    stock: data.phoenixStock,
                    spacingBase: matInfo.spacing.base,
                    spacingTop: matInfo.spacing.top == undefined ? matInfo.spacing.base : matInfo.spacing.top,
                    spacingBottom: matInfo.spacing.bottom == undefined ? matInfo.spacing.base : matInfo.spacing.bottom,
                    spacingLeft: matInfo.spacing.left == undefined ? matInfo.spacing.base : matInfo.spacing.left,
                    spacingRight: matInfo.spacing.right == undefined ? matInfo.spacing.base : matInfo.spacing.right,
                    offcut:{
                        top: "None",
                        bottom: "None",
                        left: "None",
                        right: "None"
                    },
                    bleed: matInfo.bleed,
                    grade: matInfo.grade,
                    shapeSearch: "Largest",
                    dieDesignSource: "ArtworkPaths",
                    dieDesignName: null,
                    overruns: matInfo.overrun,
                    notes: [],
                    transfer: false,
                    pageHandling: matInfo.pageHandling,
                    groupNumber: 10000,
                    customLabel: {
                        apply: false,
                        value: ""
                    },
                    scripts: {
                        enabled: false,
                        name: null,
                        offset: null
                    },
                    subprocess: {
                        name: null,
                        exists: false,
                        mixed: false,
                        undersize: false
                    },
                    nametag: "",
                    hemValue: typeof(orderArray[i]["hem"]) == "undefined" ? null : orderArray[i].hem.value,
                    query: null,
                    late: now.date >= orderArray[i].date.due,
                    reprint: orderArray[i].reprint,
                    finishingType: orderArray[i].pocket.method,
                    orientation: "Standard",
                    shipType: getShipType(orderArray[i].ship.serviceCode)
                }
                
                var scale = {
                    width: 100,
                    height: 100,
                    widthModifier: 1,
                    heightModifier: 1,
                    adjusted: false,
                    locked: false
                }
                
                // Check if it should use buttCut processing
                if(matInfo.prodName == "Coroplast"){
                    if(data.facility.destination == "Salt Lake City"){
                        if(orderArray[i].shape.method == "Rect"){
                            // Turn buttcut off if required.
                            dbQuery.execute("SELECT * FROM digital_room.buttcut_disable WHERE item_number = '" + orderArray[i].jobItemId + "';");
                            if(dbQuery.isRowAvailable()){
                                data.notes.push(orderArray[i].jobItemId + ": Butt cut disabled per database entry.");

                            // Otherwise check the scenarios...
                            }else{
                                // Scenario 1 to activate butt-cut
                                if(orderArray[i].qty >= 20){
                                    if(orderArray[i].width <= 24 || orderArray[i].height <= 48){
                                        product.query = "butt-cut";
                                    }
                                }
                                // Scenario 2 to activate butt-cut
                                if(orderArray[i].qty >= 2){
                                    if(orderArray[i].width == 48 && orderArray[i].height == 48){
                                        product.query = "butt-cut";
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Check for butt-weld processing
                if(orderArray[i].hem.method == "Weld" || orderArray[i].hem.method == "Sewn"){
                    if(!orderArray[i].doubleSided){
                        product.query = "butt-weld";
                    }
                }
                
                // Full-Sheet subprocessing
                if((product.width == 48 && product.height == 96) || (product.height == 48 && product.width == 96)){
                    if(matInfo.width == 48 && matInfo.height == 96){
                        product.query = "full-sheet";
                    }
                }
                
                // If there is a subprocess associated to the item, pull the data and reassign the parameters.
                product.subprocess = getSubprocess(dir.subprocess, dbConn, orderArray[i], matInfo, product, data, scale, product.query);

                // If it's DS 13ozBanner for SLC, skip it and send an email.
                if(data.facility.destination == "Salt Lake City"){
                    if(orderArray[i].doubleSided && matInfo.prodName == "13ozBanner"){
                        if(product.subprocess.name != "Retractable"){
                            s.log(3, orderArray[i].jobItemId + ": DS 13oz banner assigned to SLC, removed from gang " + data.projectID + ".");
                            data.notes.push(orderArray[i].jobItemId + ": DS 13oz banner assigned to SLC, removed from gang.");
                            sendEmail_db(s, data, matInfo, getEmailResponse("DS 13ozBanner", orderArray[i], matInfo, data, userInfo, null), userInfo);
                            continue;
                        }
                    }
                }

                // Long banners with weld in ARL need to go somewhere else.
                if(data.facility.destination == "Arlington"){
                    if(matInfo.prodName == "13oz-Matte"){
                        if(orderArray[i].hem.method == "Weld"){
                            if(orderArray[i].width >= 168 || orderArray[i].height >= 168){
                                data.notes.push(orderArray[i].jobItemId + ": Welded banner over 168\" assigned to ARL, removed from gang.");
                                sendEmail_db(s, data, matInfo, getEmailResponse("Oversized Weld", orderArray[i], matInfo, data, userInfo, null), userInfo);
                                continue;
                            }
                        }
                    }
                }

                // Add the subprocess to the data level array if it's missing.
                if(data.subprocess.length == 0){
                    data.subprocess.push(product.subprocess.name);
                    data.mixed = product.subprocess.mixed;
                }
                
                // If the subprocess can't be mixed with the parent subprocess, continue on.
                if(!contains(data.subprocess, product.subprocess.name)){
                    if(!data.mixed || !product.subprocess.mixed){
                        data.notes.push(orderArray[i].jobItemId + ": Different process (" + product.subprocess.name + "), removed from gang.");
                        continue
                    }
                    data.subprocess.push(product.subprocess.name);
                }
                
                // Check for side deviation.
                if(data.doubleSided != product.doubleSided){
                    if(matInfo.sideMix || submit.override.sideMix){
                        data.doubleSided = true;
                    }else{
                        var type = product.doubleSided ? "(Double Sided)" : "(Single Sided)"
                        data.notes.push(orderArray[i].jobItemId + ": Different process " + type + ", removed from gang.");
                        continue;
                    }
                }
                
                // If the order is a reprint, send an email to the user.
                if(product.reprint){
                    if(s.getPropertyValue("email_reprint") == "Send"){
                        sendEmail_db(s, data, matInfo, getEmailResponse("Reprint", orderArray[i], matInfo, data, userInfo, null), userInfo);
                    }
                    data.notes.push(orderArray[i].jobItemId + ": Reprint! Please check IMS and approval report for reason and accuracy.");
                }
                
                // If the order is a late.
                if(product.late){
                    data.notes.push(orderArray[i].jobItemId + ": Late! This item is late and is being labeled accordingly for production.");
                }
                
                // If the order is a replacement, send an email to the user.
                if(orderArray[i].replacement){
                    sendEmail_db(s, data, matInfo, getEmailResponse("Replacement", orderArray[i], matInfo, data, userInfo, null), userInfo);
                    data.notes.push(orderArray[i].jobItemId + ": Replacement. Automated undersizing has been disabled.");
                    product.subprocess.undersize = false;
                }
                
                var usableArea = {
                    width: matInfo.width - matInfo.printer.margin.left - matInfo.printer.margin.right,
                    height: matInfo.height - matInfo.printer.margin.top - matInfo.printer.margin.bottom
                }
                
                // Gather the source file options
                var file = {
                    source: new File(watermarkDrive + "/" + product.contentFile),
                    depository: new File("//10.21.71.213/Storage/pdfDepository/" + product.contentFile),
                    data: false
                }
                    
                // Do we need to transfer the file from the depository?
                if(file.depository.exists){
                    if(submit.override.redownload){
                        product.transfer = true;
                    }
                }else{
                    if(file.source.exists){
                        product.transfer = true;
                    }else{
                        // this logic is flawed because with AWS we aren't transferring the file from the watermarked destination anymore. but this does let us check if a file exists.
                        data.notes.push(product.itemNumber + ": File missing: " + product.contentFile);
                        continue;
                    }
                }

                // Check if the sizes need to be flipped to standard WxH format.
                if(product.subprocess.name != "A-Frame" && data.prodName != "CutVinyl" && data.prodName != "CutVinyl-Frosted"){
                    try{
                        // Read stats from the file...
                        file.stats = new FileStatistics(watermarkDrive + "/" + product.contentFile);
                        file.width = file.stats.getNumber("TrimBoxDefinedWidth")/72;
                        file.height = file.stats.getNumber("TrimBoxDefinedHeight")/72;
                        file.pages = file.stats.getNumber("NumberOfPages");
                        
                        if(file.pages == 1 && product.doubleSided){
                            data.notes.push(product.itemNumber + ": File missing 2nd page for DS printing.");
                            continue;
                        }
                        
                        var variance = {
                            square: product.width - product.height,
                            standard: Math.abs(file.width-product.width) + Math.abs(file.height-product.height),
                            flipped: Math.abs(file.width-product.height) + Math.abs(file.height-product.width)
                        }

                        if(variance.square == 0){
                            product.orientation = "Square";
                        }else{
                            if(product.finishingType == "TB" || product.finishingType == "T" || product.finishingType == "B"){
                                product.orientation = variance.standard >= variance.flipped ? "Flipped" : "Standard";
                            }else{
                                product.orientation = variance.standard > variance.flipped ? "Flipped" : "Standard"
                            }
                        }

                        if(product.orientation == "Flipped"){
                            data.notes.push(product.itemNumber + ": Flipped sizes to standard format.");
                            var temp = {
                                width: product.width,
                                height: product.height
                            }
                            product.width = temp.height;
                            product.height = temp.width;
                        }

                        file.data = true;

                    }catch(e){
                        data.notes.push(product.itemNumber + ": File statistics do not exist, can't confirm orientation, please verify in gang.");
                    }
                }
                
                if(product.subprocess.name == "Breakaway"){
                    // Read stats from the file...
                    file.stats = new FileStatistics(watermarkDrive + "/" + product.contentFile);
                    file.pages = file.stats.getNumber("NumberOfPages");
                    if(file.pages != 2){
                        data.notes.push(product.itemNumber + ": This breakaway banner isn't split into 2, removed from gang.");
                        continue;
                    }
                    product.artworkFile = product.contentFile.split('.pdf')[0] + "_2.pdf"
                }
                
                // Check if the item_number can be undersized.
                dbQuery.execute("SELECT * FROM digital_room.item_number_fullsize WHERE item_number = '" + product.itemNumber + "';");
                if(dbQuery.isRowAvailable()){
                    product.subprocess.undersize = false;
                }                
                
                // Check the yard frame table for any hardware that would require full size product.
                if(orderArray[i].yardframe.active){
                    if(!orderArray[i].yardframe.undersize){
                        product.subprocess.undersize = false
                    }
                }

                // Disable undersizing for a size that is assumed to be riders.
                if(product.width == 24 && product.height == 6){
                    product.subprocess.undersize = false;
                }

                // If the file data exists then determine the scale of the file by using smart scale.
                if(file.data){
                    scale.widthModifier = Math.round(product.width/file.width);
                    scale.heightModifier = Math.round(product.height/file.height);

                // Otherwise determine the scale of the file by using the logic Prepress should be following as well.
                }else{
                    if(matInfo.type == "roll"){
                        if(data.facility.destination == "Salt Lake City" || data.facility.destination == "Brighton" || data.facility.destination == "Wixom"){
                            if(product.width >= 198 || product.height >= 198){
                                scale.widthModifier = 2;
                                scale.heightModifier = 2;
                            }
                            if(product.width >= 398 || product.height >= 398){
                                scale.widthModifier = 4;
                                scale.heightModifier = 4;
                            }
                            if(product.width >= 797 || product.height >= 797){
                                scale.widthModifier = 10;
                                scale.heightModifier = 10;
                            }
                        }
                        if(data.facility.destination == "Van Nuys" || data.facility.destination == "Arlington"){
                            if(product.width >= 144 || product.height >= 144){
                                scale.widthModifier = 2;
                                scale.heightModifier = 2;
                            }
                            if(product.width >= 287 || product.height >= 287){
                                scale.widthModifier = 4;
                                scale.heightModifier = 4;
                            }
                            if(product.width >= 573 || product.height >= 573){
                                scale.widthModifier = 10;
                                scale.heightModifier = 10;
                            }
                        }
                    }
                }
                
                // Size adjustments ----------------------------------------------------------
                // General automated scaling for when approaching material dims.
                // Not for undersizing to force better yield.
                if(!scale.locked){
                    if(!submit.override.forceFullsize){
                        if(!data.oversize && !data.scaled){
                            if(product.width > product.height){
                                if(product.width >= usableArea.height){
                                    scale.width = ((usableArea.height-.25)/product.width)*100;
                                    scale.adjusted = true;
                                    if(product.width == product.height){
                                        scale.height = scale.width
                                    }
                                }
                                if(product.height >= usableArea.width){
                                    scale.height = ((usableArea.width-.25)/product.height)*100;
                                    scale.adjusted = true;
                                    if(product.width == product.height){
                                        scale.width = scale.height
                                    }
                                }
                            }else{
                                if(product.height >= usableArea.height){
                                    scale.height = ((usableArea.height-.25)/product.height)*100;
                                    scale.adjusted = true;
                                    if(product.width == product.height){
                                        scale.width = scale.height
                                    }
                                }
                                if(product.width >= usableArea.width){
                                    scale.width = ((usableArea.width-.25)/product.width)*100;
                                    scale.adjusted = true;
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
                if(product.subprocess.undersize && matInfo.forceUndersize == true && !submit.override.forceFullsize){
                        dbQuery.execute("SELECT * FROM digital_room.undersize WHERE type = 'width' and base = " + product.width + ";");
                    if(dbQuery.isRowAvailable()){
                        dbQuery.fetchRow();
                        scale.width = dbQuery.getString(3)/dbQuery.getString(2)*100;
                        scale.adjusted = true;
                    }
                    
                        dbQuery.execute("SELECT * FROM digital_room.undersize WHERE type = 'height' and base = " + product.height + ";");
                    if(dbQuery.isRowAvailable()){
                        dbQuery.fetchRow();
                        scale.height = dbQuery.getString(3)/dbQuery.getString(2)*100;
                        scale.adjusted = true;
                    }
                }
                
                // Retractable undersizing so it fits in the stand easier.
                if(product.subprocess.name == "Retractable" || product.subprocess.name == "UV-Greyback"){
                    if(!submit.override.forceFullsize){
                        if(product.width == 24){
                            scale.width = 23.5/product.width*100;
                            data.notes.push(product.itemNumber + ': Retractable width was adjusted for production. (' + Math.round(scale.width) + '%)');
                        }
                        if(product.width == 33){
                            scale.width = 33.25/product.width*100;
                            data.notes.push(product.itemNumber + ': Retractable width was adjusted for production. (' + Math.round(scale.width) + '%)');
                        }
                    }
                }
                
                // Backdrop undersizing for shipping purposes
                if(product.subprocess.name == "Backdrop"){
                    if(product.subprocess.undersize && !submit.override.forceFullsize){
                        if(file.width == product.width){
                            // Width == 96
                            if(product.width == "96"){
                                scale.width = 94/product.width*100;
                                data.notes.push(product.itemNumber + ': Backdrop width was undersized for shipping. (' + Math.round(scale.width) + '%)');
                            }
                            // Height == 96
                            if(product.width != product.height){
                                if(product.height == "96"){
                                    scale.height = 94/product.height*100;
                                    data.notes.push(product.itemNumber + ': Backdrop height was undersized for shipping. (' + Math.round(scale.height) + '%)');
                                }
                            }
                        }
                    }
                }
                
                // Send an email if the undersizing will be too extreme.
                if((product.width-(product.width*(scale.width/100)) > 1) ||
                (product.height-(product.height*(scale.height/100)) > 1)){
                    data.notes.push(product.itemNumber + ': Undersizing was greater than 1", please confirm accuracy in Phoenix report.');
                }
                
                // Rotation adjustments ----------------------------------------------------------
                // Coroplast rotation
                if(data.prodName == "Coroplast"){
                    if(Math.round((product.width*(scale.width/100))*100)/100 > usableArea.width){
                        product.rotation = "Custom";
                        product.allowedRotations = 90;
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
                        if(orderArray[i].pocket.active){
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
                    if(typeof(orderArray[i]["cut"]) != "undefined"){
                        if(orderArray[i].cut.method == "Reverse"){
                            product.nametag = "_Reverse";
                        }
                    }
                }
                
                if(orderArray[i].width <= 12 || orderArray[i].height <= 12){
                    orderArray[i].disable.label.hem = true;
                }
                
                // Set the marks from the json file ----------------------------------------------------------
                marksArray = [];
                setMarks(s, dir.support, matInfo, data, orderArray[i], product, marksArray);	
                setPhoenixScripts(s, dir.support, matInfo, data, orderArray[i], product);
                    
                // If the product requires a custom label, apply it.
                if(product.customLabel.apply){
                    product.customLabel.value = product.width + '" x ' + product.height + '" ' + product.itemName
                }

                // Tension Stands
                if(product.subprocess.name == "TensionStand"){
                    product.artworkFile = product.contentFile.split('.pdf')[0] + "_1.pdf"
                    //product.dieDesignSource = "DieDesignLibrary";
                    product.dieDesignName = product.width + "x" + product.height;
                    //product.subprocess.name = "Tension Stand";
                    product.customLabel.value = (i+1)+"-F";
                    data.impositionProfile = "TensionStands";
                    marksArray.push(data.facility.destination + "/Misc/TensionStand-Label");
                    if((product.width*(scale.width/100)) > usableArea.width){
                        product.rotation = "Orthogonal";
                        product.allowedRotations = 0;
                    }
                }
                
                // Specific gang adjustments ----------------------------------------------------------
                if(matInfo.prodName == "Coroplast"){
                    if(orderArray[i].qty%10 == 0){
                        product.groupNumber = 20000 + [i];
                    }else if(orderArray[i].qty >= 10){
                        //product.groupNumber = 30000;
                    }
                }
                
                // Various Overrides ----------------------------------------------------------
                // If the product is to utilize the 10pct scaled process in Phoenix
                if(data.scaled){
                    scale.width = scale.width/10;
                    scale.height = scale.height/10;
                    product.spacingBase = matInfo.spacing.base/10;
                    product.spacingTop = matInfo.spacing.top/10;
                    product.spacingBottom = matInfo.spacing.bottom/10;
                    product.spacingLeft = matInfo.spacing.left/10;
                    product.spacingRight = matInfo.spacing.right/10;
                    product.bleed = matInfo.bleed/10;
                    data.notes.push(product.itemNumber + ': Scaled file, please verify accuracy in report. (' + Math.round(scale.height) + '%)');
                }
                
                // Check for custom rotations assigned in the database.
                // This overrides any defaults assigned to the product or subprocess.
                dbQuery.execute("SELECT * FROM digital_room.rotate WHERE item_number = " + product.itemNumber + ";");
                if(dbQuery.isRowAvailable()){
                    dbQuery.fetchRow();
                    if(dbQuery.getString(2) != "default"){
                        product.rotation = "Custom";
                        product.allowedRotations = dbQuery.getString(2);
                        email.rotations.push(product.itemNumber + ": Rotation pulled from database, " + dbQuery.getString(2) + " degrees.");
                    }
                }
            
                // Misc variables and final logic ----------------------------------------------------------
                // Apply the scale modifier now that all of the scaling logic is done.
                scale.width = scale.width*scale.widthModifier;
                scale.height = scale.height*scale.heightModifier;
                
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
                    if(matInfo.type == "roll"){
                        if(data.scaled){
                            data.thing += "_10pct";
                        }else if(data.oversize){
                            // Send the base printer name
                        }else{
                            data.thing += "_" + matInfo.height + "in";
                        }
                    }
                    if(product.subprocess.name == "ButtCut"){
                        data.thing += "_ButtCut";
                    }
                }

                if(product.width > usableArea.width && product.height > usableArea.width){
                    //product.stock += "_MaxWidth"
                }
                
                // Compile the data into an array.
                var infoArray = compileCSV(product, matInfo, scale, orderArray[i], data, marksArray, dashInfo);
                
                // Write the compiled data into the CSV.
                if(writeHeader){
                    writeCSV(csvFile, infoArray, 0);
                    writeHeader = false;
                }
                    writeCSV(csvFile, infoArray, 1);
                    
                // If it's breakaway, write it again for the 2nd page.
                if(product.subprocess.name == "Breakaway"){
                    product.artworkFile = product.contentFile.split('.pdf')[0] + "_1.pdf";
                    marksArray.push(data.facility.destination + "/Hem Labels/Breakaway/Velcro" + data.scale);
                    infoArray = compileCSV(product, matInfo, scale, orderArray[i], data, marksArray, dashInfo);
                        
                    writeCSV(csvFile, infoArray, 1);
                }

                // If it's breakaway, write it again for the 2nd page.
                if(product.subprocess.name == "TensionStand"){
                    if(product.doubleSided){
                        product.artworkFile = product.contentFile.split('.pdf')[0] + "_2.pdf";
                        product.customLabel.value = (i+1)+"-B";
                        infoArray = compileCSV(product, matInfo, scale, orderArray[i], data, marksArray, dashInfo);
                            
                        writeCSV(csvFile, infoArray, 1);
                    }
                }
                
                // Create the xml to inject the file into the flow.
                if(product.transfer){
                    var injectXML = s.createNewJob();
                    var injectPath = injectXML.createPathWithName(product.contentFile.split('.pdf')[0] + ".xml", false);
                    var injectFile = new File(injectPath);
                    
                    injectXML.setUserEmail(userInfo.email);
                    
                    createDataset(injectXML, data, matInfo, true, product, orderArray[i], userInfo, false, now);
                    
                    writeInjectJSON(injectFile, orderArray[i], product);
                    
                    injectXML.setHierarchyPath([userInfo.dir]);
                    injectXML.setPriority(submit.override.priority)
                    injectXML.sendTo(findConnectionByName_db(s, "Inject XML"), injectPath);
                }
                
                // Create the xml for Illustrator to reference.
                if(data.prodName == "CutVinyl" || data.prodName == "CutVinyl-Frosted"){
                    var cvXML = s.createNewJob();
                    var cvPath = cvXML.createPathWithName(product.itemNumber + ".xml", false);
                    var cvFile = new File(cvPath);
                    
                    createDataset(cvXML, data, matInfo, true, product, orderArray[i], userInfo, false, now);
                    
                    writeInjectXML(cvFile, product);
                    
                    cvXML.setHierarchyPath([data.environment]);
                    cvXML.setPriority(submit.override.priority)
                    cvXML.sendTo(findConnectionByName_db(s, "CV XML"), cvPath);
                }
                
                productArray.push([product.contentFile,product.orderNumber,product.itemNumber,orderArray[i].productNotes,orderArray[i].date.due,product.orientation,product.itemName]);
                
                // Write the gang number to the database.
                dbQuery.execute("SELECT * FROM digital_room.data_item_number WHERE gang_number = '" + data.projectID + "' AND item_number = '" + product.itemNumber + "';");
                if(!dbQuery.isRowAvailable()){
                    dbQuery.execute("INSERT INTO digital_room.data_item_number (gang_number, item_number) VALUES ('" + data.projectID + "', '" + product.itemNumber + "');");
                }
            }
            
            // Send the gang summary email.
            if(s.getPropertyValue("email_gangSummary") == "Send"){
                sendEmail_db(s, data, matInfo, getEmailResponse("Gang Notes", null, matInfo, data, userInfo, email), userInfo);
            }
            
            csvFile.close();
        
            createDataset(newCSV, data, matInfo, false, null, null, userInfo, true, now);
            //createReport(s, newCSV, data)
            newCSV.setHierarchyPath([data.environment,data.sku]);	
            newCSV.setUserEmail(job.getUserEmail());
            newCSV.setUserName(job.getUserName());
            newCSV.setUserFullName(job.getUserFullName());
            newCSV.setPriority(submit.override.priority);
            newCSV.sendTo(findConnectionByName_db(s, "CSV"), csvPath);
            
            createDataset(job, data, matInfo, false, null, null, userInfo, false, now);
            job.setHierarchyPath([data.projectID]);
            job.setPriority(submit.override.priority)
            job.sendTo(findConnectionByName_db(s, "MXML"), job.getPath());
            
            dbQuery.execute("INSERT INTO digital_room.history_gang (`gang-number`,`processed-time`,`processed-date`,`due-date`,process,subprocess,sku,facility,`save-location`,rush,email) VALUES ('" + data.projectID + "','" + now.time + "','" + now.date + "','" + data.date.due + "','" + data.prodName + "','" + data.subprocess + "','" + data.sku + "','" + data.facility.destination + "','" + data.dateID + "','" + data.rush + "','" + userInfo.email + "');");
            
        }catch(e){
            s.log(3, "Critical Error!: " + e);
            job.setPrivateData("error",e);
            job.sendTo(findConnectionByName_db(s, "Critical Error"), job.getPath());
        }
    }
    parser(s, job)
}

// -------------------------------------------------------

function compileCSV(product, matInfo, scale, orderArray, data){
	// Compile the CSV information.	
	var infoArray = [
		["Name",product.contentFile],
		["Artwork File",product.artworkFile],
		["Ordered",product.quantity],
		["Stock",product.stock],
		["Grade",product.grade + " gsm"],
		["Spacing",product.spacingBase],
		["Spacing Top",product.spacingTop],
		["Spacing Bottom",product.spacingBottom],
		["Spacing Left",product.spacingLeft],
		["Spacing Right",product.spacingRight],
		["Spacing Type",matInfo.spacing.type],
        ["Offcut Top",product.offcut.top],
        ["Offcut Bottom",product.offcut.bottom],
        ["Offcut Left",product.offcut.left],
        ["Offcut Right",product.offcut.right],
		["Bleed",product.bleed],
		["Rotation",product.rotation],
		["Allowed Rotations",product.allowedRotations],
		["Width",scale.width + "%"],
		["Height",scale.height + "%"],
        ["Scale Width",scale.width],
		["Scale Height",scale.height],
		["View Width",product.width],
		["View Height",product.height],
		["Description","Description"],
		["Shape Search",product.shapeSearch],
		["Notes","SheetLevelData"], //wtf is this?
		["Page Handling",product.pageHandling],
		["Marks",marksArray],
		["METRIX_NAME",product.orderNumber],
		["Item Number",product.itemNumber],
		["Product Notes",orderArray.productNotes], //If you add something above this you have to update the xml updater as well. (this might be outdated)
		["Bleed Type",matInfo.bleedType],
		["A-Frame Type",orderArray.frame.value],
		["Mount Info",orderArray.mount.value],
		["Base Type",orderArray.base.active ? orderArray.base.value : orderArray.display.active ? orderArray.display.value : "Unknown Hardware"],
		["Die Design Source",product.dieDesignSource],
		["Die Design Name",product.dieDesignName],
		["Max Overruns",product.overruns],
		["Ship Date",orderArray.date.due],
        ["Ship Type",product.shipType],
		["Due Date",data.date.due],
		["Gang Info", data.phoenix.gangLabel],
		["Group Number", product.groupNumber],
		["Custom Label", product.customLabel.value],
		["Hem Value", product.hemValue],
		["Finishing Type", product.finishingType],
		["Dash Offset", typeof(dashInfo["offset"]) == "undefined" ? "None" : dashInfo.offset],
		["Late", product.late],
		["Reprint", product.reprint],
        ["Enable Scripts", product.scripts.enabled],
        ["Script Name", product.scripts.name],
        ["Sewn Hem Offset", product.scripts.offset]
	];
	return infoArray
}

function createDataset(newCSV, data, matInfo, writeProduct, product, orderArray, userInfo, writeProducts, now){
	
	var theXML = new Document();

	var handoffNode = theXML.createElement("handoff", null);
		theXML.appendChild(handoffNode);
	
	var baseNode = theXML.createElement("base", null);
		handoffNode.appendChild(baseNode);
		
		addNode_db(theXML, baseNode, "projectID", data.projectID);
		addNode_db(theXML, baseNode, "projectNotes", data.projectNotes);
		addNode_db(theXML, baseNode, "saveLocation", data.dateID);
		addNode_db(theXML, baseNode, "dateID", data.dateID.replace('-',''));
		addNode_db(theXML, baseNode, "dueDate", data.date.due);
		addNode_db(theXML, baseNode, "sku", data.sku);
		addNode_db(theXML, baseNode, "process", data.prodName);
		addNode_db(theXML, baseNode, "subprocess", data.subprocess);
		addNode_db(theXML, baseNode, "prodMatFileName", data.prodMatFileName);
		addNode_db(theXML, baseNode, "paper", data.paper);
		addNode_db(theXML, baseNode, "type", matInfo.type);
		addNode_db(theXML, baseNode, "rush", data.rush);
		addNode_db(theXML, baseNode, "processed-time", now.time);
		addNode_db(theXML, baseNode, "processed-date", now.date);
	
	var settingsNode = theXML.createElement("settings", null);
		handoffNode.appendChild(settingsNode);	
	
		addNode_db(theXML, settingsNode, "things", data.thing);
		addNode_db(theXML, settingsNode, "printer", data.printer);
		addNode_db(theXML, settingsNode, "whiteink", matInfo.whiteElements);
		addNode_db(theXML, settingsNode, "doublesided", data.doubleSided);
		addNode_db(theXML, settingsNode, "secondsurf", data.secondSurface);
		addNode_db(theXML, settingsNode, "laminate", data.coating.active ? true : data.laminate.active ? true : false);
		addNode_db(theXML, settingsNode, "mount", data.mount.active);
		addNode_db(theXML, settingsNode, "impositionProfile", data.impositionProfile);
		addNode_db(theXML, settingsNode, "scaled", data.scaled);
	
	var mountNode = theXML.createElement("mount", null);
		handoffNode.appendChild(mountNode);	
			
		addNode_db(theXML, mountNode, "material", null);
		addNode_db(theXML, mountNode, "color", null);
		addNode_db(theXML, mountNode, "thickness", null);
	
	var cutterNode = theXML.createElement("cutters", null);
		handoffNode.appendChild(cutterNode);
		
		addNode_db(theXML, cutterNode, "device", matInfo.cutter.device);
		addNode_db(theXML, cutterNode, "hotfolder", matInfo.cutter.hotfolder);
		
	var ripNode = theXML.createElement("rip", null);
		handoffNode.appendChild(ripNode);
		
		addNode_db(theXML, ripNode, "device", data.rip.device);
		addNode_db(theXML, ripNode, "hotfolder", data.rip.hotfolder);		
	
	var miscNode = theXML.createElement("misc", null);
		handoffNode.appendChild(miscNode);
		
		addNode_db(theXML, miscNode, "environment", data.environment);
		addNode_db(theXML, miscNode, "cropGang", data.cropGang);
		addNode_db(theXML, miscNode, "printExport", data.phoenix.printExport);
		addNode_db(theXML, miscNode, "cutExport", data.phoenix.cutExport);
		addNode_db(theXML, miscNode, "fileSource", data.fileSource);
		addNode_db(theXML, miscNode, "facility", data.facility.destination);
		
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
		}
	}
	
	var theDataset = newCSV.createDataset("XML");
	var theXMLFilename = theDataset.getPath();
		theXML.save(theXMLFilename);
	
		newCSV.setDataset("Handoff Data", theDataset);
}

// -------------------------------------------------------

function createReport(s, newCSV, data){
	
	var theXML = new Document();		
		
	var notesNode = theXML.createElement("notes", null);
		theXML.appendChild(notesNode);
		
	for(var b in data.notes){
		addNode_db(theXML, notesNode, "item", data.notes[b]);
	}
	
	var theDataset = newCSV.createDataset("XML");
	var theXMLFilename = theDataset.getPath();
		theXML.save(theXMLFilename);
	
		newCSV.setDataset("Gang Notes", theDataset);
}

// -------------------------------------------------------

function writeCSV(file, array, index){
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