var parent = [];
var apply, facilityCheck;

setPhoenixMarks = function(s, folder, matInfo, data, orderArray, product, marksArray, advancedSettings){
    function readFiles(s, folder, matInfo, data, orderArray, product, marksArray, advancedSettings){

        var files = folder.entryList("*.json", Dir.Files, Dir.Name);

        for(var i=0; i<files.length; i++){
            var str = File.read(folder.path + "/" + files[i], "UTF-8");
            var dump = JSON.parse(str);

            // Loop through the marks in that file.
            for(var j in dump.parameters){

                // Check the mark key, skip if the mark key doesn't match or isn't "None".
                if(dump.parameters[j].key != orderArray.grommet.key){
                    if(dump.parameters[j].key != "None"){
                        continue;
                    }
                }

                // Check if the facility is enabled.
                facilityCheck = false;
                for(var w in dump.parameters[j].facility){
                    if(dump.parameters[j].facility[w].id == orderArray.facilityId){
                        if(dump.parameters[j].facility[w].enabled){
                            facilityCheck = true;
                            break;
                        }
                    }
                }

                // If the facility is not enabled, continue through the parent loop.
                if(!facilityCheck){
                    continue;
                }

                // Check for required products
                if(!contains(dump.parameters[j].process.requirements, data.prodName)){
                    if(!contains(dump.parameters[j].process.requirements, "All")){
                        continue;
                    }
                }

                // Check for rejected products
                if(contains(dump.parameters[j].process.rejections, data.prodName)){
                    continue;
                }
                
                // Check for required subprocesses
                if(!contains(dump.parameters[j].subprocess.requirements, product.subprocess.name)){
                    continue;
                }

                // Check for rejected subprocesses
                if(contains(dump.parameters[j].subprocess.rejections, product.subprocess.name)){
                    continue;
                }

                // Reset apply back to true for the checkParameters function
                apply = true;

                // Check the requirements.
                checkParameters(s, "requirements", dump.parameters[j].specs.requirements, matInfo, product, data, orderArray, advancedSettings);

                // Check for any rejections.
                checkParameters(s, "rejections", dump.parameters[j].specs.rejections, matInfo, product, data, orderArray, advancedSettings);

                // If any of the above checks failed, continue through the array.
                if(!apply){
                    continue;
                }

                // If all of the above criteria are met, add the associated marks to the array.
                for(var k in dump.parameters[j].settings){
                    var group = data.facility.destination
                    if(dump.parameters[j].settings[k].group.toLowerCase() == "global"){
                        group = "Global"
                    }
                    if(dump.parameters[j].settings[k].dir == "/Product Info/"){
                        marksArray.push(group + dump.parameters[j].settings[k].dir + matInfo.labelOffset + "/" + dump.parameters[j].settings[k].name + data.scale);
                    }else{
                        marksArray.push(group + dump.parameters[j].settings[k].dir + dump.parameters[j].settings[k].name + data.scale);
                    }
                }
            }
        }
    }
    readFiles(s, folder, matInfo, data, orderArray, product, marksArray, advancedSettings);
}

function checkParameters(s, type, parameter, matInfo, product, data, orderArray, advancedSettings){

    // If it's already false then return out of the function.
    if(!apply){
        return;
    }

    // Loop through the parameters.
    for(var l in parameter){

        // If the parameter is an nested object, dig further.
        if(typeof parameter[l] === 'object'){
            parent.push(l);
            checkParameters(s, type, parameter[l], matInfo, product, data, orderArray, advancedSettings);

        // If the parameter is an array
        }else if(parameter instanceof Array){
            if(type == "requirements"){
                var thing = parent.join('.');
                if(!contains(parameter, eval(thing))){
                    apply = false;
                    break;
                }
            }
            if(type == "rejections"){
                var thing = parent.join('.');
                if(contains(parameter, eval(thing))){
                    apply = false;
                    break;
                }
            }

        // If the parameter is not in an array.
        }else{
            if(type == "requirements"){
                var thing = parent.join('.');
                if(parameter[l] != eval(thing + "." + l)){
                    apply = false;
                    break;
                }
            }
            if(type == "rejections"){
                var thing = parent.join('.');
                if(parameter[l] == eval(thing + "." + l)){
                    apply = false;
                    break;
                }
            }
        }
    }
    
    // Remove the last entry of the array when that level of nest is completed.
    parent = parent.slice(0,-1);
}