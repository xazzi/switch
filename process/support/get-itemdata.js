pullApiInformation = function(s, itemNumber, theNewToken, environment, dbConn, data, userInfo){
	function pingAPI(s, itemNumber, theNewToken, environment, dbConn, data, userInfo){
		var specs = {
			complete: false,
			process: null, //This should stay null, it's to allow process/string searching elsewhere.
			grommets: false,
			grommetMethod: null,
			shape: {
				rectangle: false,
				oval: false,
				custom: false,
				value: null
			},
			hem: {
				active: false,
                method: null,
                webbing: false,
                value: null
			},
			pocket: false,
			pocketTop: false,
			pocketBottom: false,
			pocketSize: null,
			mount: false,
			mountValue: null,
			itemName: null,
			paper: null,
			material: null,
			coating: false,
			coatingType: null,
			edge: false,
			edgeValue: null,
			frame: false,
			frameValue: null,
			base: false,
			baseValue: "",
			secondSurface: false,
			doubleSided: false,
			buttCut: false,
			backdrop: false,
			undersize: true,
			facility: null,
			notes: "",
			cvColors: null,
			cutType: null,
			hemValue: null,
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
			specs.shipDate = dataDump.ship_date;
			specs.dueDate = dataDump.due_date;
			specs.facilityId = "facility_id" in dataDump ? dataDump.facility_id : undefined;
			specs.facility = "facility" in dataDump ? dataDump.facility : undefined;

			addToTable(s, dbConn, "specs_item-name", specs.itemName, dataDump.job_item_id, data, userInfo);

			// Process specific item names.
			specs.retractable = specs.itemName.toLowerCase().match(new RegExp("retractable","g")) == "retractable";
			if(specs.retractable){
				addToTable(s, dbConn, "specs_retractables", specs.itemName, dataDump.job_item_id, data, userInfo);
			}
			specs.stretchTableCover = specs.itemName.toLowerCase().match(new RegExp("stretch table cover","g")) == "stretch table cover";
			specs.tableCloths = specs.itemName.replace(/ /g,'').toLowerCase().match(new RegExp("tablecloths","g")) == "tablecloths";

		// If there is "rider" in the item name, don't let it undersize
		if(specs.itemName.toLowerCase().match(new RegExp("rider","g"))){
			specs.undersize = false;
		}

		// Loop through the order_specs and set some values based on them
		for(var k=0; k<dataDump.order_specs.length; k++){
			if(dataDump.order_specs[k].code == "RP_REASON"){
				specs.reprint = true;
				specs.reprintReason = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "GROM"){
				specs.grommets = true;
				specs.grommetMethod = addToTable(s, dbConn, "options_grommets", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "HEMMING"){
				specs.finishingType = "Hem"
				specs.hem = addToTable(s, dbConn, "options_hems", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "PPR"){
				addToTable(s, dbConn, "specs_paper", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				specs.paper = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "MATRL"){
				addToTable(s, dbConn, "options_material", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				specs.material = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "COAT"){
				if(dataDump.order_specs[k].value != "No Coating"){
					specs.coating = true;
					specs.coatingType = dataDump.order_specs[k].value;
					addToTable(s, dbConn, "options_coating", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				}
			}
			if(dataDump.order_specs[k].code == "LAM"){
				specs.coating = true;
				specs.coatingType = dataDump.order_specs[k].value;
				addToTable(s, dbConn, "options_laminate", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "EDGE"){
				specs.edge = true;
				specs.edgeValue = dataDump.order_specs[k].value;
				addToTable(s, dbConn, "options_edge", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "DESC"){
				if(dataDump.order_specs[k].value.toLowerCase().match(new RegExp("replacement","g"))){
					specs.replacement = true;
					specs.undersize = false;
				}
			}
			if(dataDump.order_specs[k].code == "AFRAME"){
				addToTable(s, dbConn, "options_a-frame", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				specs.frame = true;
				specs.frameValue = dataDump.order_specs[k].value.replace(/,/g,'');
			}
			if(dataDump.order_specs[k].code == "POLPCKT"){
				specs.pocket = true;
				addToTable(s, dbConn, "options_pockets", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				specs.pocketTop = dataDump.order_specs[k].value.toLowerCase().match(new RegExp("top","g")) != undefined;
				specs.pocketBottom = dataDump.order_specs[k].value.toLowerCase().match(new RegExp("bottom","g")) != undefined;
				if(dataDump.order_specs[k].value.toLowerCase().match(new RegExp("4.5","g"))){
					specs.pocketSize = 4.5;
				}
			}
			if(dataDump.order_specs[k].code == "MOUNT"){
				addToTable(s, dbConn, "options_mount", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				if(dataDump.order_specs[k].value != "No Mount (Print Only)"){
					specs.mount = true;
					specs.mountValue = dataDump.order_specs[k].value.replace(/,/g,'');
				}
			}
			if(dataDump.order_specs[k].code == "BASEATT"){
				specs.base = true;
				specs.baseValue = dataDump.order_specs[k].value.replace(/,/g,'');
				addToTable(s, dbConn, "options_base", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
			}
			if(dataDump.order_specs[k].code == "VIEWDIR"){
				addToTable(s, dbConn, "options_view-direction", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				if(dataDump.order_specs[k].value == "Installed inside, viewed outside"){
					specs.secondSurface = true;
				}
			}
			if(dataDump.order_specs[k].code == "PRINTDR"){
				addToTable(s, dbConn, "options_print-direction", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				if(dataDump.order_specs[k].value == "Reverse Printing"){
					specs.secondSurface = true;
				}
			}
			if(dataDump.order_specs[k].code == "SHAPE"){
				addToTable(s, dbConn, "options_shape", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				if(dataDump.order_specs[k].value == "Square/Rectangle"){
					specs.shape.rectangle = true;
				}
				if(dataDump.order_specs[k].value == "Circle / Oval"){
					specs.shape.oval = true;
				}
				if(dataDump.order_specs[k].value == "Circle"){
					specs.shape.oval = true;
				}
				if(dataDump.order_specs[k].value == "Custom Shape" || dataDump.order_specs[k].value == "Custom"){
					specs.shape.custom = true;
				}
				specs.shape.value = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "SIDE"){
				addToTable(s, dbConn, "options_side", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				if(dataDump.order_specs[k].value == "Front and Back" ||
					dataDump.order_specs[k].value == "Front and Back (Same File)" ||
					dataDump.order_specs[k].value != "Front Only"){
					specs.doubleSided = true;
				}
			}
			if(dataDump.order_specs[k].code == "YARDFRAME"){
				addToTable(s, dbConn, "options_yard-frame", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				if(dataDump.order_specs[k].value.toLowerCase().match(new RegExp("rider","g"))){
					specs.undersize = false;
				}
			}
			if(dataDump.order_specs[k].code == "VINYL_CLR"){
				addToTable(s, dbConn, "options_vinyl-color", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				specs.cvColors = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "CUT"){
				addToTable(s, dbConn, "options_cut", dataDump.order_specs[k].value, dataDump.job_item_id, data, userInfo);
				specs.cutType = dataDump.order_specs[k].value;
			}
		}
		for(var k=0; k<dataDump.active_file.length; k++){
			specs.fileID = dataDump.active_file[k].file_id
		}
		return specs
	}
	return contents = pingAPI(s, itemNumber, theNewToken, environment, dbConn, data, userInfo)
}