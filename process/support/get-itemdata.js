pullApiInformation = function(s, itemNumber, theNewToken, environment, dbConn, data, userInfo){
	function pingAPI(s, itemNumber, theNewToken, environment, dbConn, data, userInfo){
		var specs = {
			complete: false,
			process: null, //This should stay null, it's to allow process/string searching elsewhere.
			itemName: null,
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
				value: null
			},
			grommet: {
				active: false,
                key: null
			},
			hem: {
				active: false,
                method: null,
                webbing: false,
                value: null
			},
			pocket: {
				active: false,
                method: null,
                size: null,
                value: null
			},
			mount: {
				active: false,
				method: null,
				value: null
			},
			coating: {
				active: false,
				method: null,
				value: null
			},
			edge: {
				active: false,
				method: null,
				value: null
			},
			frame: {
				active: false,
				method: null,
				value: null
			},
			yardframe:{
				active: false
			},
			base: {
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
			laminate: {
				active: false
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
			cvColors: null,
			finishingType: "No Hem",
			reprint: false,
			reprintReason: null,
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
			s.log(1, "Download completed successfully" );
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

			specs.date = {
				due: dataDump.due_date,
				gangBy: dataDump.gang_by_date
			}

			addToTable(s, dbConn, "specs_item-name", specs.itemName, dataDump.job_item_id, data, userInfo);

		// Loop through the order_specs and set some values based on them
		for(var k=0; k<dataDump.order_specs.length; k++){
			if(dataDump.order_specs[k].code == "RP_REASON"){
				specs.reprint = true;
				specs.reprintReason = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "GROM"){
				specs.grommet = addToTable(s, dbConn, "options_grommets", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo)
			}
			if(dataDump.order_specs[k].code == "HEMMING"){
				specs.finishingType = "Hem"
				specs.hem = addToTable(s, dbConn, "options_hems", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "PPR"){
				specs.paper = addToTable(s, dbConn, "specs_paper", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "MATRL"){
				specs.material = addToTable(s, dbConn, "options_material", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "COAT"){
				specs.coating = addToTable(s, dbConn, "options_coating", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "LAM"){
				specs.laminate = addToTable(s, dbConn, "options_laminate", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "EDGE"){
				specs.edge = addToTable(s, dbConn, "options_edge", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "AFRAME"){
				specs.frame = addToTable(s, dbConn, "options_a-frame", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "POLPCKT"){
				specs.pocket = addToTable(s, dbConn, "options_pockets", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "MOUNT"){
				specs.mount = addToTable(s, dbConn, "options_mount", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "BASEATT"){
				specs.base = addToTable(s, dbConn, "options_base", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "VIEWDIR"){
				specs.viewDir = addToTable(s, dbConn, "options_view-direction", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				if(specs.viewDir.method == "2nd"){
					specs.secondSurface = true;
				}
			}
			if(dataDump.order_specs[k].code == "PRINTDR"){
				specs.printDir = addToTable(s, dbConn, "options_print-direction", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				if(specs.printDir.method == "2nd"){
					specs.secondSurface = true;
				}
			}
			if(dataDump.order_specs[k].code == "SHAPE"){
				specs.shape = addToTable(s, dbConn, "options_shape", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "SIDE"){
				specs.side = addToTable(s, dbConn, "options_side", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				if(specs.side.method == "FB" || specs.side.method == "FBsame"){
					specs.doubleSided = true;
				}
			}
			if(dataDump.order_specs[k].code == "YARDFRAME"){
				specs.yardframe = addToTable(s, dbConn, "options_yard-frame", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "VINYL_CLR"){
				addToTable(s, dbConn, "options_vinyl-color", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				specs.cvColors = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "CUT"){
				specs.cut = addToTable(s, dbConn, "options_cut", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "DESC"){
				if(dataDump.order_specs[k].value.toLowerCase().match(new RegExp("replacement","g"))){
					specs.replacement = true;
				}
			}
		}
		for(var k=0; k<dataDump.active_file.length; k++){
			specs.fileID = dataDump.active_file[k].file_id
		}
		return specs
	}
	return contents = pingAPI(s, itemNumber, theNewToken, environment, dbConn, data, userInfo)
}