pullApiInformation = function(s, itemNumber, theNewToken){
	function pingAPI(s, itemNumber, theNewToken){
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
			hem: false,
			hemMethod: null,
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
			baseValue: null,
			secondSurface: false,
			doubleSided: false,
			buttCut: false,
			undersize: true,
			facility: null,
			notes: ""
		}
		
		var theHTTP = new HTTP(HTTP.SSL);
			theHTTP.url = "https://prism-services.digitalroominc.com/job-items?id[]=" + itemNumber
			theHTTP.authScheme = HTTP.OauthAuth;
			theHTTP.addHeader("Authorization", "Bearer " + theNewToken);
			theHTTP.timeOut = 300;
			theHTTP.get();
			
		while(!theHTTP.waitForFinished(3)){
			s.log(5, "Downloading...", theHTTP.progress() );
		}
		
		if(theHTTP.finishedStatus == HTTP.Ok && theHTTP.statusCode == 200){
			s.log(1, "Download completed successfully" );
			specs.complete = true;
		}else{
			s.log(2, "Download failed with the status code %1", theHTTP.statusCode);
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
			specs.facility = dataDump.facility;

		// If there is "rider" in the item name, don't let it undersize
		if(dataDump.item_name.toLowerCase().match(new RegExp("rider","g"))){
			specs.undersize = false;
		}

		// Loop through the order_specs and set some values based on them
		for(var k=0; k<dataDump.order_specs.length; k++){
			if(dataDump.order_specs[k].code == "GROM"){
				specs.grommets = true;
				specs.grommetMethod = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "HEMMING"){
				specs.hem = true;
				specs.hemMethod = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "PPR"){
				specs.paper = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "MATRL"){
				specs.material = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "COAT"){
				if(dataDump.order_specs[k].value != "No Coating"){
					specs.coating = true;
					specs.coatingType = dataDump.order_specs[k].value;
				}
			}
			if(dataDump.order_specs[k].code == "LAM"){
				specs.coating = true;
				specs.coatingType = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "EDGE"){
				specs.edge = true;
				specs.edgeValue = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "AFRAME"){
				specs.frame = true;
				specs.frameValue = dataDump.order_specs[k].value.replace(/,/g,'');
			}
			if(dataDump.order_specs[k].code == "MOUNT"){
				if(dataDump.order_specs[k].value != "No Mount (Print Only)"){
					specs.mount = true;
					specs.mountValue = dataDump.order_specs[k].value.replace(/,/g,'');
				}
			}
			if(dataDump.order_specs[k].code == "BASEATT"){
				specs.base = true;
				specs.baseValue = dataDump.order_specs[k].value.replace(/,/g,'');
			}
			if(dataDump.order_specs[k].code == "VIEWDIR"){
				if(dataDump.order_specs[k].value == "Installed inside, viewed outside"){
					specs.secondSurface = true;
				}
			}
			if(dataDump.order_specs[k].code == "SHAPE"){
				if(dataDump.order_specs[k].value == "Square/Rectangle"){
					specs.shape.rectangle = true;
				}
				if(dataDump.order_specs[k].value == "Circle / Oval"){
					specs.shape.oval = true;
				}
				if(dataDump.order_specs[k].value == "Circle"){
					specs.shape.oval = true;
				}
				if(dataDump.order_specs[k].value == "Custom Shape"){
					specs.shape.custom = true;
				}
				specs.shape.value = dataDump.order_specs[k].value;
			}
			if(dataDump.order_specs[k].code == "SIDE"){
				if(dataDump.order_specs[k].value == "Front and Back" ||
				dataDump.order_specs[k].value == "Front and Back (Same File)" ||
				dataDump.order_specs[k].value != "Front Only"){
					specs.doubleSided = true;
				}
			}
			if(dataDump.order_specs[k].code == "YARDFRAME"){
				if(dataDump.order_specs[k].value.toLowerCase().match(new RegExp("rider","g"))){
					specs.undersize = false;
				}
			}
		}
		return specs
	}
	return contents = pingAPI(s, itemNumber, theNewToken)
}