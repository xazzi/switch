pullApiInformation = function(s, itemNumber, theNewToken, environment, db, data, userInfo){
	function pingAPI(s, itemNumber, theNewToken, environment, db, data, userInfo){
		var specs = {
			complete: false,
			process: null, //This should stay null, it's to allow process/string searching elsewhere.
			itemName: null,
			item: {
				active: false,
				value: null,
				id: null
			},
			paper: {
				active: false,
				value: null
			},
			material: {
				active: false,
				value: null
			},
			shape: {
				active: false,
				method: null,
				value: null,
				applyProductLabel: null
			},
			corner: {
				active: false,
				method: null,
				value: null
			},
			diecut: {
				active: false,
				method: null,
				value: null,
				applyProductLabel: null
			},
			grommet: {
				active: false,
                key: null
			},
			hem: {
				value: null,
				enable: false,
                method: "None",
				side: {
					top: null,
					bottom: null,
					left: null,
					right: null
				},
				size: {
					top: null,
					bottom: null,
					left: null,
					right: null
				},
				webbing: false
			},
			pocket: {
				value: null,
                enable: false,
				method: "Inactive",
				side: {
					top: null,
					bottom: null,
					left: null,
					right: null
				},
                size: {
					top: null,
					bottom: null,
					left: null,
					right: null
				}
			},
			mount: {
				active: false,
				method: null,
				value: null
			},
			laminate: {
				active: false,
				method: null,
				value: null
			},
			coating: {
				active: false,
				method: null,
				value: null
			},
			impInstructions: {
				active: false,
				value: null
			},
			edge: {
				active: false,
				method: null,
				value: null
			},
			unwind: {
				active: false,
				value: null,
				enable : false,
				key: null,
				rotation: null
			},
			bannerstand: {
				active: false,
				value: null,
				template:{
                    id: null,
                    active: false,
                    name: null
				},
				nickname: {
					global: null,
					slc: null,
					wxm: null
				},
				displaySize: {
					global: null,
					slc: null,
					wxm: null
				},		
				enabled: false
			},
			frame: {
				active: false,
				method: null,
				value: null,
				color: null
			},
			side: {
				active: false,
				method: null,
				value: null
			},
			yardframe:{
				active: false,
				method: null,
				value: null,
				undersize: null
			},
			base: {
				active: false,
				method: null,
				value: null
			},
			display: {
				active: false,
				method: null,
				value: null
			},
			printDir: {
				active: false,
				method: null,
				value: null
			},
			viewDir: {
				active: false,
				method: null,
				value: null
			},
			disable: {
				label: {
					hem: false
				}
			},
			secondSurface: false,
			doubleSided: false,
			facility: null,
			notes: "",
			cvColors: [],
			finishingType: "No Hem",
			reprint:{
				status: false,
				reason: null
			},
			replacement: false
		}
		
		var theHTTP = new HTTP(HTTP.SSL);
			theHTTP.url = "https://prism-services.digitalroominc.com/job-items?id[]=" + itemNumber
			if(environment == "QA"){
				theHTTP.url = "https://qaprism-services.digitalroominc.com/job-items?id[]=" + itemNumber
			}
			theHTTP.authScheme = HTTP.OauthAuth;
			theHTTP.addHeader("Authorization", "Bearer " + theNewToken);
			theHTTP.timeOut = 300;
			theHTTP.get();
			
		while(!theHTTP.waitForFinished(3)){
			s.log(5, "Downloading...", theHTTP.progress());
		}
		
		if(theHTTP.finishedStatus == HTTP.Ok && theHTTP.statusCode == 200){
			//s.log(1, itemNumber + " download complete." );
			specs.complete = true;
		}else{
			s.log(3, "Download failed with the status code %1", theHTTP.statusCode);
			return specs;
		}
		
		var response = theHTTP.getServerResponse().toString( "UTF-8" );
		var dataDump = JSON.parse(response).job_item;
		
			specs.qty = dataDump.qty;
			specs.jobItemId = dataDump.job_item_id;
			specs.jobOrderId = dataDump.job_order_id;
			specs.itemName = dataDump.item_name;
			specs.width = dataDump.width;
			specs.height = dataDump.height;
			specs.facilityId = "facility_id" in dataDump ? dataDump.facility_id : undefined;
			specs.facility = "facility" in dataDump ? dataDump.facility : undefined;

			try{
				specs.ship = {
					exists: true,
					methodCode: dataDump.job_item_shipping[0].shipping_method_code,
					serviceCode: dataDump.job_item_shipping[0].shipping_service_code,
					service: dataDump.job_item_shipping[0].shipping_service
				}
			}catch(e){
				specs.ship = {
					exists: false
				}
			}

			specs.date = {
				due: dataDump.due_date,
				gangBy: dataDump.gang_by_date
			}

			/*
			// Bret was using this code to trouble shoot old data that had null due dates.
			if(specs.date.due == "undefined"){
				specs.date.due = new Date().toString().split("T")[0];
			}
			*/

			specs.item = addToTable(s, db, "specs_item-name", specs.itemName, dataDump.job_item_id, data, userInfo, null);

		// Loop through the order_specs and set some values based on them
		for(var k=0; k<dataDump.order_specs.length; k++){
			if(dataDump.order_specs[k].code == "RP_REASON"){
				specs.reprint.status = true;
				specs.reprint.reason = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "GROM"){
				specs.grommet = addToTable(s, db, "options_grommets", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "HEMMING"){
				if(dataDump.order_specs[k].value != "None"){
					specs.finishingType = "Hem"
					specs.hem = addToTable(s, db, "options_hems", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
				}
			}
			if(dataDump.order_specs[k].code == "PPR"){
				specs.paper = addToTable(s, db, "specs_paper", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "MATRL"){
				specs.material = addToTable(s, db, "options_material", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "COAT"){
				specs.coating = addToTable(s, db, "options_coating", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "LAM"){
				specs.laminate = addToTable(s, db, "options_laminate", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "WIND"){
				specs.unwind = addToTable(s, db, "options_unwind", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "BANNERSTAND" || dataDump.order_specs[k].code == "BASEATT"){
				specs.bannerstand = addToTable(s, db, "options_bannerstand", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, specs);

				// Pull the rectactable template name from the database.
				db.general.execute("SELECT * FROM digital_room.`bannerstand_retractable` WHERE id = '" + specs.bannerstand.template.id + "';");
				if(db.general.isRowAvailable()){
					db.general.fetchRow();
					specs.bannerstand.template.active = true;
					specs.bannerstand.template.name = db.general.getString(1)
				}
			}
			if(dataDump.order_specs[k].code == "EDGE"){
				specs.edge = addToTable(s, db, "options_edge", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "AFRAME"){
				specs.frame = addToTable(s, db, "options_a-frame", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "POLPCKT"){
				specs.pocket = addToTable(s, db, "options_pockets", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "MOUNT"){
				specs.mount = addToTable(s, db, "options_mount", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "BASEATT"){
				specs.base = addToTable(s, db, "options_base", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "DISPOPT"){
				specs.display = addToTable(s, db, "options_display", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "VIEWDIR"){
				specs.viewDir = addToTable(s, db, "options_view-direction", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
				if(specs.viewDir.method == "2nd"){
					specs.secondSurface = true;
				}
			}
			if(dataDump.order_specs[k].code == "PRINTDR"){
				specs.printDir = addToTable(s, db, "options_print-direction", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
				if(specs.printDir.method == "2nd"){
					specs.secondSurface = true;
				}
			}
			if(dataDump.order_specs[k].code == "IMPINST"){
				specs.impInstructions.active = true;
				specs.impInstructions.value = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "SHAPE"){
				specs.shape = addToTable(s, db, "options_shape", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "CORNER"){
				specs.corner = addToTable(s, db, "options_corner", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "DIECUT"){
				specs.diecut = addToTable(s, db, "options_diecut", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "SIDE"){
				specs.side = addToTable(s, db, "options_side", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
				if(specs.side.method == "FB" || specs.side.method == "FBsame"){
					specs.doubleSided = true;
				}
			}
			if(dataDump.order_specs[k].code == "YARDFRAME"){
				specs.yardframe = addToTable(s, db, "options_yard-frame", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "VINYL_CLR"){
				var temp = dataDump.order_specs[k].value.split(',');
				for(var r in temp){
					addToTable(s, db, "options_vinyl-color", temp[r].replace(/^\s+/g, ''), dataDump.job_item_id, data, userInfo, null);
					specs.cvColors.push(temp[r].replace(/^\s+/g, ''))
				}
			}
			if(dataDump.order_specs[k].code == "CUT"){
				specs.cut = addToTable(s, db, "options_cut", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo, null);
			}
			if(dataDump.order_specs[k].code == "DESC"){
				if(dataDump.order_specs[k].value.toLowerCase().match(new RegExp("replacement","g"))){
					specs.replacement = true;
				}
			}
		}

		// TO DO - Determine if this is the best method to assign the paper if it doesn't exist in IMS.
		// Would it be better to do a more robust check outside of this?
		if(!specs.paper.active){
			specs.paper = specs.material
		}

		// Loop through the display specs.
		for(var k=0; k<dataDump.display_specs.length; k++){
			if(dataDump.display_specs[k].attribute_name == "Material"){
				specs.material = addToTable(s, db, "options_material", dataDump.display_specs[k].attr_value, dataDump.job_item_id, data, userInfo, null);
			}
		}

		// Pull the active file id.
		for(var k=0; k<dataDump.active_file.length; k++){
			specs.fileID = dataDump.active_file[k].file_id
		}
		return specs
	}
	return contents = pingAPI(s, itemNumber, theNewToken, environment, db, data, userInfo)
}