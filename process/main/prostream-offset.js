runProstreamOffset = function(s, job, codebase){
    function run(s, job, codebase){
        try{
            // Directories
            var dir = {
                support: "C:/Scripts/" + codebase + "/switch/process/support/",
                backup: "\\\\amz-impsw-data\\IMPSW_DATA\\Backup\\"
            }

            // Read in any support directories
            eval(File.read(dir.support + "/get-token.js"));
            eval(File.read(dir.support + "/general-functions.js"));

            var token = getNewToken(s, "Production");
            
            var submitDS = loadDataset_db("Submit");
            var submit = {
                nodes: submitDS.evalToNodes("//field-list/field"),
                gangNumber: null,
                type: null
            }

            for(var i=0; i<submit.nodes.length; i++){
                if(submit.nodes.getItem(i).evalToString('tag') == "Gang Number"){
                    submit.gangNumber = submit.nodes.getItem(i).evalToString('value');
                }

                if(submit.nodes.getItem(i).evalToString('tag') == "Type"){
                    submit.type = submit.nodes.getItem(i).evalToString('value');
                }
            }

            var data = {
                stock: submit.type == "Offset" ? "Sheet_40x28" : "Sheet_19x13",
                thing: "Arlington/" + submit.type + " (Prostream)"
            }

            // Set the directory of the print files.
            dir.print = new Dir(dir.backup + submit.gangNumber + "\\Print\\")

            // Read the possible print files and target the cover-1
            data.cover = dir.print.entryList("*" + submit.gangNumber + "-1*", Dir.Files, Dir.Name).toString();
            data.itemNumber = data.cover.split('_')[1].split('.')[0];

            var specs = pingAPI(s, token, data)

            var csv = s.createNewJob();
            var csvPath = csv.createPathWithName(submit.gangNumber + ".csv", false);
            var csvFile = new File(csvPath);
                csvFile.open(File.Append);

            var infoArray = compileCSV(submit, data, dir, specs)

                writeCSV(s, csvFile, infoArray, 0);
                writeCSV(s, csvFile, infoArray, 1);

                csvFile.close()

                //csv.setHierarchyPath([data.environment,data.projectID]);
                csv.setUserEmail(job.getUserEmail());
                csv.setUserName(job.getUserName());
                csv.setUserFullName(job.getUserFullName());
                csv.setPrivateData("projectID", submit.gangNumber);
                csv.setPrivateData("type", submit.type);
                csv.setPrivateData("thing", data.thing);
                csv.sendTo(findConnectionByName_db(s, "CSV"), csvPath);

                job.sendToNull(job.getPath())

        }catch(e){
            s.log(3, "Critical Error!: " + e);
            job.setPrivateData("error", e);
            job.sendTo(findConnectionByName_db(s, "Critical Error"), job.getPath());
        }
    }
    run(s, job, codebase)
}

compileCSV = function(submit, data, dir, specs){
	// Compile the CSV information.	
	return infoArray = [
		["Project ID",submit.gangNumber],
		["Name",data.cover],
		["Artwork File",dir.print.path + "\\" + data.cover],
		["Ordered",specs.qty],
		["Stock",data.stock],
		["Grade","100 gsm"],
		["Spacing Type","Margins"],
		["Spacing",0],
		["Rotation","None"],
		["Width","100%"],
		["Height","100%"],
		["Description","null"],
		["Page Handling","OnePerTwoPages"],
		["Item Number",data.itemNumber],
		["Max Overruns",1000],
        ["Custom Label",specs.paper]
	];
}

function writeCSV(s, file, array, index){
	for(var n=0; n<array.length; n++){
		file.write(array[n][index]);
		if(n != array.length-1){
			file.write(";");
		}
	}
	file.writeLine("")
}

function pingAPI(s, token, data){
    var specs = {
        complete: false,
        qty: null,
        paper: null
    }
    
    var theHTTP = new HTTP(HTTP.SSL);
        theHTTP.url = "https://prism-services.digitalroominc.com/job-items?id[]=" + data.itemNumber
        theHTTP.authScheme = HTTP.OauthAuth;
        theHTTP.addHeader("Authorization", "Bearer " + token);
        theHTTP.timeOut = 300;
        theHTTP.get();
        
    while(!theHTTP.waitForFinished(3)){
        s.log(5, "Downloading...", theHTTP.progress());
    }
    
    if(theHTTP.finishedStatus == HTTP.Ok && theHTTP.statusCode == 200){
        specs.complete = true;
    }else{
        s.log(3, "Download failed with the status code %1", theHTTP.statusCode);
        return specs;
    }
    
    var response = theHTTP.getServerResponse().toString( "UTF-8" );
    var dataDump = JSON.parse(response).job_item;
    
        specs.qty = dataDump.qty;

    for(var ii=0; ii<dataDump.order_specs.length; ii++){
        if(dataDump.order_specs[ii].code == "PPR"){
            specs.paper = dataDump.order_specs[ii].value
        }
    }
        
    return specs
}