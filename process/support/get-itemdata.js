pullApiInformation = function(s, itemNumber, theNewToken, environment, db, data, userInfo) {
	return pingAPI(s, itemNumber, theNewToken, environment, db, data, userInfo);
};

function pingAPI(s, itemNumber, theNewToken, environment, db, data, userInfo) {
	var specs = initSpecs(data);

	// Build request
	var theHTTP = new HTTP(HTTP.SSL);
	theHTTP.url = environment == "QA"
		? "https://qaprism-services.digitalroominc.com/job-items?id[]=" + itemNumber
		: "https://prism-services.digitalroominc.com/job-items?id[]=" + itemNumber;

	theHTTP.authScheme = HTTP.OauthAuth;
	theHTTP.addHeader("Authorization", "Bearer " + theNewToken);
	theHTTP.timeOut = 300;
	theHTTP.get();

	while (!theHTTP.waitForFinished(3)) {
		s.log(5, "Downloading...", theHTTP.progress());
	}

	if (theHTTP.finishedStatus !== HTTP.Ok || theHTTP.statusCode !== 200) {
		s.log(3, "Download failed with status code %1", theHTTP.statusCode);
		return specs;
	}

	var response = theHTTP.getServerResponse().toString("UTF-8");
	var dataDump = JSON.parse(response).job_item;

	// Assign core specs
	specs = assignBasicSpecs(specs, dataDump);

	// Parse order_specs
	parseOrderSpecs(specs, dataDump.order_specs, s, db, data, userInfo, dataDump);

	// Parse display_specs
	parseDisplaySpecs(specs, dataDump.display_specs, dataDump, s, db, data, userInfo);

	// Pull file ID
	if (dataDump.active_file && dataDump.active_file.length > 0) {
		specs.fileID = dataDump.active_file[0].file_id;
	}

	return specs;
}

function initSpecs(data) {
    return {
        active: false,
        complete: false,
        process: null,
        accountType: null,
        accountTypeCode: null,
        itemName: null,
        item: { active: false, value: null, id: null },
        mapping:{
            substrate: {
                enabled: false,
                value: null,
                accountTypeCode: null,
                map: {
                    slc: null, bri: null, sln: null, lou: null,
                    arl: null, wix: null, vn: null, sb: null
                },
                mapId: null
            },
            cover: {
                enabled: false,
                value: null,
                accountTypeCode: null,
                map: {
                    slc: null, bri: null, sln: null, lou: null,
                    arl: null, wix: null, vn: null, sb: null
                },
                mapId: null
            }
        },
        resolved: {
            substrate: {
                base:{
                    enabled: false,
                    label: null,
                    value: null,
                    prismValue: null
                },
                combined:{
                    enabled: false,
                    label: null,
                    value: null,
                    prismValue: null
                },
                coating:{
                    value: null,
                    key: null,
                    front: { enabled: false, label: null, value: null },
                    back: { enabled: false, label: null, value: null }
                },
                laminate:{
                    value: null,
                    key: null,
                    front: { enabled: false, label: null, value: null },
                    back: { enabled: false, label: null, value: null }
                }
            },
            cover: {
                base: {
                    enabled: false,
                    label: null,
                    value: null,
                    prismValue: null
                },
                combined:{
                    enabled: false,
                    label: null,
                    value: null,
                    prismValue: null
                },
                coating:{
                    value: null,
                    key: null,
                    front: { enabled: false, label: null, value: null },
                    back: { enabled: false, label: null, value: null }
                },
                laminate:{
                    value: null,
                    key: null,
                    front: { enabled: false, label: null, value: null },
                    back: { enabled: false, label: null, value: null }
                }
            }
        },
        substrate: {
            base:{
                enabled: false,
                label: null,
                value: null,
                prismValue: null
            },
            combined:{
                enabled: false,
                label: null,
                value: null,
                prismValue: null
            },
            coating:{
                value: null,
                key: null,
                front: { enabled: false, label: null, value: null },
                back: { enabled: false, label: null, value: null }
            },
            laminate:{
                value: null,
                key: null,
                front: { enabled: false, label: null, value: null },
                back: { enabled: false, label: null, value: null }
            }
        },
        cover: {
            base:{
                enabled: false,
                label: null,
                value: null,
                prismValue: null
            },
            combined:{
                enabled: false,
                label: null,
                value: null,
                prismValue: null
            },
            coating:{
                value: null,
                key: null,
                front: { enabled: false, label: null, value: null },
                back: { enabled: false, label: null, value: null }
            },
            laminate:{
                value: null,
                key: null,
                front: { enabled: false, label: null, value: null },
                back: { enabled: false, label: null, value: null }
            }
        },
        paper:{
            base:{
                enabled: false,
                label: null,
                value: null,
                prismValue: null
            },
            combined:{
                enabled: false,
                label: null,
                value: null,
                prismValue: null
            },
            coating:{
                enabled: false,
                label: null,
                value: null,
                key: null,
                front: null,
                back: null
            },
            laminate:{
                enabled: false,
                label: null,
                value: null,
                key: null,
                front: null,
                back: null
            }
        },
        material: { enabled: false, value: null },
        materialThickness: { enabled: false, label: null, value: null },
        printFinish: { enabled: false, label: null, value: null },
        printMethod: { enabled: false, label: null, value: null },
        bindPlace: { enabled: null, label: null, value: null },
        shape: { active: false, method: null, value: null, applyProductLabel: null },
        corner: { active: false, method: null, value: null },
        diecut: { active: false, method: null, value: null, applyProductLabel: null },
        cut: { active: false, method: null, value: null },
        grommet: { active: false, key: null },
        hem: {
            value: null, enable: false, method: "None",
            side: { top: null, bottom: null, left: null, right: null },
            size: { top: null, bottom: null, left: null, right: null },
            webbing: false
        },
        pocket: {
            value: null, enable: false, method: "Inactive",
            side: { top: null, bottom: null, left: null, right: null },
            size: { top: null, bottom: null, left: null, right: null }
        },
        mount: { active: false, method: null, value: null },
        impInstructions: { active: false, value: null },
        edge: { active: false, method: null, value: null },
        unwind: { active: false, value: null, enable: false, key: null, rotation: null },
        hardware: {
            active: false,
            prism: { code: null, label: null, value: null },
            template: { id: null, active: false, name: null },
            nickname: { global: null, slc: null, wxm: null },
            displaySize: { global: null, slc: null, wxm: null },
            enabled: false, example: null, dateAdded: null
        },
        frame: {
            enabled: false, label: null, value: null,
            attributes: { color: null, type: null }
        },
        side: { active: false, method: null, value: null },
        yardframe: { active: false, method: null, value: null, undersize: null },
        base: { active: false, method: null, value: null },
        display: { active: false, method: null, value: null },
        printDir: { active: false, method: null, value: null },
        viewDir: { active: false, method: null, value: null },
        disable: { label: { hem: false } },
        box: { length: null, width: null, depth: null },
        pages: null,
        secondSurface: false,
        doubleSided: false,
        facility: null,
        notes: "",
        cvColors: [],
        finishingType: "No Hem",
        reprint: { status: false, reason: null },
        replacement: false
    };
}

function assignBasicSpecs(specs, dataDump) {
    specs.complete = true;
    specs.accountType = dataDump.account_type;
    specs.accountTypeCode = dataDump.account_type_code;
    specs.qty = dataDump.qty;
    specs.pageQty = dataDump.page_qty;
    specs.jobItemId = dataDump.job_item_id;
    specs.jobOrderId = dataDump.job_order_id;
    specs.itemName = dataDump.item_name;
    specs.width = dataDump.width;
    specs.height = dataDump.height;

    specs.size = {
        raw: dataDump.size.split('x'),
        width: null,
        height: null
    };

    if (specs.size.raw.length === 2) {
        specs.size.width = parseFloat(specs.size.raw[0].replace(/[^0-9.]/g, ''));
        specs.size.height = parseFloat(specs.size.raw[1].replace(/[^0-9.]/g, ''));
    }

    specs.facilityId = "facility_id" in dataDump ? dataDump.facility_id : undefined;
    specs.facility = "facility" in dataDump ? dataDump.facility : undefined;

    try {
        specs.ship = {
            exists: true,
            methodCode: dataDump.job_item_shipping[0].shipping_method_code,
            serviceCode: dataDump.job_item_shipping[0].shipping_service_code,
            service: dataDump.job_item_shipping[0].shipping_service
        };
    } catch (e) {
        specs.ship = { exists: false };
    }

    specs.date = {
        due: dataDump.due_date,
        gangBy: dataDump.gang_by_date
    };

    return specs;
}

function parseOrderSpecs(specs, orderSpecsArray, s, db, data, userInfo, dataDump) {
    for (var i = 0; i < orderSpecsArray.length; i++) {
        var entry = orderSpecsArray[i];
        var code = entry.code;
        var value = entry.value;

        switch (code) {

            // OrderSpec2.0 values ===================================================
            case "SUBST":
                assignSpecField(specs, "substrate.base", "orderspecs_substrate", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "CSUBST":
                assignSpecField(specs, "substrate.combined", "orderspecs_substrate_combined", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "FCOAT":
                assignSpecField(specs, "substrate.coating.front", "orderspecs_coating_front", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "BCOAT":
                assignSpecField(specs, "substrate.coating.front", "orderspecs_coating_back", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "FLAM":
                assignSpecField(specs, "substrate.laminate.front", "orderspecs_laminate_front", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "BLAM":
                assignSpecField(specs, "substrate.laminate.back", "orderspecs_laminate_back", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "COVSUBST":
                assignSpecField(specs, "cover.base", "orderspecs_substrate", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "COVCSUBST":
                assignSpecField(specs, "cover.combined", "orderspecs_substrate_combined", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "COVFCOAT":
                assignSpecField(specs, "cover.coating.front", "orderspecs_coating_front", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "COVBCOAT":
                assignSpecField(specs, "cover.coating.front", "orderspecs_coating_back", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "COVFLAM":
                assignSpecField(specs, "cover.laminate.front", "orderspecs_laminate_front", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "COVBLAM":
                assignSpecField(specs, "cover.laminate.back", "orderspecs_laminate_back", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;

            // OrderSpec1.0 values ===================================================
            case "PPR":
                assignSpecField(specs, "paper.base", "options_paper", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "COAT":
                assignSpecField(specs, "paper.coating", "options_coating", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;
            case "LAM":
                assignSpecField(specs, "paper.laminate", "options_laminate", value, code, s, db, data, userInfo, dataDump, "orderspecs", entry);
                break;

            // General values ===================================================
            case "RP_REASON":
                specs.reprint.status = true;
                specs.reprint.reason = value;
                break;
            case "GROM":
                assignSpecField(specs, "grommet", "options_grommets", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
            case "HEMMING":
                if (value !== "None") {
                    specs.finishingType = "Hem";
                    assignSpecField(specs, "hem", "options_hems", value, code, s, db, data, userInfo, dataDump, "old", entry);
                }
                break;
            case "MATRL":
                assignSpecField(specs, "material", "options_material", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
            case "MATRLTH":
                assignSpecField(specs, "materialThickness", "options_material-thickness", value, code, s, db, data, userInfo, dataDump, "new", entry);
                break;
            case "PRINTFIN":
                assignSpecField(specs, "printFinish", "options_print-finish", value, code, s, db, data, userInfo, dataDump, "new", entry);
                break;
            case "IMPRINTMET1":
                assignSpecField(specs, "printMethod", "options_print-method", value, code, s, db, data, userInfo, dataDump, "new", entry);
                break;
            case "BINDPLACE":
                assignSpecField(specs, "bindPlace", "options_bindplace", value, code, s, db, data, userInfo, dataDump, "new", entry);
                break;
            case "WIND":
                assignSpecField(specs, "unwind", "options_unwind", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
                
            case "BANNERSTAND":
            case "BASEATT":
            case "DISPOPT":
                specs.hardware = addToTable(s, db, "options_hardware", value, dataDump.job_item_id, data, userInfo, specs, entry, "old");

                if (!specs.hardware.dateAdded) {
                    db.settings.execute("UPDATE settings.`options_hardware` SET `date-added` = '" + new Date() + "' WHERE `prism-value` = '" + value + "' AND width = '" + specs.width + "' AND height = '" + specs.height + "';");
                }

                if (!specs.hardware.prism.code) {
                    db.settings.execute("UPDATE settings.`options_hardware` SET `prism-code` = '" + code + "' WHERE `prism-value` = '" + value + "' AND width = '" + specs.width + "' AND height = '" + specs.height + "';");
                }

                if (!specs.hardware.prism.label) {
                    db.settings.execute("UPDATE settings.`options_hardware` SET `prism-label` = '" + entry.label + "' WHERE `prism-value` = '" + value + "' AND width = '" + specs.width + "' AND height = '" + specs.height + "';");
                }

                db.settings.execute("SELECT * FROM settings.`hardware_templates` WHERE id = '" + specs.hardware.template.id + "';");
                if (db.settings.isRowAvailable()) {
                    db.settings.fetchRow();
                    specs.hardware.template.active = true;
                    specs.hardware.template.name = db.settings.getString(1);
                }
                break;

            case "EDGE":
                assignSpecField(specs, "edge", "options_edge", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
            case "AFRAME":
                assignSpecField(specs, "frame", "options_a-frame", value, code, s, db, data, userInfo, dataDump, "new", entry);
                break;
            case "POLPCKT":
                assignSpecField(specs, "pocket", "options_pockets", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
            case "MOUNT":
                assignSpecField(specs, "mount", "options_mount", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
            case "SIDE":
                assignSpecField(specs, "side", "options_side", value, code, s, db, data, userInfo, dataDump, "old", entry);
                if (specs.side.method == "FB" || specs.side.method == "FBsame") {
                    specs.doubleSided = true;
                }
                break;
            case "PRINTDR":
                assignSpecField(specs, "printDir", "options_print-direction", value, code, s, db, data, userInfo, dataDump, "old", entry);
                if (specs.printDir.method == "2nd") {
                    specs.secondSurface = true;
                }
                break;
            case "VIEWDIR":
                assignSpecField(specs, "viewDir", "options_view-direction", value, code, s, db, data, userInfo, dataDump, "old", entry);
                if (specs.viewDir.method == "2nd") {
                    specs.secondSurface = true;
                }
                break;
            case "IMPINST":
                specs.impInstructions.active = true;
                specs.impInstructions.value = value;
                break;
            case "SHAPE":
                assignSpecField(specs, "shape", "options_shape", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
            case "CORNER":
                assignSpecField(specs, "corner", "options_corner", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
            case "DIECUT":
                assignSpecField(specs, "diecut", "options_diecut", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
            case "VINYL_CLR":
                var temp = value.split(',');
                for (var r = 0; r < temp.length; r++) {
                    var cleaned = temp[r].replace(/^\s+/, '');
                    addToTable(s, db, "options_vinyl-color", cleaned, dataDump.job_item_id, data, userInfo, null, entry, "old");
                    specs.cvColors.push(cleaned);
                }
                break;
            case "CUTTING":
            case "CUT":
                assignSpecField(specs, "cut", "options_cut", value, code, s, db, data, userInfo, dataDump, "old", entry);
                break;
            case "DESC":
                if (value.toLowerCase().indexOf("replacement") !== -1) {
                    specs.replacement = true;
                }
                break;
            case "BXL":
                specs.box.length = value;
                break;
            case "BXW":
                specs.box.width = value;
                break;
            case "BXD":
                specs.box.depth = value;
                break;

        }
    }
}

function parseDisplaySpecs(specs, displaySpecsArray, dataDump, s, db, data, userInfo) {
    for (var i = 0; i < displaySpecsArray.length; i++) {
        var spec = displaySpecsArray[i];
        var name = spec.attribute_name;
        var value = spec.attr_value;

        switch (name) {
            case "Material":
                assignSpecField(specs, "material", "attr_material", value, name, s, db, data, userInfo, dataDump, "attr", spec);
                break;
            case "Paper Type":
                assignSpecField(specs, "paperType", "attr_paper-type", value, name, s, db, data, userInfo, dataDump, "attr", spec);
                break;
            case "Paper":
                assignSpecField(specs, "attrPaper", "attr_paper", value, name, s, db, data, userInfo, dataDump, "attr", spec);
                break;
            case "Stock":
                assignSpecField(specs, "stock", "attr_stock", value, name, s, db, data, userInfo, dataDump, "attr", spec);
                break;
            case "Paper Stock":
                assignSpecField(specs, "paperStock", "attr_paper-stock", value, name, s, db, data, userInfo, dataDump, "attr", spec);
                break;
            case "Substrate":
                assignSpecField(specs, "paperStock", "attr_substrate", value, name, s, db, data, userInfo, dataDump, "attr", spec);
                break;
        }
    }
}

function assignSpecField(specs, key, table, value, code, s, db, data, userInfo, dataDump, mode, sourceObj) {
    var result = addToTable(
        s,
        db,
        table,
        value,
        dataDump.job_item_id,
        data,
        userInfo,
        specs,
        sourceObj || { code: code, value: value },
        mode || "old"
    );

    setNestedValue(specs, key, result);
}

function setNestedValue(obj, path, value) {
    var parts = path.split(".");
    var last = parts.pop();
    var current = obj;

    for (var i = 0; i < parts.length; i++) {
        if (typeof current[parts[i]] !== "object" || current[parts[i]] === null) {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }

    current[last] = value;
}

